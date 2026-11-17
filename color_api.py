
import base64
import io

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

router = APIRouter(prefix="/color", tags=["Color Processing"])

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 20_000_000

OPERATIONS = {
    "negative",
    "slicing",
    "pseudocolor",
    "enhancement",
    "models",
    "segmentation",
}

COLORMAPS = {
    "JET": cv2.COLORMAP_JET,
    "HOT": cv2.COLORMAP_HOT,
    "OCEAN": cv2.COLORMAP_OCEAN,
    "VIRIDIS": cv2.COLORMAP_VIRIDIS,
    "TURBO": cv2.COLORMAP_TURBO,
    "PLASMA": cv2.COLORMAP_PLASMA,
    "INFERNO": cv2.COLORMAP_INFERNO,
    "BONE": cv2.COLORMAP_BONE,
}


def encode_image(image):
    image = np.clip(image, 0, 255).astype(np.uint8)

    if image.ndim == 3:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    ok, buffer = cv2.imencode(".png", image)

    if not ok:
        raise ValueError("Unable to encode image.")

    encoded = base64.b64encode(buffer.tobytes()).decode("utf-8")
    return "data:image/png;base64," + encoded


def hex_to_rgb(value):
    value = value.lstrip("#")

    if len(value) != 6:
        raise ValueError("Invalid hex color.")

    return np.array(
        [int(value[i:i + 2], 16) for i in (0, 2, 4)],
        dtype=np.float32,
    )


def get_hsi(image):
    rgb = image.astype(np.float32) / 255.0
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    numerator = 0.5 * ((r - g) + (r - b))
    denominator = np.sqrt(
        (r - g) ** 2 + (r - b) * (g - b)
    )

    theta = np.arccos(
        np.clip(
            numerator / (denominator + 1e-8),
            -1,
            1,
        )
    )

    hue = np.where(b <= g, theta, 2 * np.pi - theta)
    hue = np.where(denominator < 1e-7, 0, hue)

    minimum = np.minimum(np.minimum(r, g), b)
    total = r + g + b

    saturation = np.where(
        total > 1e-7,
        1 - (3 * minimum / (total + 1e-8)),
        0,
    )

    intensity = total / 3

    return [
        np.uint8(np.clip(hue / (2 * np.pi) * 255, 0, 255)),
        np.uint8(np.clip(saturation * 255, 0, 255)),
        np.uint8(np.clip(intensity * 255, 0, 255)),
    ]


def color_models(image, model):
    r, g, b = cv2.split(image)

    if model == "RGB":
        return {
            "Red": r,
            "Green": g,
            "Blue": b,
        }

    if model == "CMY":
        return {
            "Cyan": 255 - r,
            "Magenta": 255 - g,
            "Yellow": 255 - b,
        }

    if model == "CMYK":
        rgb = image.astype(np.float32) / 255.0
        k = 1 - np.max(rgb, axis=2)
        denominator = np.maximum(1 - k, 1e-8)

        c = (1 - rgb[:, :, 0] - k) / denominator
        m = (1 - rgb[:, :, 1] - k) / denominator
        y = (1 - rgb[:, :, 2] - k) / denominator

        c = np.where(k >= 1, 0, c)
        m = np.where(k >= 1, 0, m)
        y = np.where(k >= 1, 0, y)

        return {
            "Cyan": np.uint8(np.clip(c * 255, 0, 255)),
            "Magenta": np.uint8(np.clip(m * 255, 0, 255)),
            "Yellow": np.uint8(np.clip(y * 255, 0, 255)),
            "Black": np.uint8(np.clip(k * 255, 0, 255)),
        }

    if model == "HSI":
        h, s, i = get_hsi(image)
        return {
            "Hue": h,
            "Saturation": s,
            "Intensity": i,
        }

    if model == "YCbCr":
        # OpenCV stores the chroma channels in Y, Cr, Cb order.
        ycrcb = cv2.cvtColor(image, cv2.COLOR_RGB2YCrCb)
        y, cr, cb = cv2.split(ycrcb)

        return {
            "Y (Luma)": y,
            "Cb": cb,
            "Cr": cr,
        }

    raise ValueError("Unsupported color model.")


def process_color(
    image,
    operation,
    selected_color,
    tolerance,
    colormap,
    brightness,
    contrast,
    saturation,
    red_gain,
    green_gain,
    blue_gain,
    hue_center,
    hue_range,
    sat_min,
    val_min,
    model,
):
    extra = {}

    if operation == "negative":
        output = 255 - image
        explanation = "RGB color negative: s = 255 - r."

    elif operation == "slicing":
        target = hex_to_rgb(selected_color)

        # Euclidean distance in RGB color space.
        distance = np.linalg.norm(
            image.astype(np.float32) - target,
            axis=2,
        )

        mask = distance <= tolerance

        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        output = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
        output[mask] = image[mask]

        extra["mask"] = encode_image(
            np.uint8(mask) * 255
        )
        extra["selected_pixels_percent"] = round(
            float(mask.mean() * 100), 2
        )
        explanation = (
            "Color slicing retains pixels near the selected RGB "
            "color and converts the remaining pixels to grayscale."
        )

    elif operation == "pseudocolor":
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        if colormap not in COLORMAPS:
            raise ValueError("Unsupported colormap.")

        mapped = cv2.applyColorMap(
            gray,
            COLORMAPS[colormap],
        )
        output = cv2.cvtColor(mapped, cv2.COLOR_BGR2RGB)

        explanation = (
            "Pseudocolor maps grayscale intensities to "
            "artificial colors using the selected colormap."
        )

    elif operation == "enhancement":
        result = image.astype(np.float32)

        gains = np.array(
            [red_gain, green_gain, blue_gain],
            dtype=np.float32,
        )

        result *= gains[None, None, :]
        result = np.clip(result, 0, 255).astype(np.uint8)

        hsv = cv2.cvtColor(result, cv2.COLOR_RGB2HSV)
        hsv = hsv.astype(np.float32)
        hsv[:, :, 1] *= saturation
        hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)

        result = cv2.cvtColor(
            hsv.astype(np.uint8),
            cv2.COLOR_HSV2RGB,
        )

        # Brightness and contrast adjustment.
        result = (
            result.astype(np.float32) - 127.5
        ) * contrast + 127.5 + brightness

        output = np.uint8(np.clip(result, 0, 255))

        explanation = (
            "Full-color enhancement adjusts RGB channel gains, "
            "HSV saturation, brightness, and contrast."
        )

    elif operation == "segmentation":
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)

        hue = hsv[:, :, 0].astype(np.int16)

        # Hue is circular, so red wraps around the 0/179 boundary.
        distance = np.abs(hue - hue_center)
        distance = np.minimum(distance, 180 - distance)

        mask = (
            (distance <= hue_range)
            & (hsv[:, :, 1] >= sat_min)
            & (hsv[:, :, 2] >= val_min)
        )

        mask_uint8 = np.uint8(mask) * 255
        output = cv2.bitwise_and(
            image,
            image,
            mask=mask_uint8,
        )

        extra["mask"] = encode_image(mask_uint8)
        extra["selected_pixels_percent"] = round(
            float(mask.mean() * 100), 2
        )

        explanation = (
            "HSV color segmentation isolates pixels inside "
            "the selected hue, saturation, and value thresholds."
        )

    elif operation == "models":
        channels = color_models(image, model)

        extra["channels"] = {
            name: encode_image(channel)
            for name, channel in channels.items()
        }

        output = image.copy()
        explanation = (
            f"The {model} model separates image information "
            "into its individual color components."
        )

    else:
        raise ValueError("Invalid operation.")

    return output, extra, explanation


@router.post("/process")
async def color_process(
    file: UploadFile = File(...),
    operation: str = Form("negative"),
    selected_color: str = Form("#ff0000"),
    tolerance: int = Form(80),
    colormap: str = Form("JET"),
    brightness: int = Form(0),
    contrast: float = Form(1.0),
    saturation: float = Form(1.0),
    red_gain: float = Form(1.0),
    green_gain: float = Form(1.0),
    blue_gain: float = Form(1.0),
    hue_center: int = Form(0),
    hue_range: int = Form(15),
    sat_min: int = Form(70),
    val_min: int = Form(50),
    model: str = Form("RGB"),
):
    if operation not in OPERATIONS:
        raise HTTPException(400, "Invalid operation.")

    if not (
        0 <= tolerance <= 442
        and -100 <= brightness <= 100
        and 0.2 <= contrast <= 3
        and 0 <= saturation <= 3
        and all(
            0 <= gain <= 3
            for gain in (red_gain, green_gain, blue_gain)
        )
        and 0 <= hue_center <= 179
        and 0 <= hue_range <= 90
        and 0 <= sat_min <= 255
        and 0 <= val_min <= 255
    ):
        raise HTTPException(400, "Invalid processing parameters.")

    if colormap not in COLORMAPS:
        raise HTTPException(400, "Invalid colormap.")

    if model not in ("RGB", "CMY", "CMYK", "HSI", "YCbCr"):
        raise HTTPException(400, "Invalid color model.")

    try:
        data = await file.read(MAX_BYTES + 1)

        if len(data) > MAX_BYTES:
            raise HTTPException(413, "Image exceeds 10 MB.")

        with Image.open(io.BytesIO(data)) as img:
            if img.format not in ("JPEG", "PNG"):
                raise HTTPException(
                    400,
                    "Only PNG and JPEG images are supported.",
                )

            if img.width * img.height > MAX_PIXELS:
                raise HTTPException(
                    413,
                    "Image dimensions are too large.",
                )

            image = np.array(img.convert("RGB"))

        output, extra, explanation = process_color(
            image=image,
            operation=operation,
            selected_color=selected_color,
            tolerance=tolerance,
            colormap=colormap,
            brightness=brightness,
            contrast=contrast,
            saturation=saturation,
            red_gain=red_gain,
            green_gain=green_gain,
            blue_gain=blue_gain,
            hue_center=hue_center,
            hue_range=hue_range,
            sat_min=sat_min,
            val_min=val_min,
            model=model,
        )

        return {
            "operation": operation,
            "width": int(image.shape[1]),
            "height": int(image.shape[0]),
            "original": encode_image(image),
            "processed": encode_image(output),
            "explanation": explanation,
            **extra,
        }

    except HTTPException:
        raise
    except (
        ValueError,
        UnidentifiedImageError,
        OSError,
        cv2.error,
    ) as exc:
        raise HTTPException(
            400,
            f"Unable to process image: {exc}",
        )

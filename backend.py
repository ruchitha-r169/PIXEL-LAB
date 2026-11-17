from color_api import router as color_router
import base64
import io

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from skimage.metrics import structural_similarity

from image_processor import (
    apply_smoothing,
    extract_laplacian,
    laplacian_preview,
    apply_sharpening,
    apply_gamma_correction,
)

app = FastAPI(title="PixelLab Image Processing API")
app.include_router(color_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 20_000_000


def image_to_data_url(image):
    if image.dtype != np.uint8:
        image = np.clip(image, 0, 255).astype(np.uint8)

    if image.ndim == 3:
        encoded_image = cv2.cvtColor(
            image, cv2.COLOR_RGB2BGR
        )
    else:
        encoded_image = image

    success, buffer = cv2.imencode(".png", encoded_image)

    if not success:
        raise ValueError("Unable to encode the processed image.")

    encoded = base64.b64encode(
        buffer.tobytes()
    ).decode("utf-8")

    return f"data:image/png;base64,{encoded}"


def calculate_image_statistics(image):
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    histogram = cv2.calcHist(
        [gray], [0], None, [256], [0, 256]
    ).flatten()

    return {
        "mean": round(float(np.mean(gray)), 3),
        "std_dev": round(float(np.std(gray)), 3),
        "min": int(np.min(gray)),
        "max": int(np.max(gray)),
        "histogram": histogram.astype(int).tolist(),
    }


def calculate_quality_metrics(original, enhanced):
    original_float = original.astype(np.float64)
    enhanced_float = enhanced.astype(np.float64)

    mse = float(
        np.mean((original_float - enhanced_float) ** 2)
    )

    if mse == 0:
        psnr = None
    else:
        psnr = float(
            10 * np.log10((255.0 ** 2) / mse)
        )

    min_dimension = min(original.shape[:2])

    if min_dimension < 3:
        ssim = None
    else:
        win_size = min(7, min_dimension)

        if win_size % 2 == 0:
            win_size -= 1

        ssim = float(
            structural_similarity(
                original,
                enhanced,
                channel_axis=2,
                data_range=255,
                win_size=win_size,
            )
        )

    return {
        "mse": round(mse, 4),
        "psnr": round(psnr, 4) if psnr is not None else None,
        "ssim": round(ssim, 6) if ssim is not None else None,
    }


def calculate_analysis(original, final):
    original_stats = calculate_image_statistics(original)
    enhanced_stats = calculate_image_statistics(final)

    quality = calculate_quality_metrics(original, final)

    return {
        "original": original_stats,
        "enhanced": enhanced_stats,
        "brightness_change": round(
            enhanced_stats["mean"] - original_stats["mean"], 3
        ),
        "contrast_change": round(
            enhanced_stats["std_dev"] - original_stats["std_dev"], 3
        ),
        "quality": quality,
    }


@app.get("/")
def home():
    return {"message": "PixelLab API is running"}


@app.post("/process")
async def process_image(
    file: UploadFile = File(...),
    method: str = Form("Median"),
    kernel_size: int = Form(3),
    strength: float = Form(0.5),
    gamma: float = Form(1.0),
):
    if method not in ("Median", "Box (Averaging)"):
        raise HTTPException(400, "Invalid smoothing method.")

    if kernel_size not in (3, 5, 7, 9, 11):
        raise HTTPException(
            400, "Kernel size must be 3, 5, 7, 9, or 11."
        )

    if not (0 <= strength <= 3):
        raise HTTPException(
            400, "Sharpening strength must be between 0 and 3."
        )

    if not (0.1 <= gamma <= 3):
        raise HTTPException(
            400, "Gamma must be between 0.1 and 3."
        )

    try:
        data = await file.read(MAX_FILE_BYTES + 1)

        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(
                413, "Image exceeds the 10 MB limit."
            )

        with Image.open(io.BytesIO(data)) as image:
            if image.format not in ("PNG", "JPEG"):
                raise HTTPException(
                    400, "Only PNG and JPEG images are supported."
                )

            if image.width * image.height > MAX_PIXELS:
                raise HTTPException(
                    413, "Image dimensions are too large."
                )

            original = np.array(image.convert("RGB"))

        smoothed = apply_smoothing(
            original,
            method=method,
            kernel_size=kernel_size,
        )

        laplacian = extract_laplacian(smoothed)
        edges = laplacian_preview(laplacian)

        sharpened = apply_sharpening(
            smoothed,
            laplacian,
            strength=strength,
        )

        final = apply_gamma_correction(
            sharpened,
            gamma=gamma,
        )

        height, width = original.shape[:2]

        analysis = calculate_analysis(original, final)

        return {
            "width": width,
            "height": height,
            "stages": {
                "Original": image_to_data_url(original),
                "Smoothed": image_to_data_url(smoothed),
                "Laplacian": image_to_data_url(edges),
                "Sharpened": image_to_data_url(sharpened),
                "Final": image_to_data_url(final),
            },
            "analysis": analysis,
        }

    except HTTPException:
        raise

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        cv2.error,
    ) as exc:
        raise HTTPException(
            400, f"Unable to process image: {exc}"
        )

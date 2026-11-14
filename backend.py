
import base64
import io

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from image_processor import (
    apply_smoothing,
    extract_laplacian,
    laplacian_preview,
    apply_sharpening,
    apply_gamma_correction,
)

app = FastAPI(title="PixelLab Image Processing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
        encoded_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    else:
        encoded_image = image

    success, buffer = cv2.imencode(".png", encoded_image)

    if not success:
        raise ValueError("Unable to encode the processed image.")

    encoded = base64.b64encode(buffer.tobytes()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


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
        raise HTTPException(400, "Kernel size must be 3, 5, 7, 9, or 11.")

    if not (0 <= strength <= 3):
        raise HTTPException(400, "Sharpening strength must be between 0 and 3.")

    if not (0.1 <= gamma <= 3):
        raise HTTPException(400, "Gamma must be between 0.1 and 3.")

    try:
        data = await file.read(MAX_FILE_BYTES + 1)

        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(413, "Image exceeds the 10 MB limit.")

        with Image.open(io.BytesIO(data)) as image:
            if image.format not in ("PNG", "JPEG"):
                raise HTTPException(400, "Only PNG and JPEG images are supported.")

            if image.width * image.height > MAX_PIXELS:
                raise HTTPException(413, "Image dimensions are too large.")

            original = np.array(image.convert("RGB"))

        smoothed = apply_smoothing(
            original, method=method, kernel_size=kernel_size
        )

        laplacian = extract_laplacian(smoothed)
        edges = laplacian_preview(laplacian)

        sharpened = apply_sharpening(
            smoothed, laplacian, strength=strength
        )

        final = apply_gamma_correction(
            sharpened, gamma=gamma
        )

        height, width = original.shape[:2]

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
        }

    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError, cv2.error) as exc:
        raise HTTPException(400, f"Unable to process image: {exc}")

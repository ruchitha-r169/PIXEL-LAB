
import cv2
import numpy as np
from PIL import Image


def load_image(uploaded_file):
    """Load an uploaded image as an RGB NumPy array."""
    image = Image.open(uploaded_file).convert("RGB")
    return np.array(image)


def apply_smoothing(image, method="Median", kernel_size=3):
    """Reduce noise using median or averaging filtering."""
    kernel_size = int(kernel_size)

    if kernel_size < 3 or kernel_size % 2 == 0:
        raise ValueError("Kernel size must be odd and at least 3.")

    if method == "Median":
        return cv2.medianBlur(image, kernel_size)

    if method == "Box (Averaging)":
        return cv2.blur(image, (kernel_size, kernel_size))

    raise ValueError("Unknown smoothing method.")


def extract_laplacian(image):
    """Calculate the signed Laplacian using a negative-center kernel."""
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    kernel = np.array([
        [0, 1, 0],
        [1, -4, 1],
        [0, 1, 0]
    ], dtype=np.float32)

    return cv2.filter2D(
        gray.astype(np.float32),
        cv2.CV_32F,
        kernel,
        borderType=cv2.BORDER_REFLECT
    )


def laplacian_preview(laplacian):
    """Display positive and negative edges using absolute magnitude."""
    return cv2.convertScaleAbs(laplacian)


def apply_sharpening(image, laplacian, strength=1.0):
    """Sharpen the smoothed RGB image using the signed Laplacian."""
    image_float = image.astype(np.float32)

    laplacian_3d = laplacian[:, :, np.newaxis]

    sharpened = image_float - float(strength) * laplacian_3d

    return np.clip(sharpened, 0, 255).astype(np.uint8)


def apply_gamma_correction(image, gamma=1.0):
    """Apply power-law transformation to normalized image intensities."""
    gamma = float(gamma)

    if gamma <= 0:
        raise ValueError("Gamma must be greater than zero.")

    normalized = image.astype(np.float32) / 255.0
    corrected = np.power(normalized, gamma) * 255.0

    return np.clip(corrected, 0, 255).astype(np.uint8)

"""
Cloudinary image upload/delete service for UNIFIND.
Initializes the SDK once at import time using settings from config.py.
"""
import logging
import re
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException, status
from config import settings

logger = logging.getLogger(__name__)

# --- SDK initialisation (runs once at import) ---
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

# Constants
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
CLOUDINARY_URL_PATTERN = re.compile(
    r"^https://res\.cloudinary\.com/" + re.escape(settings.CLOUDINARY_CLOUD_NAME) + r"/"
)


def is_cloudinary_url(url: str) -> bool:
    """Return True if the URL belongs to this project's Cloudinary account."""
    return bool(CLOUDINARY_URL_PATTERN.match(url))


async def upload_product_image(file: UploadFile) -> dict:
    """
    Upload a single product image to Cloudinary.

    Returns:
        {"url": str, "public_id": str}

    Raises:
        HTTPException 400  — invalid file type or size
        HTTPException 502  — Cloudinary upload failure
    """
    # --- Validate MIME type ---
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Allowed: jpeg, png, webp.",
        )

    # --- Read and size-check ---
    data = await file.read()
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds 5 MB limit ({len(data) / 1024 / 1024:.1f} MB received).",
        )

    # --- Upload ---
    try:
        result = cloudinary.uploader.upload(
            data,
            upload_preset=settings.CLOUDINARY_UPLOAD_PRESET,
            folder="unifind/products",
            resource_type="image",
            allowed_formats=["jpg", "png", "webp"],
            transformation=[{"quality": "auto", "fetch_format": "auto"}],
        )
    except cloudinary.exceptions.Error as exc:
        logger.error("Cloudinary upload failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image upload failed. Please try again.",
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error during Cloudinary upload: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Image upload failed due to an unexpected error.",
        ) from exc

    return {"url": result["secure_url"], "public_id": result["public_id"]}


def delete_product_image(public_id: str) -> bool:
    """
    Delete an image from Cloudinary by public_id.

    Returns True on success, False if not found.
    Raises HTTPException 502 on unexpected Cloudinary errors.
    Failures here are logged but never surface to callers that don't need to handle them
    (e.g. product deletion) — callers that do care should let the exception propagate.
    """
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        if result.get("result") == "ok":
            return True
        if result.get("result") == "not found":
            logger.warning("Cloudinary image not found for deletion: %s", public_id)
            return False
        logger.error("Unexpected Cloudinary destroy response: %s", result)
        return False
    except cloudinary.exceptions.Error as exc:
        logger.error("Cloudinary delete failed for %s: %s", public_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to delete image from storage.",
        ) from exc


def extract_public_id(cloudinary_url: str) -> str | None:
    """
    Extract the Cloudinary public_id from a secure URL.

    Example:
        https://res.cloudinary.com/demo/image/upload/v123/unifind/products/abc.jpg
        → unifind/products/abc
    """
    try:
        # Everything after /upload/v<version>/ up to (but not including) the extension
        match = re.search(r"/upload/(?:v\d+/)?(.+?)(?:\.[a-zA-Z]+)?$", cloudinary_url)
        return match.group(1) if match else None
    except Exception:
        return None

"""
Image upload endpoints for UNIFIND.
Accepts files server-side, uploads to Cloudinary, returns secure URLs.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from typing import List
from auth import get_current_user
from services.cloudinary_service import upload_product_image

router = APIRouter(prefix="/upload")

MAX_IMAGES_PER_REQUEST = 5


@router.post("/product-image", status_code=status.HTTP_201_CREATED)
async def upload_single_product_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Upload a single product image.
    Returns: { "url": str, "public_id": str }
    """
    result = await upload_product_image(file)
    return result


@router.post("/product-images", status_code=status.HTTP_201_CREATED)
async def upload_multiple_product_images(
    files: List[UploadFile] = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Upload up to 5 product images in one request.
    Returns: { "urls": [str], "public_ids": [str] }
    """
    if len(files) > MAX_IMAGES_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_IMAGES_PER_REQUEST} images per upload.",
        )

    urls = []
    public_ids = []

    for file in files:
        result = await upload_product_image(file)
        urls.append(result["url"])
        public_ids.append(result["public_id"])

    return {"urls": urls, "public_ids": public_ids}

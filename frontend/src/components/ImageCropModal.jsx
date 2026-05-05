import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';

const ImageCropModal = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Crop Profile Photo</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative h-96 bg-slate-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round"
            showGrid={false}
          />
        </div>

        {/* Zoom Control */}
        <div className="px-6 py-4 border-b border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to create cropped image
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(file);
      }, 'image/jpeg', 0.95);
    };
    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};

export default ImageCropModal;

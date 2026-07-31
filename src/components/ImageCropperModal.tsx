import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'motion/react';
import { X, Check, Loader2 } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  aspectRatio: number;
  onCropComplete: (base64Result: string) => void;
  onClose: () => void;
}

export default function ImageCropperModal({ imageSrc, aspectRatio, onCropComplete, onClose }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteEvent = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createSafeImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createSafeImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('No 2d context');

    // Restrict output size radically to save database bandwidth (Postgres TEXT limit constraint protocol)
    const MAX_DIM = aspectRatio === 1 ? 400 : 1200;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
      if (targetWidth > targetHeight) {
        targetHeight *= MAX_DIM / targetWidth;
        targetWidth = MAX_DIM;
      } else {
        targetWidth *= MAX_DIM / targetHeight;
        targetHeight = MAX_DIM;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBase64);
    } catch (e) {
      console.error(e);
      alert('Failed to process image crop.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10 z-10 bg-zinc-900">
          <h2 className="text-white font-bold font-display">Crop & Resize Image</h2>
          <button onClick={onClose} className="p-2 rounded-full text-muted hover:text-white hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={0.1}
            maxZoom={3}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteEvent}
            onZoomChange={setZoom}
            restrictPosition={false}
          />
        </div>

        <div className="p-6 bg-zinc-900 border-t border-white/10 space-y-6 z-10">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-muted uppercase">
              <span>Zoom Out</span>
              <span>Zoom In</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={0.1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleApplyCrop}
              disabled={isProcessing}
              className="px-8 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-400 shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Apply Selected Frame
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

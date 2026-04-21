import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2 } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
}

export default function ImageViewerModal({ isOpen, imageSrc, onClose }: ImageViewerModalProps) {
  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl">
        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex gap-4">
            <button className="text-white hover:text-orange-500 transition-colors drop-shadow-md">
              <Download size={24} />
            </button>
            <button className="text-white hover:text-orange-500 transition-colors drop-shadow-md">
              <Share2 size={24} />
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-rose-500 text-white transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* Interactive Image Frame */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full h-full max-w-6xl max-h-[85vh] p-4 flex items-center justify-center"
          onClick={onClose}
        >
          <img 
            src={imageSrc} 
            alt="Fullscreen View" 
            className="max-w-full max-h-full object-contain rounded-lg drop-shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking the image itself
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

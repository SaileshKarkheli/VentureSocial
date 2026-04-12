import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { PostImage } from '../types';
import SmartImage from './SmartImage';
import { createPortal } from 'react-dom';

const MotionSmartImage = motion(SmartImage);

interface MediaCarouselProps {
  images: PostImage[];
  className?: string;
}

export default function MediaCarousel({ images, className }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const Lightbox = () => createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
      <button 
        onClick={() => setIsFullscreen(false)}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-50 hover:scale-105 active:scale-95"
      >
        <X size={28} />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-12 cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex].url}
            alt={`Day ${images[currentIndex].day}`}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
          />
          <div className="mt-8 px-8 py-4 rounded-3xl bg-white/10 backdrop-blur-md text-white/90 border border-white/10 text-center max-w-2xl transform transition-all duration-300">
            <span className="text-orange-500 font-bold uppercase tracking-widest text-sm block mb-2">
              Day {images[currentIndex].day}
            </span>
            <span className="text-lg font-medium leading-relaxed">
              {images[currentIndex].description}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(e); }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:scale-110 active:scale-90 transition-all"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(e); }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:scale-110 active:scale-90 transition-all"
          >
            <ChevronRight size={32} />
          </button>
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-orange-500 w-8' : 'bg-white/40 w-2 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );

  return (
    <>
      <div 
        className={className || "relative aspect-[4/5] overflow-hidden bg-zinc-100 group cursor-pointer"} 
        onClick={() => setIsFullscreen(true)}
      >
        <AnimatePresence mode="wait">
          <MotionSmartImage
            key={currentIndex}
            src={images[currentIndex].url}
            alt={`Day ${images[currentIndex].day}`}
            locationName={images[currentIndex].description}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </AnimatePresence>

        {/* Day & Description Overlay */}
        <div className="absolute top-4 left-4 z-10">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md text-[#0A192F] border border-zinc-200 shadow-xl"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 block">
              Day {images[currentIndex].day}
            </span>
            <span className="text-xs font-medium">
              {images[currentIndex].description}
            </span>
          </motion.div>
        </div>

        {/* Expand Icon indicator */}
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white shadow-lg border border-white/20">
            <Maximize2 size={20} />
          </div>
        </div>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20 border border-white/10"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20 border border-white/10"
            >
              <ChevronRight size={24} />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                    i === currentIndex ? 'bg-orange-500 w-4' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isFullscreen && <Lightbox />}
      </AnimatePresence>
    </>
  );
}

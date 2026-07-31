import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import SmartImage from '../SmartImage';

export function DayHighlightCarousel({ day }: { day: any }) {
  const images = [
    { url: day.stay.image, type: 'STAY', name: day.stay.name },
    { url: day.dining.image, type: 'DINING', name: day.dining.name },
    ...day.activities.map((a: any) => ({ url: a.image, type: 'ACTIVITY', name: a.name }))
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden h-[240px] group/carousel shadow-md bg-cream">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <SmartImage
            src={images[currentIndex].url}
            alt={images[currentIndex].name}
            locationName={images[currentIndex].name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-3 left-3 z-10">
        <motion.div
          key={images[currentIndex].type}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-ink uppercase tracking-widest shadow-sm border border-hairline"
        >
          {images[currentIndex].type}
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10">
        <p className="text-white text-xs font-bold truncate drop-shadow-md">
          {images[currentIndex].name}
        </p>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-orange-500' : 'w-1 bg-white/50'
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PillarSection({ title, icon: Icon, children, isExpanded, onToggle }: {
  title: string,
  icon: any,
  children: React.ReactNode,
  isExpanded: boolean,
  onToggle: () => void
}) {
  return (
    <div className="border border-hairline rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-tint transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-tint text-orange-500">
            <Icon size={20} />
          </div>
          <span className="font-bold text-ink uppercase tracking-widest text-xs">{title}</span>
        </div>
        <ChevronDown size={18} className={`text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

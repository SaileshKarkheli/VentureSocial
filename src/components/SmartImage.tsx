import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  locationName?: string;
}

export default function SmartImage({ src, alt, className = '', locationName }: SmartImageProps) {
  const [hasError, setHasError] = useState(false);
  const fallbackImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

  return (
    <img
      src={hasError ? fallbackImage : src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

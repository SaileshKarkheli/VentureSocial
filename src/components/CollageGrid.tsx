import React from 'react';
import { motion } from 'motion/react';
import { Heart, MapPin, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import SmartImage from './SmartImage';

interface CollageGridProps {
  items: Post[];
  type: 'Photos' | 'Videos';
}

export default function CollageGrid({ items, type }: CollageGridProps) {
  const navigate = useNavigate();

  // Flatten items for the collage
  const collageItems = items.flatMap(post => {
    if (type === 'Photos') {
      return post.images.map(img => ({
        ...img,
        postId: post.id,
        userId: post.userId,
        tripId: post.tripId,
        location: post.location,
        likes: post.likes
      }));
    } else {
      return (post.videos || []).map(video => ({
        url: video,
        postId: post.id,
        userId: post.userId,
        tripId: post.tripId,
        location: post.location,
        likes: post.likes
      }));
    }
  });

  const handleItemClick = (postId: string) => {
    navigate(`/trip/${postId}`);
  };

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 p-4">
      {collageItems.map((item, index) => (
        <motion.div
          key={`${item.postId}-${index}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
          onClick={() => handleItemClick(item.postId)}
        >
          {type === 'Photos' ? (
            <SmartImage
              src={(item as any).url}
              alt={item.location}
              locationName={item.location}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="relative aspect-[9/16] bg-cream">
              <video
                src={(item as any).url}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                muted
                loop
                onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
              />
              <div className="absolute inset-0 flex items-center justify-center text-ink/50 group-hover:text-ink transition-colors">
                <Play size={48} fill="currentColor" />
              </div>
            </div>
          )}

          {/* Hover Overlays */}
          <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
            <div className="flex justify-end">
              <div className="flex items-center gap-1.5 text-ink font-bold">
                <Heart size={18} className="fill-rose-500 text-rose-500" />
                <span>{item.likes}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-ink">
              <div className="p-1.5 rounded-lg bg-orange-500/90 text-white">
                <MapPin size={14} />
              </div>
              <span className="text-xs font-bold truncate">{item.location}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe2, Sparkles, Send, CheckCircle2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';
import { tripsService } from '../services/tripsService';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTripId?: string;
  onPublishSuccess?: (newPost: any) => void;
}

export default function PublishModal({ isOpen, onClose, preselectedTripId, onPublishSuccess }: PublishModalProps) {
  const navigate = useNavigate();
  const { myTrips, addPublicPost, activeProfile, user } = useApp();
  const [selectedTripId, setSelectedTripId] = useState<string>(preselectedTripId || myTrips[0]?.id || '');
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [tripDetail, setTripDetail] = useState<{ post: any, spots: any[] } | null>(null);
  const [userRating, setUserRating] = useState<number>(5);

  const selectedTrip = myTrips.find(t => t.id === selectedTripId);

  // Sync preselected trip if it changes
  useEffect(() => {
    if (preselectedTripId) {
      setSelectedTripId(preselectedTripId);
    }
  }, [preselectedTripId]);

  // Load trip detail and set initial images
  useEffect(() => {
    if (!selectedTripId) return;
    let isMounted = true;
    
    const loadTripDetail = async () => {
      try {
        const detail = await tripsService.fetchTripDetail(selectedTripId);
        if (isMounted) {
          setTripDetail(detail);
          
          // Extract unique images from the spots
          const spotImages = (detail.spots || [])
            .map((s: any) => s.image_url)
            .filter(Boolean) as string[];
          
          const uniqueImages = Array.from(new Set(spotImages));
          if (uniqueImages.length > 0) {
            setSelectedImages(uniqueImages);
          } else if (selectedTrip) {
            setSelectedImages(selectedTrip.availableImages || [selectedTrip.image]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch trip detail in PublishModal:", err);
      }
    };

    loadTripDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedTripId, selectedTrip]);

  if (!isOpen) return null;

  const toggleImage = (url: string) => {
    setSelectedImages(prev => 
      prev.includes(url) 
        ? prev.filter(i => i !== url) 
        : [...prev, url]
    );
  };

  const handlePublish = async () => {
    if (!selectedTrip || !caption.trim()) return;
    setIsPublishing(true);

    try {
      if (!user) {
        alert("Must be logged in to publish itineraries!");
        setIsPublishing(false);
        return;
      }

      // Extract Stay category name
      const staySpot = tripDetail?.spots.find(s => s.category === 'Stay');
      const hotelType = staySpot ? staySpot.title : 'Not specified';

      // Sum all spot costs from description, fallback to base_price
      let calculatedPrice = 0;
      tripDetail?.spots.forEach((s: any) => {
        if (s.description) {
          const match = s.description.match(/Cost:\s*\$?(\d+(?:\.\d+)?)/i);
          if (match) {
            calculatedPrice += parseFloat(match[1]);
          }
        }
      });
      const finalPrice = calculatedPrice > 0 ? calculatedPrice : (tripDetail?.post?.base_price || 0);

      // Extract Activity titles
      const activitySpots = (tripDetail?.spots || []).filter((s: any) => s.category === 'Activity');
      const finalActivities = activitySpots.length > 0 ? activitySpots.map((s: any) => s.title) : [];

      // Publish IN PLACE: flip the existing draft to public instead of inserting
      // a duplicate trip. The trip already owns its spots, so we don't re-create
      // them — publishing only changes visibility + feed metadata.
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          is_private: false,
          caption: caption,
          rating: userRating,
          hotel_type: hotelType,
          price: finalPrice,
          activities: finalActivities
        })
        .eq('id', selectedTripId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Build a local Post object from the trip's real spots for optimistic feed state.
      const spots = tripDetail?.spots || [];
      const formattedPost = {
        id: selectedTripId,
        userId: user.id,
        tripId: selectedTripId,
        user: activeProfile?.full_name || activeProfile?.username || user?.name || 'Current User',
        avatar: activeProfile?.avatar_url || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
        location: selectedTrip.country,
        images: spots
          .map((spot: any, idx: number) => ({
            id: `spot-${spot.id || idx}`,
            url: (Array.isArray(spot.image_urls) && spot.image_urls[0]) || spot.image_url,
            day: spot.day_number,
            description: spot.description,
            activities: spot.activities || [],
            coordinates: (spot.lat != null && spot.lng != null) ? { lat: Number(spot.lat), lng: Number(spot.lng) } : undefined
          }))
          .filter((img: any) => img.url),
        caption: caption,
        likes: 0,
        comments: 0,
        remixes: 0,
        rating: userRating,
        activities: finalActivities,
        hotelType: hotelType,
        price: finalPrice,
        isPrivate: false
      };

      // 4. Update parent states reactively or redirect smoothly
      if (onPublishSuccess) {
        onPublishSuccess(formattedPost);
      } else {
        navigate('/home');
      }

      onClose();
      setCaption('');
    } catch (err: any) {
      console.error("Error publishing itinerary:", err.message);
      alert(`Failed to publish: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0A192F]/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-100">
            <div className="flex items-center gap-3 text-[#0A192F]">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 shadow-sm">
                <Globe2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Share to Feed</h2>
                <p className="text-zinc-500 text-xs">Publish your itinerary to the community</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-full bg-zinc-100 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
            
            {/* Trip Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Select Trip to Share</label>
              {preselectedTripId ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img src={selectedTrip?.image} className="w-full h-full object-cover" alt="trip cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A192F]">{selectedTrip?.country}</h4>
                    <span className="text-xs text-orange-500 font-bold bg-orange-500/10 px-2 py-1 rounded-md">{selectedTrip?.year}</span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="w-full appearance-none bg-white border border-zinc-200 rounded-2xl py-4 px-5 pr-12 text-[#0A192F] font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                  >
                    {myTrips.map(trip => (
                      <option key={trip.id} value={trip.id}>{trip.country} ({trip.year})</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    ▼
                  </div>
                </div>
              )}
            </div>

            {/* Photo Selection Grid */}
            {selectedTrip?.availableImages && (
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Layout Images</label>
                  <span className="text-xs font-bold text-orange-500">{selectedImages.length} selected</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedTrip.availableImages.map((imgUrl, idx) => {
                    const isSelected = selectedImages.includes(imgUrl);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleImage(imgUrl)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${isSelected ? 'border-orange-500 shadow-md' : 'border-transparent'}`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-orange-500/20' : 'bg-black/0 group-hover:bg-black/10'}`} />
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-orange-500 bg-white rounded-full">
                            <CheckCircle2 size={18} className="fill-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rating Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Trip Rating (Optional)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={star <= userRating ? "fill-orange-500 text-orange-500" : "text-zinc-200"}
                    />
                  </button>
                ))}
                <span className="text-xs text-zinc-500 ml-2">({userRating} out of 5 Stars)</span>
              </div>
            </div>

            {/* Caption Area */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Write a Caption</label>
              <textarea 
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tell the community about your epic journey! Add some #tags..."
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all resize-none outline-none custom-scrollbar"
              />
            </div>

            {/* Preview Hint */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 text-blue-900 border border-blue-100">
              <Sparkles size={20} className="shrink-0 text-blue-500 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong>Your itinerary data will be attached!</strong> 
                <br/>When you publish, the community will be able to view your route, locations, and can easily 'Clone' your journey to their own planner.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50">
            <button 
              onClick={onClose}
              disabled={isPublishing}
              className="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handlePublish}
              disabled={isPublishing || !caption.trim()}
              className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:bg-orange-600 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? 'Publishing...' : 'Publish to Feed'}
              <Send size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe2, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';

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

  const selectedTrip = myTrips.find(t => t.id === selectedTripId);

  // Sync preselected trip if it changes
  useEffect(() => {
    if (preselectedTripId) {
      setSelectedTripId(preselectedTripId);
    }
  }, [preselectedTripId]);

  // When selected trip changes, select all its available images by default
  useEffect(() => {
    if (selectedTrip) {
      setSelectedImages(selectedTrip.availableImages || [selectedTrip.image]);
    }
  }, [selectedTrip]);

  if (!isOpen) return null;

  const toggleImage = (url: string) => {
    setSelectedImages(prev => 
      prev.includes(url) 
        ? prev.filter(i => i !== url) 
        : [...prev, url]
    );
  };

  const handlePublish = async () => {
    if (!selectedTrip || selectedImages.length === 0) return;
    setIsPublishing(true);

    try {
      if (!user) {
        alert("Must be logged in to publish itineraries!");
        setIsPublishing(false);
        return;
      }

      // 1. Insert parent record into public.posts
      const { data: parentPost, error: parentError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          location_name: selectedTrip.country,
          caption: caption,
          rating: 5,
          hotel_type: 'Resort',
          price: 1500,
          activities: ['Exploration'],
          category: 'Activity' // Safely matches constraints checking
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // 2. Insert detailed itinerary spots mapping via post_id
      const spotsToInsert = selectedImages.map((imgUrl, idx) => ({
        post_id: parentPost.id,
        day_number: idx + 1,
        title: `Day ${idx + 1} Highlight`,
        description: `Highlight from ${selectedTrip.country}`,
        category: 'Activity',
        image_url: imgUrl,
        activities: ['Exploration']
      }));

      const { error: spotsError } = await supabase
        .from('trip_spots')
        .insert(spotsToInsert);

      if (spotsError) throw spotsError;

      // 3. Construct a fully formatted local Post object
      const formattedPost = {
        id: parentPost.id,
        userId: user.id,
        tripId: parentPost.id,
        user: activeProfile?.full_name || activeProfile?.username || user?.name || 'Current User',
        avatar: activeProfile?.avatar_url || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
        location: selectedTrip.country,
        images: spotsToInsert.map((spot, idx) => ({
          id: `temp-spot-${idx}`,
          url: spot.image_url,
          day: spot.day_number,
          description: spot.description,
          activities: spot.activities,
          coordinates: undefined
        })),
        caption: caption,
        likes: 0,
        comments: 0,
        remixes: 0,
        rating: 5,
        activities: ['Exploration'],
        hotelType: 'Resort',
        price: 1500,
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
              disabled={isPublishing || !caption.trim() || selectedImages.length === 0}
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

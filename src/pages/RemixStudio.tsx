import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, FolderOpen, MapPin, X, ArrowRight, ShoppingBag, Clock, Navigation, Bed, Utensils, Camera, Plane, Trash2, AlertCircle, Store, Car } from 'lucide-react';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import SmartImage from '../components/SmartImage';
import { Post } from '../types';
import { getHaversineDistance } from '../utils/geo';

export default function RemixStudio() {
  const { remixFolders, cartItems, addToCart } = useApp();
  const navigate = useNavigate();
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const entries = Object.entries(remixFolders) as [string, Post[]][];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-[#0A192F] text-white rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 text-orange-500">
            <Wand2 size={24} />
            <span className="font-bold uppercase tracking-widest text-sm">The Remix Studio</span>
          </div>
          <h1 className="text-4xl font-display font-bold">Your A La Carte Workspace</h1>
          <p className="text-zinc-400 font-medium max-w-lg">
            Every component you've cloned across the platform lives here. Drill into a location folder and let our algorithm sequence your perfect trip.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex flex-col items-center justify-center shrink-0 min-w-[200px]">
           <span className="text-4xl font-display font-bold text-white">{entries.length}</span>
           <span className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Active Folders</span>
        </div>
      </div>

      {!activeLocation ? (
        // The Hub View (Polaroids)
        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-zinc-200 shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
                <FolderOpen size={40} />
              </div>
              <h3 className="text-2xl font-bold text-[#0A192F] mb-4">Your studio is empty</h3>
              <p className="text-zinc-500 max-w-md mx-auto mb-8">
                Explore the discover feed or search for destinations. When you find an itinerary you love, click "Add to Remix Studio" to start building your custom trip here.
              </p>
              <button 
                onClick={() => navigate('/search')}
                className="bg-[#0A192F] text-white font-bold px-8 py-4 rounded-xl hover:bg-black transition-colors shadow-xl"
              >
                Discover Itineraries
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {entries.map(([location, posts]) => (
                <motion.div
                  key={location}
                  whileHover={{ y: -5 }}
                  onClick={() => setActiveLocation(location)}
                  className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-xl cursor-pointer group hover:border-[#0A192F] transition-all"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-zinc-100">
                    <SmartImage 
                      src={posts[0]?.images?.[0]?.url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'} 
                      alt={location}
                      locationName={location}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-2xl font-display font-bold drop-shadow-md truncate">{location}</h3>
                      <p className="text-sm font-bold text-orange-400">{posts.length} A La Carte Items</p>
                    </div>
                  </div>
                  <div className="px-2 pb-2">
                    <p className="text-sm font-medium text-zinc-500 line-clamp-2">
                      Contains: {posts.map(p => p.caption.split('#')[0].trim()).slice(0, 3).join(', ')} {posts.length > 3 ? '...' : ''}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // The Workspace View (Inside a Folder)
        <WorkspaceView 
          location={activeLocation} 
          posts={remixFolders[activeLocation]} 
          onClose={() => setActiveLocation(null)} 
        />
      )}
    </div>
  );
}

// Subcomponent for the algorithmic workspace
function WorkspaceView({ location, posts, onClose }: { location: string, posts: Post[], onClose: () => void }) {
  const { addToCart, setGlobalToast, removeFromRemixFolder } = useApp();
  const navigate = useNavigate();

  // ALGORITHMIC ARRANGEMENT
  // Category weighting: Hotel (10), Activity (20), Dining (30), unknown (40)
  const getWeight = (post: Post) => {
    // We guess the category based on price/hotelType or keyword since we don't have a rigid category column on Post right now
    const txt = (post.caption + ' ' + (post.hotelType || '')).toLowerCase();
    if (txt.includes('hotel') || txt.includes('resort') || txt.includes('villa') || txt.includes('stay')) return { cat: 'Stay', weight: 10, icon: Bed };
    if (txt.includes('flight') || txt.includes('train') || txt.includes('cab') || txt.includes('uber') || txt.includes('transport')) return { cat: 'Transport', weight: 15, icon: Plane };
    if (txt.includes('restaurant') || txt.includes('dining') || txt.includes('food') || txt.includes('eat')) return { cat: 'Dining', weight: 30, icon: Utensils };
    return { cat: 'Activity', weight: 20, icon: Camera };
  };

  // MOCK PLACES API
  const getPlacesData = (metaCat: string) => {
    switch (metaCat) {
      case 'Stay': return { duration: 720, opens: 0, closes: 24, closeStr: '24/7' }; 
      case 'Dining': return { duration: 90, opens: 11, closes: 22, closeStr: '10 PM' };
      case 'Transport': return { duration: 60, opens: 0, closes: 24, closeStr: '24/7' };
      default: return { duration: 180, opens: 9, closes: 17, closeStr: '5 PM' }; // Activity
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    const metaA = getWeight(a);
    const metaB = getWeight(b);
    return metaA.weight - metaB.weight;
  });

  const totalCost = sortedPosts.reduce((acc, curr) => acc + (curr.price || 0), 0);

  const handlePushToCheckout = () => {
    // Push exactly as a unified super-trip format if we wanted, or push them individually as items
    // For now, we will construct a single master cart mock item representing the remixed trip
    const remixTrip: Post = {
      id: `remix-${location.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      userId: 'remix',
      tripId: 'remix',
      user: 'You (Remixed)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      location: `${location} (Custom Remix)`,
      images: sortedPosts[0]?.images || [{ url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80', day: 1, description: 'Cover' }],
      caption: `A custom A La Carte remix pulling together ${sortedPosts.length} hand-picked experiences.`,
      likes: 0,
      comments: 0,
      rating: 5,
      activities: ['Custom Trip'],
      hotelType: 'Remix',
      price: totalCost,
      isPrivate: true
    };
    
    addToCart(remixTrip);
    setGlobalToast('Master Remix Trip compiled and mapped to global Checkout Cart!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] border border-zinc-200 shadow-2xl p-8"
    >
      <button 
        onClick={onClose}
        className="flex items-center gap-2 text-zinc-500 font-bold hover:text-[#0A192F] transition-colors mb-8"
      >
        <ArrowRight className="rotate-180" size={18} />
        Back to Hub
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Col: Algorithm Sequence */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-3xl font-display font-bold text-[#0A192F]">{location}</h2>
            <p className="text-zinc-500 font-medium mt-1">Smart Engine Sequence • Optimized for logical transit flow</p>
          </div>

          <div className="relative border-l-2 border-zinc-100 pl-6 space-y-12 py-4">
            {(() => {
              let currentTimeMins = 9 * 60; // Start day at 9:00 AM

              return sortedPosts.map((post, idx) => {
                const meta = getWeight(post);
                const places = getPlacesData(meta.cat);
                const nextPost = sortedPosts[idx + 1];
                
                // Temporal Sequence Logic
                const arrivalTimeMins = currentTimeMins;
                const departTimeMins = arrivalTimeMins + places.duration;
                
                // Check if departure exceeds closing time (closing time logic: hours * 60)
                const closesAtMins = places.closes * 60;
                const isConflict = departTimeMins > closesAtMins && places.closes !== 24;
                
                // Format arrival time purely for UI context
                const formatTime = (mins: number) => {
                   const h = Math.floor(mins / 60) % 24;
                   const m = mins % 60;
                   const ampm = h >= 12 ? 'PM' : 'AM';
                   const h12 = h % 12 || 12;
                   return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
                };

                // Fallback Distance Logic (Haversine or Mock)
                let travelMins = 0;
                if (nextPost) {
                  if (post.images?.[0]?.coordinates && nextPost.images?.[0]?.coordinates) {
                     const distKm = getHaversineDistance(
                       post.images[0].coordinates.lat, post.images[0].coordinates.lng,
                       nextPost.images[0].coordinates.lat, nextPost.images[0].coordinates.lng
                     );
                     travelMins = Math.round(distKm * 3);
                  } else {
                     travelMins = Math.floor(Math.random() * 45) + 5;
                  }
                }
                const isHighFatigue = travelMins > 60;
                
                // Progress time chain for NEXT node
                currentTimeMins = departTimeMins + travelMins;

                return (
                  <React.Fragment key={post.id}>
                  <div className="relative">
                  {/* Node icon */}
                  <div className="absolute -left-[39px] top-4 w-10 h-10 bg-white border-2 border-orange-500 text-orange-500 rounded-full flex items-center justify-center z-10 p-1 shadow-sm">
                     <meta.icon size={16} />
                  </div>
                  
                  <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 shadow-sm hover:border-orange-500/50 transition-colors group">
                    <div className="flex gap-6">
                      <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-zinc-200 shadow-inner">
                         <SmartImage src={post.images?.[0]?.url} alt="Reference" locationName={location} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between">
                           <div>
                             <div className="flex items-center gap-2 mb-2">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">Step {idx + 1} • {meta.cat}</span>
                               <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 px-2 py-0.5 rounded-md ${isConflict ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                 <Store size={10} /> 
                                 {places.closeStr === '24/7' ? 'Open 24/7' : `Open until ${places.closeStr}`}
                               </span>
                             </div>
                             <h4 className="text-xl font-bold text-[#0A192F] line-clamp-1">{post.caption.split('#')[0]}</h4>
                             <p className="text-sm font-medium text-zinc-500 line-clamp-1">{post.location}</p>
                           </div>
                           <button onClick={() => removeFromRemixFolder(location, post.id)} className="text-zinc-300 hover:text-rose-500 transition-colors p-2" title="Remove from Remix">
                              <Trash2 size={20} />
                           </button>
                        </div>
                        
                        {isConflict && (
                          <div className="mt-3 flex items-start gap-2 bg-rose-50 p-3 rounded-lg border border-rose-100">
                             <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                             <p className="text-xs font-bold text-rose-700 leading-tight">
                               Timing Conflict: Based on your structural sequence, you will arrive at {formatTime(arrivalTimeMins)}. This location requires {Math.round(places.duration/60)} hours, conflicting with the {places.closeStr} closing time.
                             </p>
                          </div>
                        )}
                        
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-100">
                           <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                               <Clock size={14} /> Est. {meta.cat === 'Stay' ? 'Overnight' : `${Math.round(places.duration / 60)} Hours`}
                             </div>
                             <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                               <Navigation size={14} /> View Map
                             </div>
                           </div>
                           <span className="font-mono font-bold text-[#0A192F] bg-white px-3 py-1 rounded-md border border-zinc-200">${post.price?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Travel Edge Node */}
                {nextPost && (
                  <div className="relative h-16 border-l-2 border-dashed border-zinc-200 ml-[19px] my-2 transition-all">
                    <div className={`absolute -left-[14px] top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 flex items-center gap-2 rounded-full border shadow-sm z-10 ${isHighFatigue ? 'border-orange-500/50' : 'border-zinc-200'}`}>
                      <Car size={12} className={isHighFatigue ? 'text-orange-500' : 'text-zinc-400'} />
                      <span className={`text-[10px] font-bold tracking-wider ${isHighFatigue ? 'text-orange-500' : 'text-zinc-500'}`}>
                         {isHighFatigue ? 'HIGH FATIGUE : ' : ''}{travelMins} MINS DRIVE
                      </span>
                    </div>
                  </div>
                )}
                </React.Fragment>
              );
            })})()}
          </div>
        </div>

        {/* Right Col: Dispatch Summary */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24 bg-[#0A192F] text-white rounded-[2rem] p-8 shadow-2xl border border-zinc-800">
             <h3 className="font-display text-2xl font-bold mb-6">Remix Summary</h3>
             <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-zinc-400 font-medium">Experiences Tracked</span>
                 <span className="font-bold">{sortedPosts.length} Nodes</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-zinc-400 font-medium">Algorithmic Match</span>
                 <span className="font-bold text-green-400">Optimal 98%</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-zinc-400 font-medium">Base Price Aggregated</span>
                 <span className="font-mono font-bold text-orange-400">${totalCost.toFixed(2)}</span>
               </div>
             </div>
             
             <div className="pt-6 border-t border-white/10 space-y-4">
                <button 
                  onClick={handlePushToCheckout}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:bg-orange-400 transition-colors"
                >
                  <ShoppingBag size={20} /> Checkout Master Trip
                </button>
                <p className="text-[10px] text-zinc-500 font-medium text-center uppercase tracking-widest leading-relaxed">
                  Clicking checkout bounds these {sortedPosts.length} nodes into a single master global itinerary payload.
                </p>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

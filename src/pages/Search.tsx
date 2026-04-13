import React, { useState } from 'react';
import { Search as SearchIcon, MapPin, Star, Heart, MessageCircle, Share2, Calendar, Clock, Users, Plus, Check, LayoutGrid, ChevronDown, Plane, Car, Bed, Utensils, Camera, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import FilterBar from '../components/FilterBar';
import MediaCarousel from '../components/MediaCarousel';
import SmartImage from '../components/SmartImage';
import { Post } from '../types';
import { tripData, DayHighlightCarousel, PillarSection } from './TripDetail';

export default function Search() {
  const { publicPosts, searchQuery, setSearchQuery, filters, sortBy, customTripSpots, toggleCustomSpot } = useApp();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Timeline State
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const filteredPosts = publicPosts
    .filter(post => {
      const matchesSearch = post.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           post.caption.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStars = post.rating >= filters.minStars;
      const matchesActivities = filters.activities.length === 0 || 
                               filters.activities.every(activity => post.activities.includes(activity));
      const matchesHotelType = filters.hotelTypes.length === 0 || 
                              filters.hotelTypes.includes(post.hotelType);
      const matchesPrice = post.price >= filters.priceRange[0] && post.price <= filters.priceRange[1];

      return matchesSearch && matchesStars && matchesActivities && matchesHotelType && matchesPrice;
    })
    .sort((a: any, b: any) => {
      // Phase 4 Engagement Score Algorithm (1/2/5/10) - Strictly via Supabase Schemas
      const getScore = (p: any) => {
        const likes = typeof p.likes === 'number' ? p.likes : p.likes?.[0]?.count || 0;
        const comments = typeof p.comments === 'number' ? p.comments : p.comments?.[0]?.count || 0;
        const remixes = p.remix_stats?.[0]?.count || p.remixes || 0;
        return (likes * 1) + (comments * 2) + (remixes * 5) + ((p.rating || 5) * 10);
      };
      return getScore(b) - getScore(a); // Always sort highest Engagement Score to the absolute top
    });

  return (
    <div className="space-y-6 text-zinc-900 pb-20">
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          placeholder="Search locations to Remix a trip... (e.g. Italy, Bali)"
          className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all text-[#0A192F] placeholder:text-zinc-400"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (selectedPost) setSelectedPost(null); // Reset selection on new search
          }}
        />
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100 max-w-3xl mx-auto">
        <FilterBar />
      </div>

      <div className="flex items-start lg:h-[800px] gap-6 overflow-hidden">
        
        {/* Left Pane: Best Viewed Itineraries List */}
        <div className={`flex-1 flex flex-col h-full bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden ${selectedPost ? 'hidden lg:flex lg:w-1/3' : 'w-full'}`}>
          <div className="p-6 border-b border-zinc-100 bg-zinc-50 shrink-0">
            <h2 className="text-xl font-display font-bold text-[#0A192F]">Top Creator Itineraries</h2>
            <p className="text-sm text-zinc-500">Sorted by engagement. Select to view and remix.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-10 text-zinc-400">No trips match your search.</div>
            ) : (
              filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPost?.id === post.id 
                      ? 'border-orange-500 bg-orange-50/50 shadow-md' 
                      : 'border-zinc-100 bg-white hover:border-zinc-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <img src={post.avatar} alt={post.user} className="w-12 h-12 rounded-full object-cover border border-zinc-200 shrink-0" />
                    <div>
                      <h3 className="font-bold text-[#0A192F]">{post.user}</h3>
                      <div className="flex items-center gap-1 text-xs text-orange-500 font-bold uppercase tracking-wider">
                        <MapPin size={12} /> {post.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-sm text-zinc-500 font-medium"><Heart size={14}/> {typeof post.likes === 'number' ? post.likes : (post as any).likes?.[0]?.count || 0}</div>
                    <div className="flex items-center gap-1 text-sm text-zinc-500 font-medium"><MessageCircle size={14}/> {typeof post.comments === 'number' ? post.comments : (post as any).comments?.[0]?.count || 0}</div>
                    
                    {/* Executive Social Proof Badges natively hooked to Supabase Arrays */}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-orange-500 text-white rounded-md text-xs font-bold shadow-sm">
                        <Star size={12} className="fill-white" /> {post.rating || 5}.0
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-[#0A192F] text-orange-500 rounded-md text-xs font-bold shadow-sm border border-[#0A192F]">
                        {(post as any).remix_stats?.[0]?.count || (post as any).remixes || 0} Remixes
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Detail View & Remixer Builder */}
        <AnimatePresence mode="wait">
          {selectedPost && (
            <motion.div
              key={selectedPost.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-[2] h-full bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="relative h-64 shrink-0 bg-black">
                <img src={selectedPost.images[0]?.url} alt="Cover" className="w-full h-full object-cover opacity-70" />
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/40 lg:hidden"
                >
                  Back
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-display font-bold text-white leading-tight drop-shadow-md mb-2">{selectedPost.caption.split('#')[0]}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm font-medium">
                    <span className="flex items-center gap-1"><MapPin size={16} /> {selectedPost.location}</span>
                    <span className="flex items-center gap-1"><Users size={16} /> By {selectedPost.user}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-display font-bold text-[#0A192F]">A La Carte Itinerary</h3>
                  <div className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl font-bold text-sm">
                    {customTripSpots.length} Spots in Custom Trip
                  </div>
                </div>

                <div className="space-y-6" style={{ zoom: 0.6 } as any}>
                  {(() => {
                    const trip = tripData[selectedPost.id || '1'] || tripData['1'];
                    return trip.days.map((day: any) => (
                      <div
                        key={day.id}
                        className={`bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${expandedDay === day.id ? 'border-orange-500 shadow-xl' : 'border-zinc-200 shadow-sm hover:border-zinc-300'}`}
                      >
                        <div className="w-full text-left group">
                          <div className="p-6 md:p-8 space-y-6">
                            <div
                              onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                              className="w-full flex items-center justify-between cursor-pointer group"
                            >
                              <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-colors">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Day</span>
                                  <span className="text-2xl font-display font-bold text-[#0A192F]">{day.day}</span>
                                </div>
                                <div>
                                  <h3 className="text-2xl font-display font-bold text-[#0A192F] group-hover:text-orange-500 transition-colors">
                                    Day {day.day}: {day.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                                    <MapPin size={14} />
                                    <span>{day.location}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full text-[#0A192F] transition-transform duration-500 ${expandedDay === day.id ? 'rotate-180 bg-orange-500 text-white shadow-lg' : 'bg-zinc-50'}`}>
                                  <ChevronDown size={24} />
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                              <div className="space-y-2">
                                <p className="text-zinc-500 text-sm leading-relaxed italic">
                                  "{day.transport.narrative}"
                                </p>
                              </div>
                              <DayHighlightCarousel day={day} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedDay === day.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.5, ease: 'easeInOut' }}
                            >
                              <div className="px-6 md:px-8 pb-8 space-y-4">
                                
                                <PillarSection
                                  title="Transport Mode"
                                  icon={Plane}
                                  isExpanded={expandedPillar === `${day.id}-transport`}
                                  onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-transport` ? null : `${day.id}-transport`)}
                                >
                                  <div className="flex items-start gap-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <div className="p-4 rounded-xl bg-white shadow-sm text-orange-500">
                                      <Car size={24} />
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-bold text-[#0A192F] text-lg">{day.transport.mode}</h4>
                                      <p className="text-zinc-600 leading-relaxed italic">"{day.transport.narrative}"</p>
                                    </div>
                                  </div>
                                </PillarSection>

                                <PillarSection
                                  title="Stay Details"
                                  icon={Bed}
                                  isExpanded={expandedPillar === `${day.id}-stay`}
                                  onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-stay` ? null : `${day.id}-stay`)}
                                >
                                  <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                      <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                                        <SmartImage src={day.stay.image} alt={day.stay.name} locationName={day.stay.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-2xl font-display font-bold text-[#0A192F]">{day.stay.name}</h4>
                                          {(() => {
                                            const isAdded = customTripSpots.some(s => s.description === day.stay.name);
                                            return (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); toggleCustomSpot({ description: day.stay.name, url: day.stay.image, day: day.day, category: 'Hotel' } as any); }}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isAdded ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400'}`}
                                              >
                                                {isAdded ? <Check size={16}/> : <Plus size={16}/>} {isAdded ? 'Added' : 'Add Check-In'}
                                              </button>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </PillarSection>

                                <PillarSection
                                  title="Dining"
                                  icon={Utensils}
                                  isExpanded={expandedPillar === `${day.id}-dining`}
                                  onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-dining` ? null : `${day.id}-dining`)}
                                >
                                  <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                      <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                                        <SmartImage src={day.dining.image} alt={day.dining.name} locationName={day.dining.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-2xl font-display font-bold text-[#0A192F]">{day.dining.name}</h4>
                                          {(() => {
                                            const isAdded = customTripSpots.some(s => s.description === day.dining.name);
                                            return (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); toggleCustomSpot({ description: day.dining.name, url: day.dining.image, day: day.day, category: 'Restaurant' } as any); }}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isAdded ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400'}`}
                                              >
                                                {isAdded ? <Check size={16}/> : <Plus size={16}/>} {isAdded ? 'Added' : 'Add Dining'}
                                              </button>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </PillarSection>

                                <PillarSection
                                  title="Activities"
                                  icon={Camera}
                                  isExpanded={expandedPillar === `${day.id}-activities`}
                                  onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-activities` ? null : `${day.id}-activities`)}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {day.activities.map((activity: any) => {
                                      const isAdded = customTripSpots.some(s => s.description === activity.name);
                                      return (
                                        <div key={activity.id} className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 flex flex-col">
                                          <div className="relative h-48">
                                            <SmartImage src={activity.image} alt={activity.name} locationName={activity.name} className="w-full h-full object-cover" />
                                            <button
                                              onClick={(e) => { e.stopPropagation(); toggleCustomSpot({ description: activity.name, url: activity.image, day: day.day, category: 'Activity' } as any); }}
                                              className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${isAdded ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400'}`}
                                            >
                                              {isAdded ? <Check size={14}/> : <Plus size={14}/>} {isAdded ? 'Added' : 'Add Activity'}
                                            </button>
                                          </div>
                                          <div className="p-6 space-y-2">
                                            <h4 className="font-bold text-[#0A192F] text-lg">{activity.name}</h4>
                                            <p className="text-zinc-500 text-sm leading-relaxed">{activity.description}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </PillarSection>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </motion.div>
          )}
          {!selectedPost && (
            <div className="hidden lg:flex flex-[2] h-full bg-zinc-50 rounded-3xl border border-zinc-200 shadow-inner items-center justify-center text-center p-12">
              <div>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-6 text-orange-500">
                  <LayoutGrid size={40} />
                </div>
                <h3 className="text-2xl font-bold text-[#0A192F] mb-3">Select a Trip to Remix</h3>
                <p className="text-zinc-500 max-w-sm mx-auto text-lg">Browse the top-rated creators on the left and cherry-pick the absolute best spots for your custom itinerary.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

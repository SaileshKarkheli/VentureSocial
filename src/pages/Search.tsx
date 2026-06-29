import React, { useState } from 'react';
import { Search as SearchIcon, MapPin, Star, Heart, MessageCircle, Share2, Calendar, Clock, Users, Plus, Check, LayoutGrid, ChevronDown, Plane, Car, Bed, Utensils, Camera, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import SmartImage from '../components/SmartImage';
import { Post } from '../types';
import { DayHighlightCarousel, PillarSection } from '../components/remix/TimelineComponents';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FilterBar = React.lazy(() => import('../components/FilterBar'));
const SaveSpotModal = React.lazy(() => import('../components/remix/SaveSpotModal').then(module => ({ default: module.SaveSpotModal })));

export default function Search() {
  const { publicPosts, searchQuery, setSearchQuery, filters, sortBy, customTripSpots, toggleCustomSpot, currentUserProfile } = useApp();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const navigate = useNavigate();

  // Local database states for direct fetching
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // User Auth and Remixed Spots check layer
  const { session } = useAuth();
  const [remixedSpotIds, setRemixedSpotIds] = useState<string[]>([]);
  const [spotToSave, setSpotToSave] = useState<string | null>(null);

  React.useEffect(() => {
    if (!session?.user?.id) return;
    const fetchRemixedSpots = async () => {
      const { data } = await supabase
        .from('remix_folders')
        .select('saved_spots(spot_id)')
        .eq('user_id', session.user.id);
        
      if (data) {
        const ids = data.flatMap((folder: any) => 
          (folder.saved_spots || []).map((s: any) => s.spot_id)
        );
        setRemixedSpotIds(ids);
      }
    };
    fetchRemixedSpots();
  }, [session?.user?.id, spotToSave]); // Loaded on init, re-syncs when modal opens/closes

  React.useEffect(() => {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
    if (isMockMode) {
      setDbPosts(publicPosts);
      setIsDbLoading(false);
      return;
    }

    const fetchSearchFeed = async () => {
      setIsDbLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profile:profiles!inner(id, username, full_name, avatar_url),
            trip_spots(*),
            likes(count),
            comments(count),
            remix_stats(count)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          tripId: row.id,
          user: row.profile?.full_name || row.profile?.username || 'Anonymous Explorer',
          avatar: row.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
          location: row.location_name,
          images: (row.trip_spots || []).map((spot: any) => ({
            id: spot.id,
            url: spot.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
            day: spot.day_number,
            description: spot.description || '',
            activities: spot.activities || [],
            coordinates: spot.lat && spot.lng ? { lat: parseFloat(spot.lat), lng: parseFloat(spot.lng) } : undefined
          })).sort((a: any, b: any) => a.day - b.day),
          caption: row.caption || row.category || '',
          likes: row.likes?.[0]?.count || 0,
          comments: row.comments?.[0]?.count || 0,
          remixes: row.remix_stats?.[0]?.count || 0,
          rating: row.rating || 5,
          activities: row.activities || [],
          hotelType: row.hotel_type || row.category || 'Boutique',
          price: row.price || row.base_price || 0,
          isPrivate: row.is_private || false
        }));
        setDbPosts(mapped);
      } catch (err) {
        console.error("Error fetching database feed:", err);
      } finally {
        setIsDbLoading(false);
      }
    };

    fetchSearchFeed();
  }, [publicPosts]);
  
  // Timeline State
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // User Directory State
  const [searchTab, setSearchTab] = useState<'itineraries' | 'users'>('itineraries');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Add Trip Spots State
  const [tripSpots, setTripSpots] = useState<any[]>([]);
  const [isSpotsLoading, setIsSpotsLoading] = useState(false);

  React.useEffect(() => {
    if (!selectedPost?.id) {
      setTripSpots([]);
      return;
    }
    const fetchSpots = async () => {
      setIsSpotsLoading(true);
      const { data } = await supabase.from('trip_spots').select('*').eq('post_id', selectedPost.id).order('day_number');
      setTripSpots(data || []);
      setIsSpotsLoading(false);
    };
    fetchSpots();
  }, [selectedPost?.id]);

  React.useEffect(() => {
    if (searchTab !== 'users') return;
    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      if (!searchQuery.trim()) {
        const { data } = await supabase.from('profiles').select('*').limit(20);
        setSearchedUsers(data || []);
        setIsSearchingUsers(false);
        return;
      }
      
      const formattedQuery = searchQuery.trim().split(/\s+/).join(' | ');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .textSearch('search_vector', formattedQuery)
        .limit(20);
        
      setSearchedUsers(data || []);
      setIsSearchingUsers(false);
    };
    
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchTab]);

  const filteredPosts = dbPosts
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
      <div className="flex bg-zinc-100 p-1 rounded-full w-64 mx-auto border border-zinc-200 shadow-inner">
         <button 
           onClick={() => setSearchTab('itineraries')}
           className={`flex-1 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${searchTab === 'itineraries' ? 'bg-[#0A192F] text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
         >
           Trips
         </button>
         <button 
           onClick={() => setSearchTab('users')}
           className={`flex-1 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${searchTab === 'users' ? 'bg-[#0A192F] text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
         >
           Users
         </button>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          placeholder={searchTab === 'itineraries' ? "Search locations to Remix a trip... (e.g. Italy, Bali)" : "Find global travelers automatically..."}
          className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all text-[#0A192F] placeholder:text-zinc-400"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (selectedPost) setSelectedPost(null); // Reset selection on new search
          }}
        />
      </div>

      {searchTab === 'itineraries' && (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100 max-w-3xl mx-auto">
          <React.Suspense fallback={<div className="h-12 w-full bg-zinc-50 animate-pulse rounded-2xl" />}>
            <FilterBar />
          </React.Suspense>
        </div>
      )}

      <div className="flex items-start lg:h-[800px] gap-6 overflow-hidden">
        
        {searchTab === 'itineraries' ? (
          <>
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

              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50 custom-scrollbar relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-display font-bold text-[#0A192F]">A La Carte Itinerary</h3>
                  <div className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl font-bold text-sm">
                    {tripSpots.length} Spots Available
                  </div>
                </div>

                <div className="space-y-6" style={{ zoom: 0.6 } as any}>
                  {isSpotsLoading ? (
                    <div className="flex justify-center py-20">
                      <div className="animate-spin text-orange-500"><LayoutGrid size={40} /></div>
                    </div>
                  ) : tripSpots.length === 0 ? (
                    <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-lg">
                      No spots found for this trip.
                    </div>
                  ) : (() => {
                    const spotsByDay = tripSpots.reduce((acc, spot) => {
                      if (!acc[spot.day_number]) acc[spot.day_number] = [];
                      acc[spot.day_number].push(spot);
                      return acc;
                    }, {} as Record<number, any[]>);

                    return Object.entries(spotsByDay).map(([dayNumStr, spots]) => {
                      const dayNum = parseInt(dayNumStr);
                      const typedSpots = spots as any[];
                      const transport = typedSpots.find(s => s.category === 'Transport');
                      const stay = typedSpots.find(s => s.category === 'Stay');
                      const dining = typedSpots.find(s => s.category === 'Dining');
                      const activities = typedSpots.filter(s => s.category === 'Activity');

                      // Synthetic day for the DayHighlightCarousel to maintain parity without breaking it
                      const syntheticDayForCarousel = {
                        stay: stay ? { image: stay.image_url, name: stay.title } : { image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80', name: 'No Stay' },
                        dining: dining ? { image: dining.image_url, name: dining.title } : { image: 'https://images.unsplash.com/photo-1590846406792-0adc7f928f1d?auto=format&fit=crop&w=1200&q=80', name: 'No Dining' },
                        activities: activities.length > 0 ? activities.map(a => ({ image: a.image_url, name: a.title })) : [{ image: 'https://images.unsplash.com/photo-1542820229-081e0c12af0b?auto=format&fit=crop&w=800&q=80', name: 'Explore' }]
                      };

                      return (
                        <div
                          key={`day-${dayNum}`}
                          className={`bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${expandedDay === dayNum ? 'border-orange-500 shadow-xl' : 'border-zinc-200 shadow-sm hover:border-zinc-300'}`}
                        >
                          <div className="w-full text-left group">
                            <div className="p-6 md:p-8 space-y-6">
                              <div
                                onClick={() => setExpandedDay(expandedDay === dayNum ? null : dayNum)}
                                className="w-full flex items-center justify-between cursor-pointer group"
                              >
                                <div className="flex items-center gap-6">
                                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-colors">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Day</span>
                                    <span className="text-2xl font-display font-bold text-[#0A192F]">{dayNum}</span>
                                  </div>
                                  <div>
                                    <h3 className="text-2xl font-display font-bold text-[#0A192F] group-hover:text-orange-500 transition-colors">
                                      Day {dayNum}
                                    </h3>
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                                      <MapPin size={14} />
                                      <span>{selectedPost?.location}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-full text-[#0A192F] transition-transform duration-500 ${expandedDay === dayNum ? 'rotate-180 bg-orange-500 text-white shadow-lg' : 'bg-zinc-50'}`}>
                                    <ChevronDown size={24} />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-2">
                                  <p className="text-zinc-500 text-sm leading-relaxed italic">
                                    "{transport?.description || 'No specific transport details'}"
                                  </p>
                                </div>
                                <DayHighlightCarousel day={syntheticDayForCarousel} />
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <AnimatePresence>
                            {expandedDay === dayNum && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                              >
                                <div className="px-6 md:px-8 pb-8 space-y-4">
                                  
                                  {transport && (
                                    <PillarSection
                                      title="Transport Mode"
                                      icon={Plane}
                                      isExpanded={expandedPillar === `${dayNum}-transport`}
                                      onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-transport` ? null : `${dayNum}-transport`)}
                                    >
                                      <div className="flex items-start gap-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 relative">
                                        <div className="p-4 rounded-xl bg-white shadow-sm text-orange-500">
                                          <Car size={24} />
                                        </div>
                                        <div className="space-y-2">
                                          <h4 className="font-bold text-[#0A192F] text-lg">{transport.title}</h4>
                                          <p className="text-zinc-600 leading-relaxed italic">"{transport.description}"</p>
                                        </div>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setSpotToSave(transport.id); }}
                                          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                        >
                                          {remixedSpotIds.includes(transport.id) ? <Check size={20} /> : <Plus size={20} />}
                                        </button>
                                      </div>
                                    </PillarSection>
                                  )}

                                  {stay && (
                                    <PillarSection
                                      title="Stay Details"
                                      icon={Bed}
                                      isExpanded={expandedPillar === `${dayNum}-stay`}
                                      onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-stay` ? null : `${dayNum}-stay`)}
                                    >
                                      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6 relative">
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                          <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                                            <SmartImage src={stay.image_url} alt={stay.title} locationName={stay.title} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                              <h4 className="text-2xl font-display font-bold text-[#0A192F] pr-12">{stay.title}</h4>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); setSpotToSave(stay.id); }}
                                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                              >
                                                {remixedSpotIds.includes(stay.id) ? <Check size={24} /> : <Plus size={24} />}
                                              </button>
                                            </div>
                                            <p className="text-zinc-500 text-sm leading-relaxed">{stay.description}</p>
                                            {stay.link_url && (
                                              <a href={stay.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-500 font-bold text-sm hover:underline">
                                                Official Booking Site
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </PillarSection>
                                  )}

                                  {dining && (
                                    <PillarSection
                                      title="Dining"
                                      icon={Utensils}
                                      isExpanded={expandedPillar === `${dayNum}-dining`}
                                      onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-dining` ? null : `${dayNum}-dining`)}
                                    >
                                      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6 relative">
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                          <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                                            <SmartImage src={dining.image_url} alt={dining.title} locationName={dining.title} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                              <h4 className="text-2xl font-display font-bold text-[#0A192F] pr-12">{dining.title}</h4>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); setSpotToSave(dining.id); }}
                                                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                              >
                                                {remixedSpotIds.includes(dining.id) ? <Check size={24} /> : <Plus size={24} />}
                                              </button>
                                            </div>
                                            <p className="text-zinc-500 text-sm leading-relaxed">{dining.description}</p>
                                            {dining.link_url && (
                                              <a href={dining.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-500 font-bold text-sm hover:underline">
                                                View Menu
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </PillarSection>
                                  )}

                                  {activities.length > 0 && (
                                    <PillarSection
                                      title="Activities"
                                      icon={Camera}
                                      isExpanded={expandedPillar === `${dayNum}-activities`}
                                      onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-activities` ? null : `${dayNum}-activities`)}
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {activities.map((activity: any) => (
                                          <div key={activity.id} className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 flex flex-col">
                                            <div className="relative h-48">
                                              <SmartImage src={activity.image_url} alt={activity.title} locationName={activity.title} className="w-full h-full object-cover" />
                                              <button
                                                onClick={(e) => { e.stopPropagation(); setSpotToSave(activity.id); }}
                                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                              >
                                                {remixedSpotIds.includes(activity.id) ? <Check size={20} /> : <Plus size={20} />}
                                              </button>
                                            </div>
                                            <div className="p-6 space-y-2">
                                              <h4 className="font-bold text-[#0A192F] text-lg">{activity.title}</h4>
                                              <p className="text-zinc-500 text-sm leading-relaxed">{activity.description}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </PillarSection>
                                  )}

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              <React.Suspense fallback={null}>
                <SaveSpotModal isOpen={!!spotToSave} spotId={spotToSave} onClose={() => setSpotToSave(null)} />
              </React.Suspense>
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
          </>
        ) : (
          <div className="w-full flex flex-col h-full bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden p-6 gap-6">
             <div className="pb-4 border-b border-zinc-100 shrink-0">
               <h2 className="text-xl font-display font-bold text-[#0A192F]">Global User Directory</h2>
               <p className="text-sm text-zinc-500 font-medium mt-1">Discover travelers and browse their public portfolios.</p>
             </div>
             <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar content-start">
                {isSearchingUsers ? (
                   <div className="col-span-full py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">Scanning Matrix...</div>
                ) : searchedUsers.length === 0 ? (
                   <div className="col-span-full py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">No users match query</div>
                ) : (
                   searchedUsers.map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => navigate(`/user/${u.username || u.id}`)}
                        className="flex items-center gap-4 p-4 border-2 border-zinc-100 hover:border-orange-500 rounded-3xl transition-all cursor-pointer group shadow-sm hover:shadow-xl bg-white hover:-translate-y-1"
                      >
                         <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 rounded-full shrink-0 overflow-hidden relative">
                           {u.avatar_url ? (
                             <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover filter contrast-125 saturate-150" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-50">
                               <Users size={24} />
                             </div>
                           )}
                         </div>
                         <div className="flex flex-col">
                           <h3 className="font-bold text-[#0A192F] text-lg leading-tight group-hover:text-orange-500 transition-colors truncate max-w-[180px]">{u.full_name || u.username || 'Anonymous'}</h3>
                           {u.username && <span className="text-orange-500 font-mono text-xs font-bold mt-0.5 truncate max-w-[180px]">@{u.username}</span>}
                           <span className="text-zinc-400 text-[9px] uppercase tracking-widest mt-1.5 font-bold truncate">
                             {u.created_at ? `Member since ${new Date(u.created_at).getFullYear()}` : 'Plan your first trip'}
                           </span>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

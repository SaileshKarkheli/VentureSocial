import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Search as SearchIcon, Star, Filter, Image as ImageIcon, Video, LayoutGrid, ShoppingBag, Users, MapPin as MapPinIcon, Navigation, Wand2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { getHaversineDistance } from '../utils/geo';
import FilterBar from '../components/FilterBar';
import MediaCarousel from '../components/MediaCarousel';
import CollageGrid from '../components/CollageGrid';
import SmartImage from '../components/SmartImage';
import PublishModal from '../components/PublishModal';
import { FeedSkeleton } from '../components/Skeletons';
import { supabase } from '../supabaseClient';

type TabType = 'Feed' | 'Photos' | 'Videos';

export default function Home() {
  const { publicPosts, isLoadingFeed, searchQuery, setSearchQuery, addToRemixFolder, followedUsers, requestedUsers, toggleFollow, userInterestTags, addUserInterest, userLocation, requestLocation, userLikedPosts, togglePostLike, activeProfile, user, currentUserProfile } = useApp();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('Feed');
  const [feedMode, setFeedMode] = useState<'Discover' | 'Following'>('Discover');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Home Matrix Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);
  const [hubUsers, setHubUsers] = useState<any[]>([]);

  // Local database states for direct fetching
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    if (!searchQuery.trim() || !showDropdown) {
      setHubUsers([]);
      return;
    }
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(3);
      setHubUsers(data || []);
    };
    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, showDropdown]);

  useEffect(() => {
    const fetchHomeFeed = async () => {
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

    fetchHomeFeed();
  }, []);

  const topTrips = dbPosts
    .filter(p => p.location.toLowerCase().includes(searchQuery.toLowerCase()) || p.caption.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 3);

  // Home feed shows all posts (Social Discovery) + Recommendation Engine Sorting
  const homePosts = [...dbPosts]
    .filter(post => feedMode === 'Discover' || followedUsers.includes(post.user))
    .sort((a: any, b: any) => {
       // Priority 0: Followed users ALWAYS float to the absolute top of the Discover feed
       const aFollowed = followedUsers.includes(a.user) ? 1 : 0;
       const bFollowed = followedUsers.includes(b.user) ? 1 : 0;
       if (aFollowed !== bFollowed) return bFollowed - aFollowed;

       // Priority 1: Live Geography Distances (if active)
       if (userLocation && a.images[0]?.coordinates && b.images[0]?.coordinates) {
         const distA = getHaversineDistance(userLocation.lat, userLocation.lng, a.images[0].coordinates.lat, a.images[0].coordinates.lng);
         const distB = getHaversineDistance(userLocation.lat, userLocation.lng, b.images[0].coordinates.lat, b.images[0].coordinates.lng);
         
         if (Math.abs(distA - distB) > 250) {
           return distA - distB; 
         }
       }

       // Priority 2: Phase 4 Engagement Score Algorithm (1/2/5/10) directly bridging to Supabase
       const getScore = (p: any) => {
         const likes = typeof p.likes === 'number' ? p.likes : p.likes?.[0]?.count || 0;
         const comments = typeof p.comments === 'number' ? p.comments : p.comments?.[0]?.count || 0;
         const remixes = p.remix_stats?.[0]?.count || p.remixes || 0;
         return (likes * 1) + (comments * 2) + (remixes * 5) + ((p.rating || 5) * 10);
       };
       return getScore(b) - getScore(a);
    });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate('/search');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-12 text-zinc-900"
    >
      {/* Discovery Hero */}
      <section className="relative h-[224px] rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center text-center px-6 border border-zinc-200">
        <SmartImage
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80"
          alt="Hero"
          locationName="Adventure Awaits"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        
        <div className="relative z-10 space-y-6 w-full max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[#0A192F] tracking-tight">
            Where to next?
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="text"
                  placeholder="Search City, Town, Country, or Travelers..."
                  value={searchQuery}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!showDropdown) setShowDropdown(true);
                  }}
                  className="w-full bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl py-4 pl-12 pr-6 text-[#0A192F] font-bold shadow-2xl focus:ring-2 focus:ring-orange-500 transition-all placeholder:font-normal"
                />
                
                {/* Search Discovery Dropdown Matrix */}
                <AnimatePresence>
                  {showDropdown && searchQuery.trim() && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-white border border-zinc-200 shadow-2xl overflow-hidden z-50 text-left"
                      style={{ borderRadius: '1.2rem' }}
                    >
                      <div className="max-h-[50vh] overflow-y-auto">
                        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50">
                          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Top Travelers</h3>
                          {hubUsers.length === 0 ? <p className="text-xs text-zinc-400 font-medium mt-2">No users matching query.</p> : (
                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                              {hubUsers.map(u => (
                                <div 
                                  key={u.id}
                                  onClick={() => navigate(`/user/${u.username}`)}
                                  className="flex items-center gap-3 p-2.5 bg-white border border-zinc-100 hover:border-orange-500 cursor-pointer group transition-all rounded-xl"
                                >
                                  <div className="w-8 h-8 bg-zinc-100 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                                    {u.avatar_url ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400"><Users size={12}/></div>}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-[#0A192F] text-sm leading-tight group-hover:text-orange-500 transition-colors truncate">{u.full_name || u.username || 'Anonymous'}</span>
                                    <span className="text-orange-500 font-mono text-[9px] font-bold truncate">@{u.username}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
 
                        <div className="px-5 py-4 bg-white">
                          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><MapPinIcon size={12}/> Top Itineraries</h3>
                          {topTrips.length === 0 ? <p className="text-xs text-zinc-400 font-medium mt-2">No trip locations match.</p> : (
                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                              {topTrips.map(p => (
                                <div 
                                  key={p.id}
                                  onClick={() => { setSearchQuery(p.location); navigate('/search'); setShowDropdown(false); }}
                                  className="flex items-center gap-3 p-2.5 bg-zinc-50 border border-zinc-100 hover:border-[#0A192F] hover:bg-white cursor-pointer group transition-all rounded-xl"
                                >
                                  <div className="w-8 h-8 bg-black rounded-lg shrink-0 overflow-hidden">
                                     <img src={p.images[0]?.url} alt="Cover" className="w-full h-full object-cover opacity-80" />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                     <span className="font-bold text-[#0A192F] text-sm leading-tight group-hover:text-orange-500 transition-colors truncate">{p.caption.split('#')[0]}</span>
                                     <span className="text-zinc-500 text-[9px] uppercase font-bold flex items-center gap-1 truncate"><MapPinIcon size={10} className="text-orange-500"/> {p.location}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-[#0A192F] text-white text-center font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); navigate('/search'); setShowDropdown(false); }}>
                         Press Enter To Full Search
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-4 rounded-2xl backdrop-blur-md border transition-all ${
                  showFilters 
                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                    : 'bg-white/10 border-zinc-200 text-[#0A192F] hover:bg-white/20'
                }`}
              >
                <Filter size={24} />
              </button>
              <button 
                type="submit"
                className="bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl hover:bg-orange-400 transition-all"
              >
                Search
              </button>
            </div>
 
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/95 backdrop-blur-md border border-zinc-200 rounded-3xl p-4 shadow-2xl"
                >
                  <FilterBar />
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </section>
 
      {/* Discovery Tabs Section */}
      <div className="flex items-center justify-center -mt-8">
        <div className="bg-white/50 backdrop-blur-md border border-zinc-200 p-1.5 rounded-2xl flex gap-1">
          {[
            { id: 'Feed', icon: LayoutGrid, label: 'Feed' },
            { id: 'Photos', icon: ImageIcon, label: 'Photos' },
            { id: 'Videos', icon: Video, label: 'Videos' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'text-zinc-500 hover:text-[#0A192F]'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : ''} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
 
      <PublishModal 
        isOpen={isPublishModalOpen} 
        onClose={() => setIsPublishModalOpen(false)} 
        onPublishSuccess={(newPost) => setDbPosts(prev => [newPost, ...prev])} 
      />
 
      <AnimatePresence mode="wait">
        {activeTab === 'Feed' ? (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto space-y-10"
          >
            {/* Feed Mode Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white border border-zinc-200 p-1 rounded-full flex gap-1 shadow-sm">
                <button
                  onClick={() => setFeedMode('Discover')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all ${
                    feedMode === 'Discover' ? 'bg-[#0A192F] text-white' : 'text-zinc-500 hover:text-[#0A192F]'
                  }`}
                >
                  Discover
                </button>
                <button
                  onClick={() => setFeedMode('Following')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all ${
                    feedMode === 'Following' ? 'bg-[#0A192F] text-white' : 'text-zinc-500 hover:text-[#0A192F]'
                  }`}
                >
                  Following
                </button>
              </div>
            </div>
 
            {/* Create Post Prompt */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-orange-500/20">
                <img src={currentUserProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100"} alt={currentUserProfile?.username || "Current User"} className="w-full h-full object-cover bg-zinc-100" />
              </div>
              <button 
                onClick={() => setIsPublishModalOpen(true)}
                className="flex-1 text-left bg-zinc-50 hover:bg-zinc-100 transition-colors py-3.5 px-6 rounded-full text-zinc-500 font-medium border border-zinc-200"
              >
                Share your latest trip...
              </button>
              <button 
                onClick={() => setIsPublishModalOpen(true)} 
                className="p-3 text-orange-500 bg-orange-500/10 rounded-full hover:bg-orange-500/20 transition-colors"
              >
                <ImageIcon size={20} />
              </button>
            </div>

            {/* Live Location tracking banner */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-full">
                  <Navigation size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[#0A192F] text-sm md:text-base">Local Discovery</h4>
                  {userLocation ? (
                    <p className="text-blue-600 text-xs md:text-sm font-medium">📍 Sorting by real-time geographical proximity</p>
                  ) : (
                    <p className="text-zinc-500 text-xs md:text-sm">Turn on live location for precise local recommendations.</p>
                  )}
                </div>
              </div>
              {!userLocation && (
                <button 
                  onClick={requestLocation}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
            
            {isDbLoading ? (
              <FeedSkeleton />
            ) : homePosts.length === 0 ? (
              feedMode === 'Following' ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 shadow-sm flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Users size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A192F] mb-2">Build Your Network</h3>
                  <p className="text-zinc-500 max-w-sm mb-6">
                    You aren't following anyone yet. Switch to the Discover feed to find incredible creators and itineraries to be inspired by!
                  </p>
                  <button 
                    onClick={() => setFeedMode('Discover')}
                    className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                  >
                    Explore Discover Flow
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] p-16 text-center border border-zinc-200 shadow-sm flex flex-col items-center">
                  <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
                    <MapPinIcon size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A192F] mb-4">No trips published yet</h3>
                  <p className="text-zinc-500 max-w-md mx-auto mb-8">
                    Be the first to share an itinerary with the community! Click the button above to publish your travel history.
                  </p>
                </div>
              )
            ) : (
              homePosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm border ${userInterestTags.some(tag => post.location.includes(tag)) ? 'border-orange-500/50 shadow-orange-500/10' : 'border-zinc-100'}`}
                >
                  {/* Post Header */}
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/user/${post.user}`} className="shrink-0 hover:opacity-80 transition-opacity">
                        <SmartImage 
                          src={post.avatar} 
                          alt={post.user} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-orange-500/20" 
                        />
                      </Link>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <Link to={`/user/${post.user}`} className="hover:underline decoration-orange-500 underline-offset-2">
                            <h3 className="font-bold text-[#0A192F] leading-tight">
                              {post.user}
                            </h3>
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollow(post.user, post.isPrivate || false);
                            }}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                              followedUsers.includes(post.user)
                                ? 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50' // Following (gives unfollow context on hover)
                                : requestedUsers.includes(post.user)
                                ? 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200' // Requested
                                : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' // Not Following (Public or Private)
                            }`}
                          >
                            {followedUsers.includes(post.user) 
                              ? 'Following' 
                              : requestedUsers.includes(post.user)
                              ? 'Requested'
                              : 'Follow'}
                          </button>
                          <span className="text-zinc-400 font-normal ml-1">—</span> 
                          <span className="text-orange-500">{post.location}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-zinc-400 font-medium">2 hours ago</p>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={10} 
                                className={i < post.rating ? 'fill-orange-500 text-orange-500' : 'text-zinc-200'} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="text-zinc-400 hover:text-[#0A192F] transition-colors">
                      <Share2 size={20} />
                    </button>
                  </div>
                  
                  {/* Post Carousel */}
                  <MediaCarousel images={post.images} />

                  {/* Post Engagement & Content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => togglePostLike(post.id)}
                        className={`flex items-center gap-2 transition-colors group ${userLikedPosts.includes(post.id) ? 'text-rose-500' : 'text-[#0A192F] hover:text-rose-500'}`}
                      >
                        <Heart size={26} className={`transition-all ${userLikedPosts.includes(post.id) ? 'fill-rose-500 scale-110 drop-shadow-md' : 'group-hover:fill-rose-500'}`} />
                        <span className="font-bold">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-[#0A192F] hover:text-orange-500 transition-colors group">
                        <MessageCircle size={26} className="group-hover:fill-orange-500/20 transition-all" />
                        <span className="font-bold">{post.comments}</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-zinc-600 leading-relaxed">
                        <span className="font-bold text-[#0A192F] mr-2">{post.user}</span>
                        {post.caption}
                      </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {post.activities.map(activity => (
                            <span key={activity} className="px-3 py-1 rounded-full bg-zinc-50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-100">
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-4">
                        <button 
                          onClick={() => {
                            addUserInterest(post.location.split(',')[0]);
                            navigate(`/trip/${post.id}`);
                          }}
                          className="text-zinc-500 text-sm font-bold hover:text-[#0A192F] transition-colors"
                        >
                          View Itinerary
                        </button>
                        
                        <button 
                          onClick={() => {
                            addUserInterest(post.location.split(',')[0]);
                            addToRemixFolder(post);
                          }}
                          className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all group/book"
                        >
                          <Wand2 size={16} className="group-hover/book:rotate-12 transition-transform" />
                          Add to Remix
                        </button>
                      </div>
                    </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <CollageGrid items={homePosts} type={activeTab as 'Photos' | 'Videos'} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

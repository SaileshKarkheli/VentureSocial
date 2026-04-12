import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext';
import SmartImage from '../components/SmartImage';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { publicPosts, followedUsers, requestedUsers, toggleFollow } = useApp();

  // Find all posts belonging to this user
  const userPosts = useMemo(() => {
    return publicPosts.filter(post => post.user === username);
  }, [publicPosts, username]);

  // Aggregate user data from their posts
  const userProfile = useMemo(() => {
    if (userPosts.length === 0) return null;
    const firstPost = userPosts[0];
    
    // Calculate total likes across all trips
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes, 0);

    return {
      name: firstPost.user,
      avatar: firstPost.avatar,
      isPrivate: firstPost.isPrivate || false,
      location: firstPost.location.split(',')[0], // Approximation of their base
      bio: `Adventure seeker pushing boundaries. Exploring the world one trip at a time.`,
      stats: [
        { label: 'Trips', value: userPosts.length.toString() },
        { label: 'Total Likes', value: totalLikes > 1000 ? (totalLikes/1000).toFixed(1) + 'k' : totalLikes.toString() },
        { label: 'Followers', value: (Math.floor(Math.random() * 50) + 10).toString() + 'k' } // Mock follower count
      ]
    };
  }, [userPosts]);

  if (!userProfile || !username) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-[#0A192F] mb-4">User not found</h2>
        <button onClick={() => navigate(-1)} className="text-orange-500 hover:underline">Go back</button>
      </div>
    );
  }

  const isFollowing = followedUsers.includes(username);
  const isRequested = requestedUsers.includes(username);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-zinc-900">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-500 hover:text-[#0A192F] transition-colors font-bold mb-4"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Profile Header */}
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
          alt="Cover"
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      <div className="relative px-4 md:px-8 -mt-20">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-1 shadow-xl border-4 border-white">
              <SmartImage
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
          
          <div className="flex-1 pb-4">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0A192F]">{userProfile.name}</h2>
            <div className="flex items-center gap-2 text-zinc-500 mt-1">
              <MapPin size={16} className="text-orange-500" />
              <span>{userProfile.location}</span>
            </div>
            <p className="text-zinc-600 leading-relaxed mt-4 max-w-lg">{userProfile.bio}</p>
          </div>

          <div className="flex gap-4 pb-4 w-full md:w-auto">
            <button 
              onClick={() => toggleFollow(username, userProfile.isPrivate)}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-bold transition-all shadow-lg text-center ${
                isFollowing
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-rose-50 hover:text-rose-500 border border-zinc-200 hover:border-rose-200' 
                  : isRequested
                  ? 'bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200'
                  : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600'
              }`}
            >
              {isFollowing ? 'Following' : isRequested ? 'Requested 🔒' : 'GuideMe'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 text-center bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm mb-12">
          {userProfile.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xl md:text-2xl font-display font-bold text-[#0A192F]">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-bold tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Grid / Content Engine */}
        {userProfile.isPrivate && !isFollowing ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-50 flex items-center justify-center rounded-full mb-4">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-2xl font-bold text-[#0A192F] mb-2">This Account is Private</h3>
            <p className="text-zinc-500 font-medium">Follow this creator to view their highly curated itineraries.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-display text-[#0A192F]">Travel Portfolio</h3>
                <p className="text-zinc-500 text-sm">A chronological journey through {userProfile.name.split(' ')[0]}'s explored destinations.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-y-16 gap-x-6 relative">
              {userPosts.map((post, index) => (
                <div key={post.id} className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={() => navigate(`/trip/${post.id}`)}
                    className="w-full aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-2xl border-4 border-white relative z-10 group bg-zinc-100"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      style={{ backgroundImage: `url(${post.images[0]?.url || post.avatar})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                      <span className="block text-orange-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1 drop-shadow-sm">
                        {Math.floor(post.price / 100)} Days
                      </span>
                      <h3 className="text-white font-display font-bold text-lg leading-tight truncate px-2">
                        {post.location}
                      </h3>
                      <button
                        className="mt-2 text-[10px] font-bold text-white/60 hover:text-orange-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                      >
                        View Itinerary
                      </button>
                    </div>
                  </motion.div>

                  {/* Chronological Arrow Connector */}
                  {index < userPosts.length - 1 && (
                    <div className="absolute top-1/2 -right-8 -translate-y-1/2 z-0 hidden md:flex items-center justify-center text-orange-500/20 group-hover:text-orange-500 transition-colors">
                      <ArrowRight size={32} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

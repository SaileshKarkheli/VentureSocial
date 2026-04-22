import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, MapPin, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';
import ImageViewerModal from '../components/ImageViewerModal';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, followedUsers, toggleFollow } = useApp(); // Explicitly destructured Followed Users
  
  const [isLoading, setIsLoading] = useState(true);
  const [targetProfile, setTargetProfile] = useState<any>(null);
  
  // Real-time matrix stats
  const [metrics, setMetrics] = useState({ followers: 0, following: 0 });
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    
    const fetchTargetProfile = async () => {
      setIsLoading(true);
      // Query flexibly by ID or Username to handle all entry points
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${username},username.eq.${username}`)
        .single();
        
      if (profileData) {
        setTargetProfile(profileData);
        
        // Exact counting queries executing natively on the SQL index
        const [followersRes, followingRes] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id)
        ]);

        setMetrics({
          followers: followersRes.count || 0,
          following: followingRes.count || 0
        });
      }
      setIsLoading(false);
    };
    fetchTargetProfile();
  }, [username, followedUsers]); // reload stats optionally when local follow shifts

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;
  }

  if (!targetProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-[#0A192F] mb-4">User not found</h2>
        <button onClick={() => navigate(-1)} className="text-orange-500 font-bold hover:underline underline-offset-4">Go back to Safety</button>
      </div>
    );
  }

  // The 'Is_Owner' Check Logic explicitly required by Step 6
  const isOwner = user?.id === targetProfile.id;

  const userData = {
    name: targetProfile.full_name || targetProfile.username || 'Anonymous Explorer',
    location: targetProfile.location || '',
    education: targetProfile.education || '',
    bio: targetProfile.bio || '',
    avatar: targetProfile.avatar_url || "",
    cover: targetProfile.cover_photo_url || "",
    stats: [
      { label: 'Trips', value: '0' }, // Feed mapped in future phase
      { label: 'Following', value: metrics.following.toString() },
      { label: 'Followers', value: metrics.followers.toString() }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-zinc-900">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-500 hover:text-[#0A192F] transition-colors font-bold mb-4"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* Strict Read-Only Cover Frame */}
      <div className="relative h-64 rounded-3xl overflow-hidden bg-zinc-200 border border-zinc-200">
        {userData.cover ? (
          <img
            src={userData.cover}
            alt="Cover"
            className="w-full h-full object-cover opacity-80 cursor-pointer"
            onClick={() => setSelectedFullImage(userData.cover)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#0A192F]/5 to-[#0A192F]/10 flex items-center justify-center">
            {/* Native empty state without Camera overlays */}
          </div>
        )}
      </div>

      <div className="relative px-8 -mt-20">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          
          {/* Strict Read-Only Avatar Frame */}
          <div className="relative mt-8 shrink-0">
            <div className="w-40 h-40 rounded-3xl bg-white p-1 shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-2xl cursor-pointer"
                  onClick={() => setSelectedFullImage(userData.avatar)}
                />
              ) : (
                <div className="w-full h-full bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <UserIcon size={48} className="text-zinc-300" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 pb-4">
            <h2 className="text-4xl font-display font-bold text-[#0A192F]">{userData.name}</h2>
            {userData.location && (
              <div className="flex items-center gap-2 text-zinc-500 mt-1">
                <MapPin size={16} className="text-orange-500" />
                <span>{userData.location}</span>
              </div>
            )}
            {userData.bio && (
              <p className="text-zinc-600 leading-relaxed mt-4 max-w-lg">{userData.bio}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            {isOwner ? (
              <button 
                onClick={() => navigate('/profile')}
                className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-colors"
              >
                Edit My Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={() => toggleFollow(targetProfile.id, false)}
                  className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-colors ${
                    followedUsers.includes(targetProfile.id)
                      ? 'bg-zinc-100 text-zinc-600 hover:bg-rose-50 hover:text-rose-500 border border-zinc-200 hover:border-rose-200'
                      : 'bg-[#0A192F] text-white hover:bg-black'
                  }`}
                >
                  {followedUsers.includes(targetProfile.id) ? 'Following' : 'Follow'}
                </button>
                <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare size={16} /> Contact
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {userData.education && (
              <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1">Education</p>
                <p className="text-sm text-[#0A192F] font-medium">{userData.education}</p>
              </section>
            )}

            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
               <h3 className="text-xl font-bold font-display text-[#0A192F]">Public Trips</h3>
               <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No Public Trips Yet</p>
               </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                {userData.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-display font-bold text-[#0A192F]">{stat.value}</p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        <ImageViewerModal 
          isOpen={!!selectedFullImage} 
          imageSrc={selectedFullImage} 
          onClose={() => setSelectedFullImage(null)} 
        />
      </AnimatePresence>
    </div>
  );
}

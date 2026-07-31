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
    
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
    if (isMockMode) {
      const mockProfiles: Record<string, any> = {
        'u123': {
          id: 'u123',
          full_name: 'Alex Explorer',
          username: 'alex_explorer',
          bio: 'Adventure seeker, photography enthusiast, and coffee lover. Mapping the world one city at a time.',
          location: 'San Francisco, CA',
          education: 'Stanford University',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
          cover_photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          followers: 15,
          following: 2
        },
        'alex_explorer': {
          id: 'u123',
          full_name: 'Alex Explorer',
          username: 'alex_explorer',
          bio: 'Adventure seeker, photography enthusiast, and coffee lover. Mapping the world one city at a time.',
          location: 'San Francisco, CA',
          education: 'Stanford University',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
          cover_photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          followers: 15,
          following: 2
        },
        'u1': {
          id: 'u1',
          full_name: 'Sarah Miller',
          username: 'sarah_miller',
          bio: 'Music enthusiast and foodie traveler. Living life one song and BBQ joint at a time.',
          location: 'Nashville, TN',
          education: 'Vanderbilt University',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
          cover_photo_url: 'https://images.unsplash.com/photo-1513829096996-c85c54be37cd?auto=format&fit=crop&w=1200&q=80',
          followers: 42,
          following: 10
        },
        'sarah_miller': {
          id: 'u1',
          full_name: 'Sarah Miller',
          username: 'sarah_miller',
          bio: 'Music enthusiast and foodie traveler. Living life one song and BBQ joint at a time.',
          location: 'Nashville, TN',
          education: 'Vanderbilt University',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
          cover_photo_url: 'https://images.unsplash.com/photo-1513829096996-c85c54be37cd?auto=format&fit=crop&w=1200&q=80',
          followers: 42,
          following: 10
        },
        'u2': {
          id: 'u2',
          full_name: 'Alex Chen',
          username: 'alex_chen',
          bio: 'History buff and pasta lover. Exploring ancient ruins and searching for the gelato spots.',
          location: 'Rome, Italy',
          education: 'University of Bologna',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
          cover_photo_url: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
          followers: 89,
          following: 25
        },
        'alex_chen': {
          id: 'u2',
          full_name: 'Alex Chen',
          username: 'alex_chen',
          bio: 'History buff and pasta lover. Exploring ancient ruins and searching for the gelato spots.',
          location: 'Rome, Italy',
          education: 'University of Bologna',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
          cover_photo_url: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
          followers: 89,
          following: 25
        },
        'u3': {
          id: 'u3',
          full_name: 'Emma Wilson',
          username: 'emma_wilson',
          bio: 'Yogi, beach bum, and travel blogger. Finding peace and adventures in tropical paradises.',
          location: 'Ubud, Bali',
          education: 'UC Berkeley',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
          cover_photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          followers: 156,
          following: 40
        },
        'emma_wilson': {
          id: 'u3',
          full_name: 'Emma Wilson',
          username: 'emma_wilson',
          bio: 'Yogi, beach bum, and travel blogger. Finding peace and adventures in tropical paradises.',
          location: 'Ubud, Bali',
          education: 'UC Berkeley',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
          cover_photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          followers: 156,
          following: 40
        }
      };

      const matched = mockProfiles[username.toLowerCase()];
      if (matched) {
        setTargetProfile(matched);
        setMetrics({ followers: matched.followers, following: matched.following });
      } else {
        const defaultMock = {
          id: 'u-fallback',
          full_name: username.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          username: username,
          bio: 'Travel Enthusiast on VentureSocial.',
          location: 'Everywhere',
          education: 'World Travel Academy',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100',
          cover_photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
        };
        setTargetProfile(defaultMock);
        setMetrics({ followers: 10, following: 5 });
      }
      setIsLoading(false);
      return;
    }

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
        <h2 className="text-2xl font-bold text-ink mb-4">User not found</h2>
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-ink">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-body hover:text-ink transition-colors font-bold mb-4"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* Strict Read-Only Cover Frame */}
      <div className="relative h-64 rounded-3xl overflow-hidden bg-zinc-200 border border-hairline">
        {userData.cover ? (
          <img
            src={userData.cover}
            alt="Cover"
            className="w-full h-full object-cover opacity-80 cursor-pointer"
            onClick={() => setSelectedFullImage(userData.cover)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-ink/5 to-ink/10 flex items-center justify-center">
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
                <div className="w-full h-full bg-cream rounded-2xl flex items-center justify-center">
                  <UserIcon size={48} className="text-zinc-300" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 pb-4">
            <h2 className="text-4xl font-display font-bold text-ink">{userData.name}</h2>
            {userData.location && (
              <div className="flex items-center gap-2 text-body mt-1">
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
                      ? 'bg-cream text-zinc-600 hover:bg-rose-50 hover:text-rose-500 border border-hairline hover:border-rose-200'
                      : 'bg-ink text-white hover:bg-black'
                  }`}
                >
                  {followedUsers.includes(targetProfile.id) ? 'Following' : 'Follow'}
                </button>
                <button 
                  onClick={() => navigate(`/messages?user=${targetProfile.id}`)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} /> Contact
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {userData.education && (
              <section className="bg-white p-6 rounded-2xl border border-hairline shadow-sm">
                <p className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Education</p>
                <p className="text-sm text-ink font-medium">{userData.education}</p>
              </section>
            )}

            <section className="bg-white p-6 rounded-2xl border border-hairline shadow-sm space-y-6">
               <h3 className="text-xl font-bold font-display text-ink">Public Trips</h3>
               <div className="text-center py-12 bg-tint rounded-xl border border-dashed border-hairline">
                  <p className="text-muted font-bold uppercase tracking-widest text-xs">No Public Trips Yet</p>
               </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-6 rounded-2xl border border-hairline shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                {userData.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-display font-bold text-ink">{stat.value}</p>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider">{stat.label}</p>
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

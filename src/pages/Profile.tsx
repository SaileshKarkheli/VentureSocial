import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Mail, Calendar, MapPin, Camera, Edit2, Bookmark, ExternalLink, Bed, Utensils, Info, Plus, Shield, ShieldCheck, MessageSquare, Loader2, Instagram, Twitter, Globe, Play } from 'lucide-react';
import { useApp } from '../AppContext';
import ChatOverlay from '../components/ChatOverlay';
import { supabase } from '../supabaseClient';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import ImageViewerModal from '../components/ImageViewerModal';

export default function Profile() {
  const { savedItems, followedUsers, user, currentUserProfile, updateActiveProfile, requestedUsers, approveFollowRequest } = useApp();
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [tripCount, setTripCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'media' | 'about'>('media');
  
  // Media Grid State
  const [userMedia, setUserMedia] = useState<Array<{ url: string; type: 'image' | 'video' }>>([]);
  
  // About Tab Form State
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [dob, setDob] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync form states with global profile changes
  useEffect(() => {
    if (currentUserProfile) {
      setFullName(currentUserProfile.full_name || '');
      setBio(currentUserProfile.bio || '');
      setLocation(currentUserProfile.location || '');
      setEducation(currentUserProfile.education || '');
      setDob(currentUserProfile.dob || '');
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
    if (isMockMode) {
      const mockProf = {
        full_name: user.name || 'Alex Explorer',
        username: user.email ? user.email.split('@')[0] : 'alex_explorer',
        bio: "Adventure seeker, photography enthusiast, and coffee lover. Mapping the world one city at a time.",
        location: "San Francisco, CA",
        education: "Stanford University",
        avatar_url: user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100",
        cover_photo_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        dob: "1995-06-15"
      };
      setDbProfile(mockProf);
      setFullName(mockProf.full_name);
      setBio(mockProf.bio);
      setLocation(mockProf.location);
      setEducation(mockProf.education);
      setDob(mockProf.dob);
      setTripCount(3);
      setFollowersCount(15);

      // Populate mock media
      const mediaList: Array<{ url: string; type: 'image' | 'video' }> = [];
      const mockMyTripsData = [
        {
          id: '1',
          availableImages: [
            'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80'
          ]
        },
        {
          id: '2',
          availableImages: [
            'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&w=800&q=80'
          ]
        },
        {
          id: '3',
          availableImages: [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80'
          ]
        }
      ];
      
      mockMyTripsData.forEach(t => {
        t.availableImages.forEach(img => {
          mediaList.push({ url: img, type: 'image' });
        });
      });

      mediaList.push({
        url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=400&q=80',
        type: 'video'
      });

      const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
      const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
      customTrips.forEach((t: any) => {
        if (t.spots) {
          t.spots.forEach((spot: any) => {
            if (spot.image_url) {
              mediaList.push({ url: spot.image_url, type: 'image' });
            }
            if (spot.video_url) {
              mediaList.push({ url: spot.video_url, type: 'video' });
            }
          });
        } else if (t.image) {
          mediaList.push({ url: t.image, type: 'image' });
        }
      });

      setUserMedia(mediaList);
      setIsLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setDbProfile(data);
          setFullName(data.full_name || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          setEducation(data.education || '');
          setDob(data.dob || '');
          setIsPrivateAccount(data.is_private || false);
        }

        // Fetch Dynamic Stats
        const { count: trips } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        const { count: followers } = await supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', user.id);
        
        setTripCount(trips || 0);
        setFollowersCount(followers || 0);

        // Fetch pending follow requests for this user
        const { data: requestsData } = await supabase
          .from('follow_requests')
          .select('*, requester:profiles!follow_requests_requester_id_fkey(id, username, full_name, avatar_url)')
          .eq('target_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setPendingRequests(requestsData || []);

        // Fetch trip spots media
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id);
          
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map((p: any) => p.id);
          const { data: spotsData } = await supabase
            .from('trip_spots')
            .select('*')
            .in('post_id', postIds);
            
          if (spotsData) {
            const mediaList: Array<{ url: string; type: 'image' | 'video' }> = [];
            spotsData.forEach((spot: any) => {
              if (Array.isArray(spot.image_urls) && spot.image_urls.length > 0) {
                spot.image_urls.forEach((url: string) => {
                  mediaList.push({ url, type: 'image' });
                });
              } else if (spot.image_url) {
                mediaList.push({ url: spot.image_url, type: 'image' });
              }
            });
            setUserMedia(mediaList);
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  // Persist privacy toggle to Supabase
  const handlePrivacyToggle = async () => {
    if (!user) return;
    const newValue = !isPrivateAccount;
    setIsPrivateAccount(newValue);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: newValue })
        .eq('id', user.id);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to update privacy setting:', err);
      setIsPrivateAccount(!newValue); // Revert on error
    }
  };

  const handleSaveAbout = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    setSaveStatus(null);
    
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
    
    const updatePayload = {
      full_name: fullName,
      bio: bio,
      location: location,
      education: education,
      dob: dob
    };

    try {
      if (isMockMode) {
        updateActiveProfile(updatePayload);
        setDbProfile((prev: any) => ({ ...prev, ...updatePayload }));
        setSaveStatus({ type: 'success', message: 'Profile saved successfully (Mock Mode).' });
      } else {
        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.id);
          
        if (error) throw error;
        
        updateActiveProfile(updatePayload);
        setDbProfile((prev: any) => ({ ...prev, ...updatePayload }));
        setSaveStatus({ type: 'success', message: 'Profile saved successfully!' });
      }
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveStatus({ type: 'error', message: err.message || 'Failed to save profile. Please try again.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const userData = {
    name: currentUserProfile?.full_name || dbProfile?.full_name || user?.name || 'New Explorer',
    dob: currentUserProfile?.dob || dbProfile?.dob || '',
    email: user?.email || '',
    location: currentUserProfile?.location || dbProfile?.location || '',
    education: currentUserProfile?.education || dbProfile?.education || '',
    bio: currentUserProfile?.bio || dbProfile?.bio || '',
    avatar: currentUserProfile?.avatar_url || dbProfile?.avatar_url || user?.avatar || "",
    cover: currentUserProfile?.cover_photo_url || dbProfile?.cover_photo_url || "",
    stats: [
      { label: 'Trips', value: tripCount.toString() },
      { label: 'Following', value: followedUsers.length.toString() },
      { label: 'Followers', value: followersCount.toString() }
    ]
  };

  const socialLinks = dbProfile?.social_links || {};
  const hasSocialLinks = socialLinks.instagram || socialLinks.twitter || socialLinks.website;

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 text-zinc-900">
      <div className="relative h-64 rounded-3xl overflow-hidden bg-zinc-200 border border-zinc-200">
        {userData.cover ? (
          <img
            src={userData.cover}
            alt="Cover"
            className="w-full h-full object-cover opacity-80 cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={() => setSelectedFullImage(userData.cover)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#0A192F]/5 to-[#0A192F]/10 flex items-center justify-center">
            <Camera size={48} className="text-[#0A192F]/20" />
          </div>
        )}
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md text-zinc-900 p-2 rounded-full hover:bg-white transition-colors border border-zinc-200 shadow-lg cursor-pointer z-10"
        >
          <Camera size={20} />
        </button>
      </div>

      <div className="relative px-8 -mt-20">
        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
          <div className="relative mt-8">
            <div className="w-40 h-40 rounded-3xl bg-white p-1 shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-2xl cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={() => setSelectedFullImage(userData.avatar)}
                />
              ) : (
                <div className="w-full h-full bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <UserIcon size={48} className="text-zinc-300" />
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-xl shadow-lg hover:bg-orange-400 transition-colors cursor-pointer z-10"
            >
              <Camera size={16} />
            </button>
          </div>

          <div className="flex-1 pb-4">
            <h2 className="text-4xl font-display font-bold text-[#0A192F]">{userData.name}</h2>
            {userData.location && (
              <div className="flex items-center gap-2 text-zinc-500 mt-1">
                <MapPin size={16} className="text-orange-500" />
                <span>{userData.location}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-[#0A192F] text-white px-6 py-2 rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <MessageSquare size={16} /> Message
            </button>
          </div>
        </div>

        {/* Stats Bar (Full Width) */}
        <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm mb-8">
          <div className="grid grid-cols-3 gap-4 text-center max-w-xl mx-auto">
            {userData.stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-display font-bold text-[#0A192F]">{stat.value}</p>
                <p className="text-xs text-zinc-400 uppercase font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Tab Bar */}
            <div className="flex border-b border-zinc-200 mb-6 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm">
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-3 px-6 font-bold text-sm rounded-xl transition-all ${
                  activeTab === 'media'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-zinc-500 hover:text-[#0A192F] hover:bg-zinc-50'
                }`}
              >
                Photos & Videos
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex-1 py-3 px-6 font-bold text-sm rounded-xl transition-all ${
                  activeTab === 'about'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-zinc-500 hover:text-[#0A192F] hover:bg-zinc-50'
                }`}
              >
                About
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'media' ? (
              <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <h3 className="text-lg font-bold text-[#0A192F] mb-6">Photos & Videos</h3>
                {userMedia.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1">
                    {userMedia.map((media, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer border border-zinc-100 bg-zinc-50 shadow-sm"
                        onClick={() => setSelectedFullImage(media.url)}
                      >
                        <img
                          src={media.url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {media.type === 'video' && (
                          <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white shadow-md">
                            <Play size={12} className="fill-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <Camera size={36} className="mx-auto text-zinc-300 mb-2" />
                    <p className="text-zinc-400 text-sm font-medium">No photos or videos yet.</p>
                  </div>
                )}
              </section>
            ) : (
              /* About Tab Content */
              <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-[#0A192F] mb-2">About Me & Personal Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 text-sm font-medium"
                      placeholder="Full Name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 text-sm font-medium resize-none custom-scrollbar"
                      placeholder="Tell the world about your travels..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 text-sm font-medium"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Education</label>
                    <input
                      type="text"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 text-sm font-medium"
                      placeholder="e.g. Stanford University"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm text-zinc-700 font-medium"
                    />
                  </div>
                </div>

                {saveStatus && (
                  <div className={`p-4 rounded-2xl text-xs font-bold ${
                    saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    {saveStatus.message}
                  </div>
                )}

                <button
                  onClick={handleSaveAbout}
                  disabled={isSavingProfile}
                  className="w-full bg-[#0A192F] text-white font-bold py-3.5 rounded-2xl shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="animate-spin" size={18} /> : 'Save About Info'}
                </button>
              </section>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Pending Follow Requests Section */}
            {pendingRequests.length > 0 && (
              <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-[#0A192F] flex items-center gap-2">
                  <Shield size={20} className="text-orange-500" />
                  Follow Requests
                  <span className="text-xs font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200">
                          {req.requester?.avatar_url ? (
                            <img src={req.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={20} className="text-zinc-400 m-2" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#0A192F] text-sm">{req.requester?.full_name || req.requester?.username || 'Unknown'}</p>
                          <p className="text-xs text-zinc-400">@{req.requester?.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await approveFollowRequest(req.requester_id);
                            setPendingRequests(prev => prev.filter(r => r.id !== req.id));
                            setFollowersCount(prev => prev + 1);
                          }}
                          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            await supabase.from('follow_requests').delete().eq('id', req.id);
                            setPendingRequests(prev => prev.filter(r => r.id !== req.id));
                          }}
                          className="bg-zinc-200 text-zinc-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-300 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Saved Items Section */}
            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0A192F] flex items-center gap-2">
                  <Bookmark size={20} className="text-orange-500" />
                  Saved for Later
                </h3>
                <span className="text-xs font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                  {savedItems.length} ITEMS
                </span>
              </div>

              {savedItems.length > 0 ? (
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-orange-500 shadow-sm border border-zinc-100">
                          {item.type === 'Stay' && <Bed size={20} />}
                          {item.type === 'Restaurant' && <Utensils size={20} />}
                          {item.type === 'Service' && <Info size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{item.type}</p>
                          <p className="font-bold text-[#0A192F] text-sm">{item.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white text-zinc-400 hover:text-orange-500 transition-colors shadow-sm border border-zinc-100"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button className="p-2 rounded-lg bg-white text-zinc-400 hover:text-rose-500 transition-colors shadow-sm border border-zinc-100">
                          <Plus size={16} className="rotate-45" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <Bookmark size={24} className="mx-auto text-zinc-300 mb-2" />
                  <p className="text-zinc-400 text-sm">No saved items yet.</p>
                </div>
              )}
            </section>

            {/* Account Privacy */}
            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <h3 className="text-lg font-bold text-[#0A192F] mb-4">Account Privacy</h3>
              <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#0A192F] text-sm flex items-center gap-2">
                    {isPrivateAccount ? <Shield size={16} className="text-zinc-500" /> : <ShieldCheck size={16} className="text-orange-500" />}
                    {isPrivateAccount ? 'Private Account' : 'Public Account (Standard)'}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                    {isPrivateAccount
                      ? 'Only approved followers can view your trips.'
                      : 'Anyone can view your trips and follow you instantly.'}
                  </p>
                </div>
                <button
                  onClick={handlePrivacyToggle}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isPrivateAccount ? 'bg-zinc-800' : 'bg-orange-500'}`}
                >
                  <motion.div
                    animate={{ x: isPrivateAccount ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                  />
                </button>
              </div>
            </section>

            {/* Social Links */}
            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <h3 className="text-lg font-bold text-[#0A192F] mb-4">Social Links</h3>
              {hasSocialLinks ? (
                <div className="space-y-3">
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-orange-500/10 hover:text-orange-500 transition-colors text-sm font-medium border border-zinc-100"
                    >
                      <Instagram size={16} />
                      <span className="truncate">Instagram</span>
                      <ExternalLink size={12} className="ml-auto text-zinc-400" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-orange-500/10 hover:text-orange-500 transition-colors text-sm font-medium border border-zinc-100"
                    >
                      <Twitter size={16} />
                      <span className="truncate">Twitter / X</span>
                      <ExternalLink size={12} className="ml-auto text-zinc-400" />
                    </a>
                  )}
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-orange-500/10 hover:text-orange-500 transition-colors text-sm font-medium border border-zinc-100"
                    >
                      <Globe size={16} />
                      <span className="truncate">Website</span>
                      <ExternalLink size={12} className="ml-auto text-zinc-400" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-4">No social links added yet.</p>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Absolute strict deployment of Chat UI layer */}
      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} targetUser="@travel_guru" />
      
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
          />
        )}
        
        <ImageViewerModal 
          isOpen={!!selectedFullImage} 
          imageSrc={selectedFullImage} 
          onClose={() => setSelectedFullImage(null)} 
        />
      </AnimatePresence>
    </div>
  );
}

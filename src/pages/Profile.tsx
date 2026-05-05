import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Mail, Calendar, MapPin, Camera, Edit2, Bookmark, ExternalLink, Bed, Utensils, Info, Plus, Shield, ShieldCheck, MessageSquare, Loader2 } from 'lucide-react';
import { useApp } from '../AppContext';
import ChatOverlay from '../components/ChatOverlay';
import { supabase } from '../supabaseClient';
import EditProfileModal from '../components/EditProfileModal';
import ImageCropperModal from '../components/ImageCropperModal';
import ImageViewerModal from '../components/ImageViewerModal';

export default function Profile() {
  const { savedItems, followedUsers, user } = useApp();
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);
  
  // Cropper Pipeline State
  const [cropperState, setCropperState] = useState<{ src: string, aspect: number, field: string } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [tripCount, setTripCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    if (!user) {
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
        }

        // Fetch Dynamic Stats
        const { count: trips } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
        const { count: followers } = await supabase.from('connections').select('follower_id', { count: 'exact', head: true }).eq('following_id', user.id);
        
        setTripCount(trips || 0);
        setFollowersCount(followers || 0);
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const initiateCropPipeline = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, aspect: number) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropperState({ src: event.target?.result as string, aspect, field: fieldName });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset strictly to allow re-uploading same file
  };

  const handleCropComplete = async (base64Str: string) => {
    if (!user || !cropperState) return;
    
    setDbProfile((prev: any) => ({ ...prev, [cropperState.field]: base64Str }));
    const currentField = cropperState.field;
    setCropperState(null); // Instantly drop modal
    
    try {
      const { error } = await supabase.from('profiles').update({ [currentField]: base64Str }).eq('id', user.id);
      if (error) throw error;
    } catch (err: any) {
      alert('Failed to save image permanently. Database failure.');
    }
  };

  const userData = {
    name: dbProfile?.full_name || user?.name || 'New Explorer',
    dob: dbProfile?.dob || '',
    email: user?.email || '',
    location: dbProfile?.location || '',
    education: dbProfile?.education || '',
    bio: dbProfile?.bio || '',
    avatar: dbProfile?.avatar_url || user?.avatar || "",
    cover: dbProfile?.cover_photo_url || "",
    stats: [
      { label: 'Trips', value: tripCount.toString() },
      { label: 'Following', value: followedUsers.length.toString() },
      { label: 'Followers', value: followersCount.toString() }
    ]
  };

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
        <label className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md text-zinc-900 p-2 rounded-full hover:bg-white transition-colors border border-zinc-200 shadow-lg cursor-pointer z-10">
          <input 
            type="file" 
            accept="image/*"
            className="hidden"
            onChange={(e) => initiateCropPipeline(e, 'cover_photo_url', 16/9)}
          />
          <Camera size={20} />
        </label>
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
            <label className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-xl shadow-lg hover:bg-orange-400 transition-colors cursor-pointer z-10">
              <input 
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={(e) => initiateCropPipeline(e, 'avatar_url', 1)}
              />
              <Camera size={16} />
            </label>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {(userData.bio || userData.education) && (
              <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                {userData.bio && (
                  <>
                    <h3 className="text-lg font-bold text-[#0A192F] mb-4">About Me</h3>
                    <p className="text-zinc-600 leading-relaxed">{userData.bio}</p>
                  </>
                )}
                {userData.education && (
                  <div className={userData.bio ? "mt-4 pt-4 border-t border-zinc-100" : ""}>
                    <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1">Education</p>
                    <p className="text-sm text-[#0A192F] font-medium">{userData.education}</p>
                  </div>
                )}
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

            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-[#0A192F] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 text-zinc-600">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                    <UserIcon size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Full Name</p>
                    <p className="font-medium text-[#0A192F]">{userData.name}</p>
                  </div>
                </div>
                {userData.email && (
                  <div className="flex items-center gap-3 text-zinc-600">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                      <Mail size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Email Address</p>
                      <p className="font-medium text-[#0A192F]">{userData.email}</p>
                    </div>
                  </div>
                )}
                {userData.dob && (
                  <div className="flex items-center gap-3 text-zinc-600">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                      <Calendar size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Date of Birth</p>
                      <p className="font-medium text-[#0A192F]">{userData.dob}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                {userData.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-display font-bold text-[#0A192F]">{stat.value}</p>
                    <p className="text-xs text-zinc-400 uppercase font-bold">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

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
                  onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isPrivateAccount ? 'bg-zinc-800' : 'bg-orange-500'}`}
                >
                  <motion.div
                    animate={{ x: isPrivateAccount ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                  />
                </button>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <h3 className="text-lg font-bold text-[#0A192F] mb-4">Social Links</h3>
              <div className="space-y-3">
                {['Instagram', 'Twitter', 'Personal Website'].map((link) => (
                  <button key={link} className="w-full text-left px-4 py-2 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-orange-500/10 hover:text-orange-500 transition-colors text-sm font-medium border border-zinc-100">
                    {link}
                  </button>
                ))}
              </div>
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
            currentProfile={dbProfile} 
            onProfileUpdate={(newData) => setDbProfile(prev => ({ ...prev, ...newData }))} 
          />
        )}
        
        <ImageViewerModal 
          isOpen={!!selectedFullImage} 
          imageSrc={selectedFullImage} 
          onClose={() => setSelectedFullImage(null)} 
        />
        
        {cropperState && (
          <ImageCropperModal
            imageSrc={cropperState.src}
            aspectRatio={cropperState.aspect}
            onCropComplete={handleCropComplete}
            onClose={() => setCropperState(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

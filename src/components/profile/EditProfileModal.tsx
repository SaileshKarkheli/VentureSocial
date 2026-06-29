import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../AppContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { session, userProfile, refreshProfile, updateUserProfile } = useAuth();
  const { activeProfile, updateActiveProfile } = useApp();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [dob, setDob] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(activeProfile?.full_name || userProfile?.full_name || '');
      setBio(activeProfile?.bio || userProfile?.bio || '');
      setLocation(activeProfile?.location || '');
      setEducation(activeProfile?.education || '');
      setDob(activeProfile?.dob || userProfile?.dob || '');
      const social = activeProfile?.social_links || userProfile?.social_links || {};
      setInstagram(social.instagram || '');
      setTwitter(social.twitter || '');
      setWebsite(social.website || '');
      setAvatarFile(null);
      setCoverFile(null);
    }
  }, [isOpen, activeProfile, userProfile]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsUploading(true);

    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');

    try {
      let finalAvatarUrl = activeProfile?.avatar_url || userProfile?.avatar_url;
      let finalCoverUrl = activeProfile?.cover_photo_url || userProfile?.cover_photo_url;

      if (isMockMode) {
        if (avatarFile) {
          finalAvatarUrl = URL.createObjectURL(avatarFile);
        }
        if (coverFile) {
          finalCoverUrl = URL.createObjectURL(coverFile);
        }
        const updatePayload: any = {
          full_name: fullName,
          bio: bio,
          location: location,
          education: education,
          dob: dob,
          social_links: { instagram, twitter, website }
        };
        if (avatarFile && finalAvatarUrl && finalAvatarUrl.trim() !== '') {
          updatePayload.avatar_url = finalAvatarUrl;
        }
        if (coverFile && finalCoverUrl && finalCoverUrl.trim() !== '') {
          updatePayload.cover_photo_url = finalCoverUrl;
        }
        updateActiveProfile(updatePayload);
        updateUserProfile(updatePayload);
        onClose();
        return;
      }

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = data.publicUrl;
      }

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(filePath, coverFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('covers').getPublicUrl(filePath);
        finalCoverUrl = data.publicUrl;
      }

      const updatePayload: any = {
        full_name: fullName,
        bio: bio,
        location: location,
        education: education,
        dob: dob,
        social_links: { instagram, twitter, website }
      };

      if (avatarFile && finalAvatarUrl && finalAvatarUrl.trim() !== '') {
        updatePayload.avatar_url = finalAvatarUrl;
      }
      if (coverFile && finalCoverUrl && finalCoverUrl.trim() !== '') {
        updatePayload.cover_photo_url = finalCoverUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      updateActiveProfile(updatePayload);
      await refreshProfile();
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-zinc-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold text-[#0A192F]">Edit Profile</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-500">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Avatar & Cover Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 shadow-sm">
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : activeProfile?.avatar_url ? (
                      <img src={activeProfile.avatar_url} alt="Current" className="w-full h-full object-cover" />
                    ) : userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Current" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all text-sm font-bold text-zinc-700">
                    <Upload size={16} />
                    Choose File
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAvatarFile(e.target.files[0]);
                      }
                    }} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Cover Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 shadow-sm">
                    {coverFile ? (
                      <img src={URL.createObjectURL(coverFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : activeProfile?.cover_photo_url ? (
                      <img src={activeProfile.cover_photo_url} alt="Current" className="w-full h-full object-cover" />
                    ) : userProfile?.cover_photo_url ? (
                      <img src={userProfile.cover_photo_url} alt="Current" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 transition-all text-sm font-bold text-zinc-700">
                    <Upload size={16} />
                    Choose File
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCoverFile(e.target.files[0]);
                      }
                    }} />
                  </label>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400"
                placeholder="Your Name"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-zinc-700"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400"
                placeholder="e.g. Paris, France"
              />
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400"
                placeholder="e.g. Master's in English"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 resize-none custom-scrollbar"
                placeholder="Tell the world about your travels..."
              />
            </div>

            {/* Social Links */}
            <div className="space-y-4 border-t border-zinc-100 pt-4">
              <h3 className="text-sm font-bold text-[#0A192F]">Social Links</h3>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Instagram</label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 text-sm"
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Twitter / X</label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 text-sm"
                  placeholder="https://x.com/yourhandle"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">Personal Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400 text-sm"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="w-full py-4 bg-[#0A192F] text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-black transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Save Profile'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

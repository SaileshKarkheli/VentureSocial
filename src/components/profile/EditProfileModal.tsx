import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { session, userProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsUploading(true);

    try {
      let finalAvatarUrl = userProfile?.avatar_url;

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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
          avatar_url: finalAvatarUrl
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-zinc-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold text-[#0A192F]">Edit Profile</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-500">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 shadow-sm">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useApp } from '../AppContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: any;
  onProfileUpdate: (updatedData: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, currentProfile, onProfileUpdate }: EditProfileModalProps) {
  const { user, updateActiveProfile } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    education: '',
    dob: '',
    avatar_url: '',
    cover_photo_url: '',
    social_links: { instagram: '', twitter: '', website: '' }
  });

  useEffect(() => {
    if (currentProfile) {
      const social = currentProfile.social_links || {};
      setFormData({
        full_name: currentProfile.full_name || '',
        bio: currentProfile.bio || '',
        location: currentProfile.location || '',
        education: currentProfile.education || '',
        dob: currentProfile.dob || '',
        avatar_url: currentProfile.avatar_url || '',
        cover_photo_url: currentProfile.cover_photo_url || '',
        social_links: {
          instagram: social.instagram || '',
          twitter: social.twitter || '',
          website: social.website || ''
        }
      });
    }
  }, [currentProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updatePayload: any = {
        full_name: formData.full_name,
        bio: formData.bio,
        location: formData.location,
        education: formData.education,
        dob: formData.dob,
        social_links: formData.social_links
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);
        
      if (error) throw error;
      onProfileUpdate(formData);
      updateActiveProfile(formData);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Failed to update profile. Ensure all columns exist in Supabase database.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-hairline bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-display font-bold text-ink">Edit Profile Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-cream text-muted hover:bg-rose-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <form id="edit-profile-form" onSubmit={handleSave} className="space-y-8">
            
            {/* General Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-hairline pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">Full Name</label>
                  <input 
                    type="text" 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">Location (City, Country)</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Paris, France"
                    className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">Date of Birth</label>
                  <input 
                    type="date" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">Education / University</label>
                  <input 
                    type="text" 
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g. Master's in English"
                    className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-hairline pb-2">About Section</h3>
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Short Biography</label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Introduce yourself to the global travel community..."
                  className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none resize-none"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest border-b border-hairline pb-2">Social Links</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">Instagram</label>
                  <input 
                    type="url" 
                    value={formData.social_links.instagram}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">Twitter / X</label>
                  <input 
                    type="url" 
                    value={formData.social_links.twitter}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    placeholder="https://x.com/yourhandle"
                    className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">Personal Website</label>
                  <input 
                    type="url" 
                    value={formData.social_links.website}
                    onChange={(e) => handleSocialChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full bg-tint border border-hairline rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 border-t border-hairline bg-tint">
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-hairline text-zinc-600 font-bold py-4 rounded-xl hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="edit-profile-form"
              disabled={isLoading}
              className="flex-1 bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              Save Profile Changes
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

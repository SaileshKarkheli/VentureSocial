import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { Loader2 } from 'lucide-react';

export default function DynamicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { session, userProfile: currentUserProfile } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);

      // Check if it's an ID or Username
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);

      const query = supabase.from('profiles').select('*');
      if (isUUID) {
        query.eq('id', username);
      } else {
        query.eq('username', username);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error('Profile not found', error);
        navigate('/home');
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [username, navigate, currentUserProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!profile) return null;

  const isOwner = session?.user?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <ProfileHeader 
        profile={isOwner ? currentUserProfile : profile} 
        isOwner={isOwner} 
        onEdit={() => setIsEditModalOpen(true)} 
      />

      <div className="bg-white rounded-3xl border border-zinc-100 p-8 text-center text-zinc-500 shadow-sm mt-6">
        <p>This user's trips and activity will appear here soon.</p>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
        }} 
      />
    </div>
  );
}

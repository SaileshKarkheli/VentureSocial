import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, UserCheck, Edit3 } from 'lucide-react';

interface ProfileHeaderProps {
  profile: any;
  isOwner: boolean;
  onEdit: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, isOwner, onEdit }) => {
  const { session } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user?.id || !profile?.id || isOwner) return;
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', session.user.id)
        .eq('following_id', profile.id)
        .single();
      
      if (data) setIsFollowing(true);
    };
    checkFollowStatus();
  }, [session?.user?.id, profile?.id, isOwner]);

  const handleFollowToggle = async () => {
    if (!session?.user?.id || !profile?.id) return;
    setIsLoadingFollow(true);

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: session.user.id, following_id: profile.id });
        
        await supabase
          .from('notifications')
          .insert({ user_id: profile.id, actor_id: session.user.id, type: 'follow' });
          
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setIsLoadingFollow(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-hairline shadow-sm overflow-hidden mb-6">
      {/* Cover Photo */}
      <div className="h-48 md:h-64 bg-zinc-200 relative w-full">
        {profile?.cover_photo_url ? (
          <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-500/20 to-ink/20" />
        )}
      </div>

      <div className="px-6 md:px-10 pb-8 relative">
        {/* Avatar */}
        <div className="absolute -top-16 border-4 border-white rounded-3xl bg-cream w-32 h-32 overflow-hidden shadow-lg">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-cream flex items-center justify-center text-muted text-4xl font-bold">
              {profile?.full_name?.[0] || '?'}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between mt-20 md:mt-4 gap-4">
          <div className="md:ml-36">
            <h1 className="text-3xl font-display font-bold text-ink">{profile?.full_name || 'Anonymous User'}</h1>
            <p className="text-orange-500 font-mono font-bold mt-1">@{profile?.username}</p>
            {profile?.bio && (
              <p className="text-zinc-600 mt-4 max-w-xl leading-relaxed">{profile.bio}</p>
            )}
          </div>

          <div className="flex-shrink-0">
            {isOwner ? (
              <button 
                onClick={onEdit}
                className="flex items-center gap-2 px-6 py-3 bg-cream text-ink font-bold rounded-2xl hover:bg-zinc-200 transition-all border border-hairline"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleFollowToggle}
                disabled={isLoadingFollow}
                className={`flex items-center gap-2 px-8 py-3 font-bold rounded-2xl transition-all shadow-xl ${
                  isFollowing 
                    ? 'bg-cream text-zinc-700 hover:bg-zinc-200 border border-hairline shadow-none' 
                    : 'bg-ink text-white shadow-orange-500/20 hover:bg-black'
                }`}
              >
                {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

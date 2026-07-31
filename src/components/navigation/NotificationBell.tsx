import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    let mounted = true;

    const fetchInitialCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);

      if (!error && count !== null && mounted) {
        setUnreadCount(count);
      }
    };

    fetchInitialCount();

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          if (!mounted) return;
          if (payload.eventType === 'INSERT' && !payload.new.is_read) {
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.old.is_read === false && payload.new.is_read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === 'DELETE' && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  if (!session) return null;

  return (
    <div className="relative">
      <button 
        id="notification-bell-toggle"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-4 rounded-2xl bg-white text-ink border border-hairline shadow-xl hover:bg-tint transition-all group"
      >
        <Bell size={24} className="group-hover:scale-110 transition-transform pointer-events-none" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-md pointer-events-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown 
        isOpen={isDropdownOpen} 
        onClose={() => setIsDropdownOpen(false)} 
      />
    </div>
  );
};

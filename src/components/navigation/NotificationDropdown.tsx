import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Heart, Calendar } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If click is outside the dropdown and not on the bell button (which we assume has a specific id or we just let it toggle)
      // Actually, standard click-outside might close it immediately if we click the toggle.
      // So we attach it to the window but ignore if it's the toggle button.
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Prevent closing if they clicked the bell button (we'll add an ID to it)
        const target = event.target as Element;
        if (!target.closest('#notification-bell-toggle')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchNotifications();
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      // Disambiguate the join using the foreign key column name
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, type, is_read, created_at,
          actor:profiles!actor_id(id, full_name, username, avatar_url)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      // Optimistically update local state
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      
      // Update in database
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id);
    }

    const actorIdOrUsername = notif.actor.username || notif.actor.id;
    navigate(`/user/${actorIdOrUsername}`);
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow': return <UserPlus size={16} className="text-orange-500" />;
      case 'like': return <Heart size={16} className="text-red-500" />;
      case 'trip_invite': return <Calendar size={16} className="text-blue-500" />;
      default: return null;
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'follow': return 'started following you';
      case 'like': return 'liked your post';
      case 'trip_invite': return 'invited you to a trip';
      default: return 'interacted with you';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden z-[100]"
      >
        <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center shrink-0">
          <h3 className="font-display font-bold text-[#0A192F]">Notifications</h3>
          {notifications.some(n => !n.is_read) && (
            <button 
              className="text-xs text-orange-500 font-bold hover:text-orange-600"
              onClick={async () => {
                const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-zinc-400 text-sm font-bold uppercase tracking-widest">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm font-bold uppercase tracking-widest">
              No new notifications
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-zinc-50 transition-colors ${!notif.is_read ? 'bg-orange-50/30' : ''}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 relative">
                    {notif.actor?.avatar_url ? (
                      <img src={notif.actor.avatar_url} alt={notif.actor.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                        {notif.actor?.full_name?.[0] || '?'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-[#0A192F] leading-tight">
                      <span className="font-bold">{notif.actor?.full_name || 'Someone'}</span>{' '}
                      <span className="text-zinc-500">{getNotificationText(notif.type)}</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1 font-medium">
                      {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0 shadow-sm shadow-orange-500/50" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

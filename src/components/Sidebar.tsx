import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Image as ImageIcon, 
  Video, 
  User, 
  Map, 
  BookOpen, 
  Users, 
  Settings,
  Search,
  Compass,
  Briefcase,
  Menu,
  X,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Compass, label: 'Discover', path: '/search' },
  { icon: Wand2, label: 'Remix Studio', path: '/remix' },
  { icon: ImageIcon, label: 'Photos', path: '/photos' },
  { icon: Video, label: 'Videos', path: '/videos' },
  { icon: User, label: 'My Profile', path: '/profile' },
  { icon: Map, label: 'My Trips', path: '/my-trips' },
  { icon: BookOpen, label: 'My Travel Blogs', path: '/blogs' },
  { icon: Users, label: 'Clubs', path: '/clubs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, activeProfile } = useApp();
  const { session } = useAuth();
  const isAuthenticated = !!session;

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
      navigate('/login');
    } else {
      navigate('/login', { state: { from: location } });
    }
  };

  const displayName = activeProfile?.full_name || activeProfile?.username || 'Explorer';
  const displayAvatar = activeProfile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";


  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isCollapsed ? 0 : 256,
        x: isCollapsed ? -256 : 0,
        opacity: isCollapsed ? 0 : 1
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-white border-r border-hairline flex flex-col sticky top-0 z-40 overflow-hidden"
    >
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-ink tracking-tight whitespace-nowrap">
          Venture<span className="text-orange-500">Social</span>
        </h1>
        <button 
          onClick={onToggle}
          className="p-2 rounded-xl text-muted hover:bg-tint hover:text-ink transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap
              ${isActive 
                ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20' 
                : 'text-body hover:bg-tint hover:text-ink'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="px-2 pb-8">
          <NavLink
            to="/services"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap
              ${isActive 
                ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20' 
                : 'text-body hover:bg-tint hover:text-ink'}
            `}
          >
            <Briefcase size={20} />
            <span>Travel Guide</span>
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-hairline">
        <div className="flex items-center gap-3 px-4 py-3 whitespace-nowrap">
          {isAuthenticated ? (
            <>
              <div className="w-10 h-10 rounded-full bg-orange-500 overflow-hidden border-2 border-orange-500/20 flex-shrink-0 cursor-pointer" onClick={() => navigate('/profile')}>
                <img 
                  src={displayAvatar} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{displayName}</p>
                <button onClick={handleAuthAction} className="text-xs text-orange-500 hover:text-orange-600 truncate font-bold">Log Out</button>
              </div>
            </>
          ) : (
            <button 
              onClick={handleAuthAction}
              className="w-full py-2 bg-zinc-900 border border-hairline text-white font-bold rounded-lg text-sm hover:bg-black transition-colors"
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

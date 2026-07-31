import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { Lock } from 'lucide-react';

export default function DelayedAuthModal() {
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTriggered, setIsTriggered] = useState(false);

  useEffect(() => {
    // Reset trigger when location changes or if already authenticated
    if (isAuthenticated) {
      setIsTriggered(false);
      return;
    }

    setIsTriggered(false);

    // Timer trigger: 30 seconds
    const timer = setTimeout(() => {
      setIsTriggered(true);
    }, 30000);

    // Scroll trigger: e.g. 1500px or more
    const handleScroll = () => {
      if (window.scrollY > 1500) {
        setIsTriggered(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isAuthenticated, location.pathname]);

  if (!isTriggered || isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
      >
        <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 relative">
          <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
          <Lock size={32} className="relative z-10" />
        </div>
        <div>
          <h3 className="text-2xl font-display font-bold text-ink mb-2">Keep Exploring</h3>
          <p className="text-body text-sm">
            You've seen a glimpse of the journey! Sign in or create a free account to continue browsing, saving itineraries, and planning your next trip.
          </p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/login', { state: { from: location } })}
            className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
          >
            Log In / Sign Up
          </button>
        </div>
      </motion.div>
    </div>
  );
}

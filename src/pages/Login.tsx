import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  
  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const params = new URLSearchParams(hash.replace('#', '?') || search);
    const errorMsg = params.get('error_description') || params.get('error');
    if (errorMsg) {
      setOauthError(decodeURIComponent(errorMsg).replace(/\+/g, ' '));
    }
  }, []);

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-zinc-50 flex flex-col md:flex-row relative"
    >
      {/* Left: Travel-Themed Hero Image */}
      <div className="hidden md:block md:w-1/2 relative bg-zinc-200 overflow-hidden">
        <img 
          src="/travel_hero.png" 
          alt="Beautiful travel landscape" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Soft overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/80 via-[#0A192F]/20 to-transparent" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute bottom-16 left-12 right-12 z-10 text-white"
        >
          <h1 className="text-4xl lg:text-5xl font-display font-bold mb-3 drop-shadow-lg">
            Venture<span className="text-orange-500">Social</span>
          </h1>
          <p className="text-lg font-medium opacity-90 text-zinc-100 tracking-wide drop-shadow-md">
            Your travel memories, shared with the world.
          </p>
        </motion.div>
      </div>

      {/* Right: Auth Card View */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        {/* Background glow to add some depth to the background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-[#0A192F] tracking-tight">
              Venture<span className="text-orange-500">Social</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Your travel memories, shared with the world.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {oauthError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-3xl mb-4 text-sm font-medium border border-red-100 shadow-sm relative z-20">
                {oauthError}
              </div>
            )}
            <LoginForm onOpenSignup={() => setIsSignupOpen(true)} />
          </motion.div>
        </div>
      </div>

      {/* Registration Modal Overlay */}
      <SignupForm isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </motion.div>
  );
}

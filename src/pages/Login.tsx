import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    // 1. Instantly check current state upon component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(from, { replace: true });
    });

    // 2. Map direct listener to Supabase OAuth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        navigate(from, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, from]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-zinc-50 flex flex-col md:flex-row"
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

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm />
                <div className="mt-6 text-center">
                  <p className="text-zinc-600 text-sm font-medium">
                    New here?{' '}
                    <button 
                      onClick={() => setIsLogin(false)}
                      className="text-[#3B82F6] font-bold hover:text-blue-600 transition-colors hover:underline focus:outline-none"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <SignupForm />
                <div className="mt-6 text-center">
                  <p className="text-zinc-600 text-sm font-medium">
                    Already have an account?{' '}
                    <button 
                      onClick={() => setIsLogin(true)}
                      className="text-[#3B82F6] font-bold hover:text-blue-600 transition-colors hover:underline focus:outline-none"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

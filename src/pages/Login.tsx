import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Compass, 
  ShieldCheck, 
  Grid3X3, 
  GitFork, 
  Mail, 
  Lock,
  Chrome,
  Apple,
  User,
  Loader2
} from 'lucide-react';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';

const categories = [
  { title: 'Solo', image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=400&q=80', rotate: '-rotate-6', grayscale: true },
  { title: 'Family', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80', rotate: 'rotate-2', grayscale: true },
  { title: 'Friends', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800', rotate: 'rotate-6', grayscale: false },
];

const features = [
  {
    title: 'Digital Passport',
    desc: 'A permanent professional record of your complete travel life history.',
    icon: Compass
  },
  {
    title: 'Verified Trust Layer',
    desc: 'Peer-to-peer verification builds authentic community trust.',
    icon: ShieldCheck
  },
  {
    title: 'Life History Grid',
    desc: '4-column visual showcase of every destination ever visited.',
    icon: Grid3X3
  },
  {
    title: 'Remixable Plans',
    desc: 'Every memory becomes an actionable plan for others.',
    icon: GitFork
  }
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useApp();
  
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/home';

  // Direct Native Supabase Target Observer
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (view === 'login') {
        await login(email, password);
        navigate(from, { replace: true });
      } else if (view === 'signup') {
        await register(name, email, password);
        navigate(from, { replace: true });
      } else if (view === 'forgot') {
        await new Promise(r => setTimeout(r, 1000));
        alert('Password reset link sent to ' + email);
        setView('login');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Note: Redirect handles routing automatically on success.
    } catch (err: any) {
      console.error('Google login error:', err.message);
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col p-6 md:p-12 overflow-x-hidden relative">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 md:mb-10 relative z-10"
      >
        <h1 className="text-3xl md:text-5xl font-display font-bold text-[#0A192F] mb-0.5 tracking-tighter">
          Venture<span className="text-orange-500">Social</span>
        </h1>
        <p className="text-zinc-500 text-[9px] md:text-[10px] tracking-[0.4em] uppercase font-bold">
          Your travel memories, shared with the world.
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 relative z-10 max-w-6xl mx-auto w-full mb-10">
        
        {/* Left: Hero Section (Polaroids + Button) */}
        <div className="flex flex-col items-center lg:items-start gap-6">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                className={`polaroid ${cat.rotate} w-24 md:w-32 lg:w-40 bg-white p-1.5 md:p-2 shadow-2xl transition-transform hover:rotate-0 hover:scale-110 duration-500 z-${30 - i * 10}`}
              >
                <div className="aspect-square overflow-hidden mb-1.5 md:mb-2">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className={`w-full h-full object-cover transition-all duration-700 ${cat.grayscale ? 'grayscale hover:grayscale-0' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="font-display font-bold text-[#0A192F] text-center text-[10px] md:text-xs">{cat.title}</p>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
            className="bg-orange-500 text-white font-bold py-2.5 px-7 rounded-full text-sm shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:bg-orange-400 transition-all"
          >
            Get Started
          </motion.button>
        </div>

        {/* Right: Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[320px] bg-white border border-zinc-200 rounded-[1.5rem] p-5 md:p-7 shadow-2xl"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-0.5">
              <h2 className="text-lg font-display font-bold text-[#0A192F]">
                {view === 'login' && 'Login Form'}
                {view === 'signup' && 'Create Account'}
                {view === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-zinc-500 text-[10px]">
                {view === 'login' && 'Welcome back to your travel journey.'}
                {view === 'signup' && 'Join the community of travelers.'}
                {view === 'forgot' && 'We\'ll send you a link to reset it.'}
              </p>
            </div>

            {errorMsg && (
              <div className="text-red-500 text-xs bg-red-50 p-2 rounded-lg border border-red-100">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5">
              {view === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-3 text-xs text-[#0A192F] placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-3 text-xs text-[#0A192F] placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </div>
              {view !== 'forgot' && (
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-3 text-xs text-[#0A192F] placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                </div>
              )}
            </div>

            {view === 'login' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setView('forgot')} className="text-[10px] text-zinc-500 hover:text-orange-500 transition-colors">
                  Forgot Password?
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-orange-500/20 text-xs flex items-center justify-center gap-2 disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {view === 'login' && 'Log In'}
              {view === 'signup' && 'Sign Up'}
              {view === 'forgot' && 'Send Reset Link'}
            </button>

            <div className="text-center text-[10px] text-zinc-500">
              {view === 'login' ? (
                <>Don't have an account? <button type="button" onClick={() => { setView('signup'); setErrorMsg(''); }} className="font-bold text-orange-500 hover:underline">Sign Up</button></>
              ) : (
                <>Back to <button type="button" onClick={() => { setView('login'); setErrorMsg(''); }} className="font-bold text-orange-500 hover:underline">Log In</button></>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-bold">
                <span className="bg-white px-2 text-zinc-400">Enterprise Access</span>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-[#0A192F] font-bold py-3 px-4 border border-zinc-300 hover:border-orange-500 hover:bg-orange-50 transition-all text-xs disabled:opacity-50"
              style={{ borderRadius: '2px' }}
            >
              <Chrome size={16} className={isLoading ? 'animate-spin text-orange-500' : 'text-orange-500'} />
              Continue with Google
            </button>
          </form>
        </motion.div>
      </div>

      {/* Bottom: Feature Breakdown */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-6 border-t border-zinc-100 relative z-10">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="space-y-1.5 group"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-all">
              <feature.icon size={14} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[#0A192F] font-bold text-[10px] tracking-tight">{feature.title}</h4>
              <p className="text-zinc-500 text-[9px] leading-tight">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

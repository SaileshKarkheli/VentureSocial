import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useApp } from '../AppContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useApp();
  
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorText, setErrorText] = useState('');

  const from = location.state?.from?.pathname || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorText('');
    try {
      if (view === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorText(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Executive sharp backdrop grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-10 md:p-12 shadow-2xl"
      >
        <div className="text-left mb-10">
          <h1 className="text-2xl font-light tracking-tight text-white mb-2">VentureSocial</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-4 h-[1px] bg-zinc-700"></span> Global Travel Registry
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorText && (
            <div className="text-red-400 border border-red-900/50 bg-red-950/20 p-3 text-xs">
              {errorText}
            </div>
          )}
          
          {view === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-semibold">Legal Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="w-full bg-zinc-900/50 border border-zinc-800 text-sm p-3 focus:outline-none focus:border-zinc-500 transition-colors text-white" 
              />
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-semibold">Primary Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="w-full bg-zinc-900/50 border border-zinc-800 text-sm p-3 focus:outline-none focus:border-zinc-500 transition-colors text-white" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-semibold">Access Key</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="w-full bg-zinc-900/50 border border-zinc-800 text-sm p-3 focus:outline-none focus:border-zinc-500 transition-colors text-white" 
            />
          </div>

          <div className="pt-2">
            <button 
              disabled={isLoading} 
              className="w-full bg-zinc-100 text-zinc-950 font-semibold text-xs tracking-wider uppercase py-3.5 hover:bg-white transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : (view === 'login' ? 'Authenticate' : 'Establish Record')}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-900 text-left">
          <button 
            type="button" 
            onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setErrorText(''); }} 
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {view === 'login' ? 'Require an account? →' : 'Already have clearance? →'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

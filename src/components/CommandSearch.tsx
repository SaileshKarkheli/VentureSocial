import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Users, Command as CmdIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';

export default function CommandSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setLocalQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const { publicPosts, setSearchQuery } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setUsers([]);
      return;
    }
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(3);
      setUsers(data || []);
    };
    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const topTrips = publicPosts
    .filter(p => p.location.toLowerCase().includes(query.toLowerCase()) || p.caption.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query);
      navigate('/search');
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none w-full px-20 md:px-0">
        {/* Desktop Search Trigger */}
        <button 
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-white border-2 border-zinc-200 hover:border-[#0A192F] shadow-xl hover:shadow-2xl transition-all text-zinc-400 group pointer-events-auto"
          style={{ borderRadius: '2px', width: '320px' }}
        >
          <Search size={16} className="group-hover:text-[#0A192F] transition-colors" />
          <span className="text-sm font-medium mr-auto">Global Command Node...</span>
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold bg-zinc-100 px-1.5 py-0.5 border border-zinc-200 text-zinc-500" style={{ borderRadius: '2px' }}>
            <CmdIcon size={10} /> K
          </div>
        </button>

        {/* Mobile Search Trigger */}
        <button 
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-[#0A192F] shadow-lg text-[#0A192F] pointer-events-auto ml-auto"
          style={{ borderRadius: '2px' }}
        >
          <Search size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Search</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#0A192F]/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] z-[101] bg-white border-2 border-[#0A192F] shadow-2xl overflow-hidden"
              style={{ borderRadius: '2px' }}
            >
              <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-b-2 border-zinc-100 bg-white">
                <Search size={22} className="text-orange-500 shrink-0" />
                <input 
                  ref={inputRef}
                  value={query}
                  onChange={e => setLocalQuery(e.target.value)}
                  placeholder="Search Users or Destinations..."
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-xl font-bold text-[#0A192F] placeholder:text-zinc-300"
                />
                <div className="flex items-center gap-1 font-mono text-[9px] font-bold bg-zinc-100 border border-zinc-200 px-2 py-1 text-zinc-400" style={{ borderRadius: '2px' }}>ESC</div>
              </form>

              {query.trim() && (
                <div className="max-h-[60vh] overflow-y-auto bg-zinc-50">
                  <div className="px-4 py-4 border-b border-zinc-100 bg-white">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={12}/> Top Users</h3>
                    {users.length === 0 ? <p className="text-sm text-zinc-400 font-medium ml-1">No users found in database.</p> : (
                      <div className="grid grid-cols-1 gap-2">
                        {users.map(u => (
                          <div 
                            key={u.id}
                            onClick={() => { navigate(`/user/${u.username}`); setIsOpen(false); }}
                            className="flex items-center gap-4 p-3 bg-white border-2 border-zinc-100 hover:border-[#0A192F] cursor-pointer group transition-all shadow-sm"
                            style={{ borderRadius: '2px' }}
                          >
                            <div className="w-10 h-10 bg-zinc-100 border border-[#0A192F] shrink-0 overflow-hidden" style={{ borderRadius: '2px' }}>
                              {u.avatar_url ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover filter contrast-125 saturate-150" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400"><Users size={16}/></div>}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0A192F] text-sm leading-tight group-hover:text-orange-500 transition-colors truncate max-w-[200px]">{u.full_name || u.username || 'Anonymous'}</span>
                              <span className="text-orange-500 font-mono text-[10px] font-bold mt-0.5 truncate max-w-[200px]">@{u.username}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-4 bg-white">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={12}/> Top Trips</h3>
                    {topTrips.length === 0 ? <p className="text-sm text-zinc-400 font-medium ml-1">No trip locations match.</p> : (
                      <div className="grid grid-cols-1 gap-2">
                        {topTrips.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => { setSearchQuery(p.location); navigate('/search'); setIsOpen(false); }}
                            className="flex items-center gap-4 p-3 bg-white border-2 border-zinc-100 hover:border-[#0A192F] cursor-pointer group transition-all shadow-sm"
                            style={{ borderRadius: '2px' }}
                          >
                            <div className="w-10 h-10 bg-black shrink-0 relative overflow-hidden" style={{ borderRadius: '2px' }}>
                               <img src={p.images[0]?.url} alt="Cover" className="w-full h-full object-cover opacity-80" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                               <span className="font-bold text-[#0A192F] text-sm leading-tight group-hover:text-orange-500 transition-colors truncate">{p.caption.split('#')[0]}</span>
                               <span className="text-zinc-500 text-[10px] uppercase font-bold mt-0.5 flex items-center gap-1"><MapPin size={10} className="text-orange-500"/> {p.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleSubmit} 
                    className="w-full p-4 bg-[#0A192F] text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors border-t border-[#0A192F]"
                  >
                     Run Deep Search for "{query}" 
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

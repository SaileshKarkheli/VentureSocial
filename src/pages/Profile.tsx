import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Bookmark, ExternalLink, Shield, ShieldCheck } from 'lucide-react';
import { useApp } from '../AppContext';

export default function Profile() {
  const { savedItems, followedUsers, user } = useApp();
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  
  // Minimal placeholder data since humans are removed
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'VK';
  const name = user?.name || 'Authorized Visitor';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 text-zinc-200 antialiased p-6 md:p-8">
      
      {/* Structural Minimalist Header */}
      <div className="relative border border-zinc-800 bg-zinc-900/30 p-8 md:p-12 mb-12 flex flex-col md:flex-row items-end gap-8">
        <div className="w-24 h-24 bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-2xl font-light text-zinc-300 tracking-widest">{initials}</span>
        </div>
        
        <div className="flex-1 pb-2">
            <h2 className="text-3xl font-light tracking-tight text-white mb-2">{name}</h2>
            <div className="flex items-center gap-3 text-zinc-500 text-xs tracking-widest uppercase">
              <MapPin size={12} className="text-zinc-400" />
              <span>Global Registry</span>
            </div>
        </div>

        <div className="pb-2">
            <button className="bg-zinc-100 text-zinc-950 px-6 py-2.5 text-xs uppercase tracking-widest font-semibold hover:bg-white transition-colors border border-zinc-400">
              Configure Profile
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Content Pane */}
        <div className="md:col-span-2 space-y-8">
          
          <section className="bg-zinc-900/30 p-8 border border-zinc-800 backdrop-blur-sm">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-500 mb-6 flex items-center gap-2">
              <Bookmark size={14} className="text-zinc-600" />
              Preserved Itineraries
            </h3>

            {savedItems.length > 0 ? (
              <div className="space-y-2">
                {savedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 group hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-8 bg-zinc-800 group-hover:bg-zinc-600 transition-colors"></div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{item.type}</p>
                        <p className="font-medium text-zinc-200 text-sm">{item.name}</p>
                      </div>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-transparent text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </motion.div>
                ))}
              </div>
            ) : (
               <div className="py-12 border border-zinc-800 border-dashed text-center">
                  <p className="text-zinc-600 text-xs tracking-widest uppercase">No assets preserved.</p>
               </div>
            )}
          </section>
        </div>

        {/* Action / Data Pane */}
        <div className="space-y-8">
          
          {/* Data Readout */}
          <section className="bg-zinc-900/30 p-8 border border-zinc-800">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-500 mb-6">Metrics</h3>
            <div className="space-y-6">
                <div>
                  <p className="text-3xl font-light text-zinc-200">0</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mt-1">Logged Expeditions</p>
                </div>
                <div className="w-full h-px bg-zinc-800" />
                <div>
                  <p className="text-3xl font-light text-zinc-200">{followedUsers.length}</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mt-1">Network Connections</p>
                </div>
            </div>
          </section>

          {/* Security Protocol */}
          <section className="bg-zinc-900/30 p-8 border border-zinc-800">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-zinc-500 mb-6">Security Protocol</h3>
            
            <div className="flex items-center justify-between border border-zinc-800 p-4">
              <div>
                <h4 className="text-xs font-semibold tracking-widest uppercase text-zinc-300 flex items-center gap-2 mb-1">
                  {isPrivateAccount ? <Shield size={12} className="text-zinc-500" /> : <ShieldCheck size={12} className="text-zinc-500" />}
                  {isPrivateAccount ? 'Restricted' : 'Standard Access'}
                </h4>
              </div>
              <button
                onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                className={`w-10 h-5 relative flex items-center shrink-0 border ${isPrivateAccount ? 'bg-zinc-800 border-zinc-600' : 'bg-transparent border-zinc-700'}`}
              >
                <motion.div
                  animate={{ x: isPrivateAccount ? 20 : 2 }}
                  className={`w-3.5 h-3.5 absolute ${isPrivateAccount ? 'bg-zinc-300' : 'bg-zinc-600'}`}
                />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

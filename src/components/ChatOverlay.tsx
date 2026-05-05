import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlignLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { SocialService } from '../lib/socialService';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: string;
}

export default function ChatOverlay({ isOpen, onClose, targetUser }: ChatOverlayProps) {
  const [messages, setMessages] = useState<{id: string, text: string, sender: string}[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessages([
      { id: '1', text: `Hi! I saw your recent itinerary.`, sender: 'me' },
      { id: '2', text: `Thanks! Feel free to remix any of my spots directly!`, sender: targetUser }
    ]);
    
    const channel = SocialService.subscribeToGlobalMessages((newMsg) => {
       setMessages(prev => [...prev, { id: newMsg.id, text: newMsg.content, sender: newMsg.sender_id }]);
    });
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, targetUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: input, sender: 'me' }]);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
        className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white border-2 border-[#0A192F] shadow-2xl z-50 flex flex-col"
        style={{ height: '450px', borderRadius: '0' }}
      >
        <div className="bg-[#0A192F] text-white p-4 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-2">
             <AlignLeft size={16} className="text-orange-500" />
             <h3 className="font-bold text-sm tracking-widest uppercase">{targetUser}</h3>
           </div>
           <button onClick={onClose} className="text-zinc-300 hover:text-orange-500 transition-colors">
             <X size={18} />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white border-b border-zinc-200">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2 max-w-[85%] text-sm font-bold border-2 ${
                m.sender === 'me' 
                  ? 'bg-[#0A192F] border-[#0A192F] text-white text-right' 
                  : 'bg-white border-zinc-200 text-[#0A192F] text-left'
              }`} style={{ borderRadius: '0' }}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-zinc-50 flex items-center gap-2 border-t border-zinc-200">
           <input
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             placeholder="Message..."
             className="flex-1 bg-white border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-0 focus:outline-none placeholder:text-zinc-400 font-bold"
             style={{ borderRadius: '0' }}
           />
           <button onClick={handleSend} className="p-2 border-2 border-orange-500 bg-orange-500 text-white hover:bg-white hover:text-orange-500 transition-colors" style={{ borderRadius: '0' }}>
             <Send size={16} />
           </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { messageService } from '../services/messageService';
import { Loader2, Send, Search, ArrowLeft } from 'lucide-react';
import SmartImage from '../components/SmartImage';

export default function Messages() {
  const { user, setHasUnreadMessages } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasUnreadMessages(false); // Clear notification flag when mounting Messages hub
    if (!user) {
      navigate('/');
      return;
    }

    const init = async () => {
      try {
        // If coming explicitly from a profile hook, actively bootstrap the thread
        if (targetUserId) {
          const newConvoId = await messageService.getOrCreateConversation(user.id, targetUserId);
          setActiveConversationId(newConvoId);
        }

        const convos = await messageService.fetchUserConversations(user.id);
        setConversations(convos);
        
        if (!targetUserId && convos.length > 0) {
          setActiveConversationId(convos[0].id);
        }
      } catch (err) {
        console.error("Init messaging error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user, targetUserId]);

  useEffect(() => {
    if (!activeConversationId) return;

    const loadMessages = async () => {
      const msgs = await messageService.fetchMessages(activeConversationId);
      setMessages(msgs);
      scrollToBottom();
    };
    loadMessages();

    // Attach hyper-local active listener to the open UI thread
    const subscription = messageService.subscribeToThreadMessages(activeConversationId, (payload) => {
      setMessages(prev => [...prev, payload.new]);
      scrollToBottom();
    });

    return () => { subscription.unsubscribe(); };
  }, [activeConversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId || !user) return;
    
    const textSnapshot = inputText;
    setInputText('');
    await messageService.sendMessage(activeConversationId, user.id, textSnapshot);
  };

  const activePartner = conversations.find(c => c.id === activeConversationId)?.p1?.id === user?.id 
    ? conversations.find(c => c.id === activeConversationId)?.p2
    : conversations.find(c => c.id === activeConversationId)?.p1;

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-zinc-200 overflow-hidden h-[80vh] flex text-[#0A192F]">
      
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-zinc-200 flex flex-col bg-zinc-50">
        <div className="p-6 border-b border-zinc-200 bg-white items-center flex justify-between">
          <h2 className="text-xl font-bold font-display tracking-tight">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 font-medium text-sm">
              No conversations yet. Go coordinate a trip!
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map(c => {
                // Partner extraction (Identify who isn't the logged in user)
                const partner = c.p1.id === user?.id ? c.p2 : c.p1;
                return (
                  <button 
                    key={c.id} 
                    onClick={() => setActiveConversationId(c.id)}
                    className={`w-full p-5 flex items-center gap-4 text-left transition-colors border-b border-zinc-100 ${activeConversationId === c.id ? 'bg-orange-50' : 'hover:bg-zinc-100'}`}
                  >
                    <SmartImage src={partner.avatar_url} alt={partner.full_name} className="w-12 h-12 rounded-full border border-zinc-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate text-sm">{partner.full_name || partner.username || 'Anonymous'}</h4>
                      <p className="text-xs text-zinc-500 truncate font-mono">@{partner.username}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Conversation Canvas */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConversationId && activePartner ? (
          <>
            {/* Header */}
            <div className="h-[76px] px-8 border-b border-zinc-200 flex items-center gap-4 bg-white/80 backdrop-blur-md">
              <SmartImage src={activePartner.avatar_url} alt={activePartner.full_name || 'Partner'} className="w-10 h-10 rounded-full border border-zinc-200" />
              <div>
                <h3 className="font-bold text-lg leading-tight">{activePartner.full_name || activePartner.username || 'Anonymous'}</h3>
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest cursor-pointer hover:text-orange-500 transition-colors" onClick={() => navigate(`/user/${activePartner.username}`)}>View Profile</p>
              </div>
            </div>

            {/* Chat Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-400 font-bold text-sm">
                  Start the conversation safely over end-to-end routing.
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-5 py-3 rounded-2xl max-w-[75%] text-sm ${
                        isMe ? 'bg-orange-500 text-white rounded-tr-sm shadow-md shadow-orange-500/20' : 'bg-white border border-zinc-200 text-[#0A192F] shadow-sm rounded-tl-sm'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Station */}
            <div className="p-4 bg-white border-t border-zinc-200">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input 
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-50 border border-zinc-200 px-6 py-4 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" disabled={!inputText.trim()} className="bg-[#0A192F] text-white p-4 rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 font-bold">
            Select a conversation to start engaging
          </div>
        )}
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { MapPin, Camera, Coffee, Loader2 } from 'lucide-react';

const interests = [
  { id: 'adventure', title: 'Adventure & Nature', icon: MapPin, desc: 'Hiking, camping, and exploring the great outdoors.' },
  { id: 'culture', title: 'Culture & History', icon: Camera, desc: 'Museums, historical sites, and local traditions.' },
  { id: 'food', title: 'Food & Culinary', icon: Coffee, desc: 'Local cuisines, cafes, and fine dining experiences.' },
];

export default function Onboarding() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (!userProfile?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ interests: selected })
        .eq('id', userProfile.id);

      if (error) throw error;
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving interests:', err);
      // Fallback navigation even if it fails, or show error.
      navigate('/dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[#0A192F] mb-3">
            Welcome, {userProfile?.full_name?.split(' ')[0] || 'Traveler'}!
          </h1>
          <p className="text-zinc-500 text-lg">
            Let's set up your VentureSocial profile. What kind of travel interests you?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {interests.map((interest, idx) => {
            const isSelected = selected.includes(interest.id);
            return (
              <motion.div
                key={interest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => toggleInterest(interest.id)}
                className={`cursor-pointer bg-white p-6 rounded-3xl border-2 transition-all duration-300 ${
                  isSelected 
                    ? 'border-orange-500 shadow-xl scale-105' 
                    : 'border-zinc-100 shadow-sm hover:border-zinc-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  isSelected ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'
                }`}>
                  <interest.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#0A192F] mb-2">{interest.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{interest.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleFinish}
            disabled={selected.length === 0 || isSaving}
            className="flex items-center gap-2 bg-[#0A192F] text-white font-bold py-4 px-12 rounded-xl shadow-xl shadow-blue-500/20 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            Finish Setup
          </button>
        </div>
      </motion.div>
    </div>
  );
}

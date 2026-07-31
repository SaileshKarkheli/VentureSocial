import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-tint flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[2rem] border border-hairline shadow-xl max-w-lg w-full text-center"
      >
        <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Compass size={40} />
        </div>
        <h1 className="text-3xl font-display font-bold text-ink mb-4">
          Welcome to the Dashboard
        </h1>
        <p className="text-body mb-8">
          You are successfully authenticated as <strong className="text-ink">{userProfile?.full_name || 'Traveler'}</strong>.
          Your exciting journey begins here.
        </p>
        
        <button
          onClick={() => navigate('/home')}
          className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-all w-full"
        >
          Go to Feed
        </button>
      </motion.div>
    </div>
  );
}

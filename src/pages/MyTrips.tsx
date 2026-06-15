import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, ArrowRight, Share2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import TripBuilderModal from '../components/TripBuilderModal';
import PublishModal from '../components/PublishModal';
import { TripGridSkeleton } from '../components/Skeletons';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { tripsService } from '../services/tripsService';

interface DbTrip {
  id: string;
  year: string;
  country: string;
  image: string;
}

export default function MyTrips() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [myTrips, setMyTrips] = useState<DbTrip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [publishTripId, setPublishTripId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoadingTrips(false);
      return;
    }

    const fetchMyTrips = async () => {
      setIsLoadingTrips(true);
      try {
        const data = await tripsService.fetchMyTrips(session.user.id);
        setMyTrips(data);
      } catch (err) {
        console.error("Supabase fetch failed in MyTrips:", err);
      } finally {
        setIsLoadingTrips(false);
      }
    };

    fetchMyTrips();
  }, [session?.user?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 text-zinc-900">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-display font-bold text-[#0A192F]">My Travel History</h2>
          <p className="text-zinc-500">A chronological journey through the places you've explored.</p>
        </div>
        <button
          id="add-trip-button"
          onClick={() => setIsBuilderOpen(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20"
        >
          <Plus size={24} />
          <span>Add Country/City</span>
        </button>
      </header>

      <TripBuilderModal isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} />
      
      <PublishModal 
        isOpen={!!publishTripId} 
        onClose={() => setPublishTripId(null)} 
        preselectedTripId={publishTripId || undefined} 
      />

      {isLoadingTrips ? (
        <div className="mt-12">
          <TripGridSkeleton />
        </div>
      ) : myTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-16 bg-white rounded-[2rem] border border-zinc-200 shadow-sm mt-12">
          <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
            <Plus size={40} />
          </div>
          <h3 className="text-2xl font-bold text-[#0A192F] mb-4">No trips found</h3>
          <p className="text-zinc-500 max-w-md mx-auto mb-8">
            You haven't recorded any adventures in your travel history yet. Start exploring or map your first destination to build your travel map!
          </p>
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="bg-[#0A192F] text-white font-bold px-8 py-4 rounded-xl hover:bg-black transition-colors shadow-xl"
          >
            Add Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-6 relative mt-12">
          {myTrips.map((trip, index) => (
            <div key={trip.id} className="relative group">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="w-full aspect-square rounded-3xl overflow-hidden cursor-pointer shadow-2xl border-4 border-white relative z-10 group bg-zinc-100"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  style={{ backgroundImage: `url(${trip.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPublishTripId(trip.id);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white z-20"
                >
                  <Share2 size={16} />
                </button>

                <div className="absolute inset-x-0 bottom-0 p-4 text-center z-20">
                  <span className="block text-orange-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1 drop-shadow-sm">
                    {trip.year}
                  </span>
                  <h3 className="text-white font-display font-bold text-lg leading-tight">
                    {trip.country}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/blog/${trip.id}`);
                    }}
                    className="mt-2 text-[10px] font-bold text-white/60 hover:text-orange-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                  >
                    Read the Travel Story
                  </button>
                </div>
              </motion.div>

              {/* Chronological Arrow Connector */}
              {index < myTrips.length - 1 && (
                <div className="absolute top-1/2 -right-8 -translate-y-1/2 z-0 hidden md:flex items-center justify-center text-orange-500/20 group-hover:text-orange-500 transition-colors">
                  <ArrowRight size={32} strokeWidth={3} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

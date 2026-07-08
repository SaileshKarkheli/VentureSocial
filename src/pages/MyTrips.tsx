import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, ArrowRight, Share2, Trash2, PenSquare, Pencil } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
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
  const [editTripData, setEditTripData] = useState<null | {
    id: string;
    destination: string;
    spots: Array<{
      day_number: number;
      title: string;
      description: string;
      category: 'Transport' | 'Stay' | 'Dining' | 'Activity';
      image_url: string | null;
      image_urls?: string[] | null;
      link_url: string | null;
    }>;
  }>(null);

  const handleEditTrip = async (trip: DbTrip) => {
    try {
      const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
      let spots: any[] = [];
      if (isMockMode) {
        const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
        const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
        const found = customTrips.find((t: any) => t.id === trip.id);
        spots = found?.spots || [];
      } else {
        const { data, error } = await supabase
          .from('trip_spots')
          .select('day_number, title, description, category, image_url, image_urls, link_url')
          .eq('post_id', trip.id)
          .order('day_number', { ascending: true });
        if (!error && data) spots = data;
      }
      setEditTripData({
        id: trip.id,
        destination: trip.country,
        spots: spots.map((s: any) => ({
          day_number: s.day_number,
          title: s.title || '',
          description: s.description || '',
          category: s.category as 'Transport' | 'Stay' | 'Dining' | 'Activity',
          image_url: s.image_url || null,
          image_urls: s.image_urls || null,
          link_url: s.link_url || null
        }))
      });
      setIsBuilderOpen(true);
    } catch (err) {
      console.error('Failed to load trip for editing:', err);
    }
  };

  const handleDeleteTrip = async (tripId: string, country: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete your trip to ${country}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
      if (isMockMode) {
        console.log("Mock mode: deleting trip locally...");
        const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
        if (customTripsStr) {
          const customTrips = JSON.parse(customTripsStr);
          const filtered = customTrips.filter((t: any) => t.id !== tripId);
          localStorage.setItem('venturesocial_custom_trips', JSON.stringify(filtered));
        }
        setMyTrips(prev => prev.filter(t => t.id !== tripId));
        return;
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', tripId);

      if (error) {
        throw error;
      }

      setMyTrips(prev => prev.filter(t => t.id !== tripId));
      console.log("Trip deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete trip:", err);
      alert(`Failed to delete trip: ${err.message || err}`);
    }
  };

  const [blogsMap, setBlogsMap] = useState<Record<string, string>>({}); // trip_id -> blog_id
  const [tripDaysMap, setTripDaysMap] = useState<Record<string, number>>({});

  const stats = useMemo(() => {
    const totalTrips = myTrips.length;
    const uniqueCountries = new Set(myTrips.map(t => t.country.trim())).size;
    const totalDays = myTrips.reduce((sum, trip) => {
      return sum + (tripDaysMap[trip.id] || 1);
    }, 0);
    return { totalTrips, uniqueCountries, totalDays };
  }, [myTrips, tripDaysMap]);

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

        const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

        // Calculate total days map
        const daysMap: Record<string, number> = {};
        
        if (isMockMode) {
          const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
          const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
          
          customTrips.forEach((t: any) => {
            if (Array.isArray(t.spots) && t.spots.length > 0) {
              daysMap[t.id] = Math.max(...t.spots.map((s: any) => s.day_number || 1));
            } else {
              daysMap[t.id] = 1;
            }
          });
          
          const mockDaysMap: Record<string, number> = {
            '1': 3,
            '2': 3,
            '3': 3,
            '4': 2,
            '5': 2
          };
          
          data.forEach((trip: any) => {
            if (mockDaysMap[trip.id] !== undefined) {
              daysMap[trip.id] = mockDaysMap[trip.id];
            } else if (!daysMap[trip.id]) {
              daysMap[trip.id] = 1;
            }
          });
          setTripDaysMap(daysMap);
        } else {
          const tripIds = data.map((t: any) => t.id);
          if (tripIds.length > 0) {
            const { data: spotsData, error: spotsError } = await supabase
              .from('trip_spots')
              .select('post_id, day_number')
              .in('post_id', tripIds);
            
            if (!spotsError && spotsData) {
              tripIds.forEach((id: string) => {
                daysMap[id] = 1;
              });
              spotsData.forEach((spot: any) => {
                if (spot.day_number > (daysMap[spot.post_id] || 0)) {
                  daysMap[spot.post_id] = spot.day_number;
                }
              });
              setTripDaysMap(daysMap);
            } else {
              tripIds.forEach((id: string) => {
                daysMap[id] = 1;
              });
              setTripDaysMap(daysMap);
            }
          } else {
            setTripDaysMap({});
          }
        }

        // Fetch user's blogs to map trip_id -> blog_id
        if (isMockMode) {
          const localBlogsStr = localStorage.getItem('venturesocial_blogs');
          const localBlogs = localBlogsStr ? JSON.parse(localBlogsStr) : [];
          const map: Record<string, string> = {};
          localBlogs.forEach((b: any) => {
            if (b.trip_id) map[b.trip_id] = b.id;
          });
          setBlogsMap(map);
        } else {
          const { data: blogsData, error: blogsError } = await supabase
            .from('blogs')
            .select('id, trip_id')
            .eq('user_id', session.user.id);
          
          if (!blogsError && blogsData) {
            const map: Record<string, string> = {};
            blogsData.forEach((b: any) => {
              if (b.trip_id) map[b.trip_id] = b.id;
            });
            setBlogsMap(map);
          }
        }
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

      {/* LinkedIn-style Stats Bar */}
      <div className="flex gap-16 py-4">
        <div>
          <div className="text-3xl font-display font-bold text-[#0A192F]">{stats.totalTrips}</div>
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">Total Trips</div>
        </div>
        <div>
          <div className="text-3xl font-display font-bold text-[#0A192F]">{stats.uniqueCountries}</div>
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">Countries Visited</div>
        </div>
        <div>
          <div className="text-3xl font-display font-bold text-[#0A192F]">{stats.totalDays}</div>
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">Total Days Traveled</div>
        </div>
      </div>

      <TripBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => { setIsBuilderOpen(false); setEditTripData(null); }}
        editTrip={editTripData}
      />
      
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
                    handleDeleteTrip(trip.id, trip.country);
                  }}
                  className="absolute top-3 left-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:text-white z-20"
                  title="Delete trip"
                >
                  <Trash2 size={16} />
                </button>

                {/* Edit button — centered top */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTrip(trip);
                  }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white z-20"
                  title="Edit trip"
                >
                  <Pencil size={16} />
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPublishTripId(trip.id);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white z-20"
                  title="Share to feed"
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
                  {blogsMap[trip.id] ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/blog/${trip.id}`);
                      }}
                      className="mt-2 text-[10px] font-bold text-white/60 hover:text-orange-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                    >
                      Read the Travel Story
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/blogs/new?trip_id=${trip.id}`);
                      }}
                      className="mt-2 text-[10px] font-bold text-white/60 hover:text-orange-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <PenSquare size={12} />
                      <span>Write a Blog</span>
                    </button>
                  )}
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

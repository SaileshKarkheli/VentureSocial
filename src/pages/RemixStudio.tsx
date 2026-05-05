import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, FolderOpen, MapPin, X, ArrowRight, ShoppingBag, Clock, Navigation, Bed, Utensils, Camera, Plane, Trash2, AlertCircle, Store, Car, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmartImage from '../components/SmartImage';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { DayHighlightCarousel, PillarSection } from './TripDetail';

export default function RemixStudio() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  // State for Hub View
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<any | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchFolders = async () => {
      setIsLoading(true);
      // Fetch folders and count of saved spots
      const { data, error } = await supabase
        .from('remix_folders')
        .select(`
          id,
          name,
          created_at,
          saved_spots ( count )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Fetch a cover image for each folder (the first spot's image)
        const foldersWithCovers = await Promise.all(data.map(async (folder: any) => {
          const { data: spotData } = await supabase
            .from('saved_spots')
            .select(`
              trip_spots ( image_url )
            `)
            .eq('folder_id', folder.id)
            .limit(1)
            .single();
            
          return {
            ...folder,
            count: folder.saved_spots[0]?.count || 0,
            cover_url: (spotData?.trip_spots as any)?.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
          };
        }));
        setFolders(foldersWithCovers);
      }
      setIsLoading(false);
    };
    fetchFolders();
  }, [session?.user?.id]);

  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    await supabase.from('remix_folders').delete().eq('id', folderId);
    setFolders(folders.filter(f => f.id !== folderId));
    if (activeFolder?.id === folderId) setActiveFolder(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-[#0A192F] text-white rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 text-orange-500">
            <Wand2 size={24} />
            <span className="font-bold uppercase tracking-widest text-sm">The Remix Studio</span>
          </div>
          <h1 className="text-4xl font-display font-bold">Your A La Carte Workspace</h1>
          <p className="text-zinc-400 font-medium max-w-lg">
            Every component you've cloned across the platform lives here. Drill into a folder and reassign spots to sequence your perfect trip.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex flex-col items-center justify-center shrink-0 min-w-[200px]">
           <span className="text-4xl font-display font-bold text-white">{folders.length}</span>
           <span className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Active Folders</span>
        </div>
      </div>

      {!activeFolder ? (
        // The Hub View (Polaroids)
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest">Loading studio...</div>
          ) : folders.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-zinc-200 shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6">
                <FolderOpen size={40} />
              </div>
              <h3 className="text-2xl font-bold text-[#0A192F] mb-4">Your studio is empty</h3>
              <p className="text-zinc-500 max-w-md mx-auto mb-8">
                Explore the discover feed or search for destinations. When you find an itinerary you love, click the + button to start building your custom trip here.
              </p>
              <button 
                onClick={() => navigate('/search')}
                className="bg-[#0A192F] text-white font-bold px-8 py-4 rounded-xl hover:bg-black transition-colors shadow-xl"
              >
                Discover Itineraries
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  whileHover={{ y: -5 }}
                  onClick={() => setActiveFolder(folder)}
                  className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-xl cursor-pointer group hover:border-orange-500 transition-all relative"
                >
                  <button 
                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                    className="absolute top-6 right-6 z-20 w-8 h-8 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-zinc-100">
                    <SmartImage 
                      src={folder.cover_url} 
                      alt={folder.name}
                      locationName={folder.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-2xl font-display font-bold drop-shadow-md truncate">{folder.name}</h3>
                      <p className="text-sm font-bold text-orange-400">{folder.count} A La Carte Items</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // The Workspace View (Inside a Folder)
        <WorkspaceView 
          folder={activeFolder} 
          onClose={() => setActiveFolder(null)} 
        />
      )}
    </div>
  );
}

// Subcomponent for the Workspace View (Mirroring PillarSection)
function WorkspaceView({ folder, onClose }: { folder: any, onClose: () => void }) {
  const { session } = useAuth();
  const [spots, setSpots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    fetchSpots();
  }, [folder.id]);

  const fetchSpots = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saved_spots')
      .select(`
        id,
        custom_day,
        trip_spots (
          id, title, description, category, image_url, link_url, day_number,
          post_id,
          posts ( id, user_id )
        )
      `)
      .eq('folder_id', folder.id);
    
    if (!error && data) {
      setSpots(data);
    }
    setIsLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReassignDay = async (savedSpotId: string, newDay: number) => {
    // Update local state optimistically
    setSpots(spots.map(s => s.id === savedSpotId ? { ...s, custom_day: newDay } : s));
    // Update DB
    await supabase.from('saved_spots').update({ custom_day: newDay }).eq('id', savedSpotId);
  };

  const handleRemoveSpot = async (savedSpotId: string) => {
    setSpots(spots.filter(s => s.id !== savedSpotId));
    await supabase.from('saved_spots').delete().eq('id', savedSpotId);
  };

  const handleFinalize = async () => {
    if (spots.length === 0 || !session?.user?.id) return;
    setIsFinalizing(true);
    
    // Extract unique original creators
    const creatorIds = new Set<string>();
    spots.forEach(s => {
      const creatorId = s.trip_spots?.posts?.user_id;
      if (creatorId && creatorId !== session?.user?.id) {
        creatorIds.add(creatorId);
      }
    });

    // Send notifications to original creators
    for (const creatorId of creatorIds) {
      await supabase.from('notifications').insert({
        user_id: creatorId,
        actor_id: session.user.id,
        type: 'remix',
        is_read: false
      });
    }

    setIsFinalizing(false);
    showNotification('Remix Finalized! Original creators have been notified.');
  };

  // Group by custom_day or original day_number
  const spotsByDay = spots.reduce((acc, savedSpot) => {
    const dayNum = savedSpot.custom_day || savedSpot.trip_spots?.day_number || 1;
    if (!acc[dayNum]) acc[dayNum] = [];
    acc[dayNum].push(savedSpot);
    return acc;
  }, {} as Record<number, any[]>);

  // Ensure Days are sorted
  const sortedDays = Object.keys(spotsByDay).map(Number).sort((a, b) => a - b);
  // Auto expand first available day if expandedDay is null
  useEffect(() => {
    if (sortedDays.length > 0 && expandedDay === null) {
      setExpandedDay(sortedDays[0]);
    }
  }, [sortedDays, expandedDay]);

  const DayReassignSelect = ({ savedSpotId, currentDay }: { savedSpotId: string, currentDay: number }) => (
    <div className="absolute top-6 right-16 flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Move to Day</span>
      <select 
        value={currentDay}
        onChange={(e) => { e.stopPropagation(); handleReassignDay(savedSpotId, parseInt(e.target.value)); }}
        className="bg-zinc-50 border border-zinc-200 text-[#0A192F] font-bold rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-500 shadow-sm cursor-pointer"
      >
        {[1,2,3,4,5,6,7,8,9,10].map(d => (
          <option key={d} value={d}>Day {d}</option>
        ))}
      </select>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] border border-zinc-200 shadow-2xl p-8 relative"
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-8 left-1/2 z-50 bg-[#0A192F] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="text-orange-500" />
            <span className="font-bold">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-zinc-500 font-bold hover:text-[#0A192F] transition-colors"
        >
          <ArrowRight className="rotate-180" size={18} />
          Back to Hub
        </button>
        <button 
          onClick={handleFinalize}
          disabled={isFinalizing || spots.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-colors disabled:opacity-50"
        >
          <ShoppingBag size={20} />
          {isFinalizing ? 'Finalizing...' : 'Checkout & Finalize Remix'}
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-[#0A192F]">{folder.name}</h2>
        <p className="text-zinc-500 font-medium mt-1">Reassign spots to build your custom itinerary.</p>
      </div>

      <div className="space-y-6" style={{ zoom: 0.9 } as any}>
        {isLoading ? (
           <div className="py-20 text-center text-zinc-400 font-bold uppercase tracking-widest text-lg">Loading spots...</div>
        ) : spots.length === 0 ? (
           <div className="py-20 text-center text-zinc-400 font-bold uppercase tracking-widest text-lg">This folder is empty.</div>
        ) : (
          sortedDays.map((dayNum) => {
            const daySpots = spotsByDay[dayNum];
            
            // Extract categories
            const transportSp = daySpots.find(s => s.trip_spots?.category === 'Transport');
            const staySp = daySpots.find(s => s.trip_spots?.category === 'Stay');
            const diningSp = daySpots.find(s => s.trip_spots?.category === 'Dining');
            const activitiesSp = daySpots.filter(s => s.trip_spots?.category === 'Activity');

            const transport = transportSp?.trip_spots;
            const stay = staySp?.trip_spots;
            const dining = diningSp?.trip_spots;
            const activities = activitiesSp.map(a => a.trip_spots);

            // Synthetic day for Carousel
            const syntheticDayForCarousel = {
              stay: stay ? { image: stay.image_url, name: stay.title } : { image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80', name: 'No Stay' },
              dining: dining ? { image: dining.image_url, name: dining.title } : { image: 'https://images.unsplash.com/photo-1590846406792-0adc7f928f1d?auto=format&fit=crop&w=1200&q=80', name: 'No Dining' },
              activities: activities.length > 0 ? activities.map(a => ({ image: a.image_url, name: a.title })) : [{ image: 'https://images.unsplash.com/photo-1542820229-081e0c12af0b?auto=format&fit=crop&w=800&q=80', name: 'Explore' }]
            };

            return (
              <div
                key={`day-${dayNum}`}
                className={`bg-zinc-50 rounded-[2rem] border transition-all duration-500 overflow-hidden ${expandedDay === dayNum ? 'border-orange-500 shadow-xl' : 'border-zinc-200 shadow-sm hover:border-zinc-300'}`}
              >
                <div className="w-full text-left group bg-white">
                  <div className="p-6 md:p-8 space-y-6">
                    <div
                      onClick={() => setExpandedDay(expandedDay === dayNum ? null : dayNum)}
                      className="w-full flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-colors">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Day</span>
                          <span className="text-2xl font-display font-bold text-[#0A192F]">{dayNum}</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-display font-bold text-[#0A192F] group-hover:text-orange-500 transition-colors">
                            Day {dayNum}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full text-[#0A192F] transition-transform duration-500 ${expandedDay === dayNum ? 'rotate-180 bg-orange-500 text-white shadow-lg' : 'bg-zinc-50'}`}>
                          <ChevronDown size={24} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-2">
                        <p className="text-zinc-500 text-sm leading-relaxed italic">
                          {transport ? `"${transport.description}"` : "No transport assigned for this day."}
                        </p>
                      </div>
                      <DayHighlightCarousel day={syntheticDayForCarousel} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedDay === dayNum && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                      <div className="px-6 md:px-8 pb-8 pt-4 space-y-4">
                        
                        {transportSp && transport && (
                          <PillarSection
                            title="Transport Mode"
                            icon={Plane}
                            isExpanded={expandedPillar === `${dayNum}-transport`}
                            onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-transport` ? null : `${dayNum}-transport`)}
                          >
                            <div className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-zinc-100 relative">
                              <div className="p-4 rounded-xl bg-zinc-50 shadow-sm text-orange-500">
                                <Car size={24} />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-[#0A192F] text-lg">{transport.title}</h4>
                                <p className="text-zinc-600 leading-relaxed italic">"{transport.description}"</p>
                              </div>
                              <DayReassignSelect savedSpotId={transportSp.id} currentDay={dayNum} />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveSpot(transportSp.id); }}
                                className="absolute top-6 right-6 text-zinc-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </PillarSection>
                        )}

                        {staySp && stay && (
                          <PillarSection
                            title="Stay Details"
                            icon={Bed}
                            isExpanded={expandedPillar === `${dayNum}-stay`}
                            onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-stay` ? null : `${dayNum}-stay`)}
                          >
                            <div className="bg-white rounded-2xl p-6 border border-zinc-100 space-y-6 relative">
                              <DayReassignSelect savedSpotId={staySp.id} currentDay={dayNum} />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveSpot(staySp.id); }}
                                className="absolute top-6 right-6 text-zinc-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                              <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
                                <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                                  <SmartImage src={stay.image_url} alt={stay.title} locationName={stay.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-2xl font-display font-bold text-[#0A192F] pr-12">{stay.title}</h4>
                                  </div>
                                  <p className="text-zinc-500 text-sm leading-relaxed">{stay.description}</p>
                                </div>
                              </div>
                            </div>
                          </PillarSection>
                        )}

                        {diningSp && dining && (
                          <PillarSection
                            title="Dining"
                            icon={Utensils}
                            isExpanded={expandedPillar === `${dayNum}-dining`}
                            onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-dining` ? null : `${dayNum}-dining`)}
                          >
                            <div className="bg-white rounded-2xl p-6 border border-zinc-100 space-y-6 relative">
                              <DayReassignSelect savedSpotId={diningSp.id} currentDay={dayNum} />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveSpot(diningSp.id); }}
                                className="absolute top-6 right-6 text-zinc-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                              <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
                                <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                                  <SmartImage src={dining.image_url} alt={dining.title} locationName={dining.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-2xl font-display font-bold text-[#0A192F] pr-12">{dining.title}</h4>
                                  </div>
                                  <p className="text-zinc-500 text-sm leading-relaxed">{dining.description}</p>
                                </div>
                              </div>
                            </div>
                          </PillarSection>
                        )}

                        {activitiesSp.length > 0 && (
                          <PillarSection
                            title="Activities"
                            icon={Camera}
                            isExpanded={expandedPillar === `${dayNum}-activities`}
                            onToggle={() => setExpandedPillar(expandedPillar === `${dayNum}-activities` ? null : `${dayNum}-activities`)}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {activitiesSp.map((activitySp: any) => {
                                const activity = activitySp.trip_spots;
                                return (
                                  <div key={activitySp.id} className="bg-white rounded-2xl overflow-hidden border border-zinc-100 flex flex-col relative group">
                                    <div className="absolute top-4 right-14 z-20 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                                      <DayReassignSelect savedSpotId={activitySp.id} currentDay={dayNum} />
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRemoveSpot(activitySp.id); }}
                                      className="absolute top-4 right-4 z-20 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                    <div className="relative h-48 mt-2">
                                      <SmartImage src={activity.image_url} alt={activity.title} locationName={activity.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-6 space-y-2">
                                      <h4 className="font-bold text-[#0A192F] text-lg">{activity.title}</h4>
                                      <p className="text-zinc-500 text-sm leading-relaxed">{activity.description}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </PillarSection>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

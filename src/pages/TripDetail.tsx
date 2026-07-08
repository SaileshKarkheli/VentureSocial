import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Utensils,
  Plane,
  ChevronDown,
  Car,
  Camera,
  Plus,
  LayoutGrid,
  Users,
  CalendarDays,
  ImageOff
} from 'lucide-react';
import { tripsService } from '../services/tripsService';
import { SaveSpotModal } from '../components/remix/SaveSpotModal';
import { PillarSection } from '../components/remix/TimelineComponents';

/** Render image only if the URL is a real non-empty string; otherwise show a clean placeholder */
function SpotImage({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-zinc-100 text-zinc-300 ${className || ''}`}>
        <ImageOff size={24} />
        <span className="text-[10px] uppercase tracking-widest font-bold">No Photo</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  // Track which pillars are expanded: "dayNum-pillar" strings
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [spotToSave, setSpotToSave] = useState<string | null>(null);

  const [post, setPost] = useState<any>(null);
  const [tripSpots, setTripSpots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { post: postData, spots } = await tripsService.fetchTripDetail(id);
        setPost(postData);
        setTripSpots(spots);
      } catch (err) {
        console.error("Supabase fetch failed in TripDetail:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  /** When a day is expanded, auto-expand all its pillars */
  const handleDayToggle = (dayNum: number, spots: any[]) => {
    if (expandedDay === dayNum) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dayNum);
      // Auto-expand every pillar key for this day
      const keys = new Set(expandedPillars);
      if (spots.some((s: any) => s.category === 'Transport')) keys.add(`${dayNum}-transport`);
      if (spots.some((s: any) => s.category === 'Stay'))      keys.add(`${dayNum}-stay`);
      if (spots.some((s: any) => s.category === 'Dining'))    keys.add(`${dayNum}-dining`);
      if (spots.some((s: any) => s.category === 'Activity'))  keys.add(`${dayNum}-activities`);
      setExpandedPillars(keys);
    }
  };

  const togglePillar = (key: string) => {
    setExpandedPillars(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin text-orange-500"><LayoutGrid size={40} /></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-lg">
        Trip not found.
      </div>
    );
  }

  const totalDays = tripSpots.length > 0 ? Math.max(...tripSpots.map((s: any) => s.day_number || 1)) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Trip Header */}
      <section className="bg-white text-[#0A192F] rounded-[2rem] p-12 relative overflow-hidden shadow-2xl border border-zinc-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight max-w-3xl text-[#0A192F]">
            {post.location_name}
          </h1>
          {post.caption && (
            <p className="text-zinc-500 text-xl leading-relaxed max-w-2xl font-light">
              "{post.caption}"
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-[#0A192F] font-bold px-4 py-2 bg-zinc-100 rounded-xl">
              <Users size={16} className="text-orange-500" />
              {post.profiles?.full_name || 'Anonymous'}
            </div>
            {totalDays > 0 && (
              <div className="flex items-center gap-2 text-[#0A192F] font-bold px-4 py-2 bg-zinc-100 rounded-xl">
                <CalendarDays size={16} className="text-orange-500" />
                {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
              </div>
            )}
            {post.base_price > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Est. Cost</span>
                <span className="font-mono text-sm font-bold text-[#0A192F]">${post.base_price}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Day-by-Day Itinerary */}
      <div className="space-y-6">
        <h3 className="text-3xl font-display font-bold text-[#0A192F]">Day-by-Day Itinerary</h3>

        {tripSpots.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-lg bg-white rounded-3xl border border-zinc-100">
            No itinerary details recorded for this trip yet.
          </div>
        ) : (() => {
          const spotsByDay = tripSpots.reduce((acc, spot) => {
            if (!acc[spot.day_number]) acc[spot.day_number] = [];
            acc[spot.day_number].push(spot);
            return acc;
          }, {} as Record<number, any[]>);

          return Object.entries(spotsByDay).map(([dayNumStr, spots]) => {
            const dayNum = parseInt(dayNumStr);
            const typedSpots = spots as any[];
            const transport = typedSpots.find(s => s.category === 'Transport');
            const stay = typedSpots.find(s => s.category === 'Stay');
            const dining = typedSpots.find(s => s.category === 'Dining');
            const activities = typedSpots.filter(s => s.category === 'Activity');

            return (
              <div
                key={`day-${dayNum}`}
                className={`bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${expandedDay === dayNum ? 'border-orange-500 shadow-xl' : 'border-zinc-200 shadow-sm hover:border-zinc-300'}`}
              >
                {/* Day header — click to expand/collapse */}
                <div
                  onClick={() => handleDayToggle(dayNum, typedSpots)}
                  className="p-6 md:p-8 flex items-center justify-between cursor-pointer group"
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
                      <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{post.location_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full text-[#0A192F] transition-transform duration-500 ${expandedDay === dayNum ? 'rotate-180 bg-orange-500 text-white shadow-lg' : 'bg-zinc-50'}`}>
                    <ChevronDown size={24} />
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
                      <div className="px-6 md:px-8 pb-8 space-y-4">

                        {transport && (
                          <PillarSection
                            title="Transport"
                            icon={Plane}
                            isExpanded={expandedPillars.has(`${dayNum}-transport`)}
                            onToggle={() => togglePillar(`${dayNum}-transport`)}
                          >
                            <div className="flex items-start gap-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 relative">
                              <div className="p-4 rounded-xl bg-white shadow-sm text-orange-500">
                                <Car size={24} />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-[#0A192F] text-lg">{transport.title}</h4>
                                <p className="text-zinc-600 leading-relaxed">{transport.description}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSpotToSave(transport.id); }}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                          </PillarSection>
                        )}

                        {stay && (
                          <PillarSection
                            title="Stay"
                            icon={Bed}
                            isExpanded={expandedPillars.has(`${dayNum}-stay`)}
                            onToggle={() => togglePillar(`${dayNum}-stay`)}
                          >
                            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6 relative">
                              <div className="flex flex-col md:flex-row gap-6 items-start">
                                {stay.image_url ? (
                                  <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md flex-shrink-0">
                                    <SpotImage src={stay.image_url} alt={stay.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : null}
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-2xl font-display font-bold text-[#0A192F] pr-12">{stay.title}</h4>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSpotToSave(stay.id); }}
                                      className="absolute top-6 right-6 w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                    >
                                      <Plus size={24} />
                                    </button>
                                  </div>
                                  <p className="text-zinc-500 text-sm leading-relaxed">{stay.description}</p>
                                  {stay.link_url && (
                                    <a href={stay.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-500 font-bold text-sm hover:underline">
                                      Official Booking Site
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </PillarSection>
                        )}

                        {dining && (
                          <PillarSection
                            title="Dining"
                            icon={Utensils}
                            isExpanded={expandedPillars.has(`${dayNum}-dining`)}
                            onToggle={() => togglePillar(`${dayNum}-dining`)}
                          >
                            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6 relative">
                              <div className="flex flex-col md:flex-row gap-6 items-start">
                                {dining.image_url ? (
                                  <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md flex-shrink-0">
                                    <SpotImage src={dining.image_url} alt={dining.title} className="w-full h-full object-cover" />
                                  </div>
                                ) : null}
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-2xl font-display font-bold text-[#0A192F] pr-12">{dining.title}</h4>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSpotToSave(dining.id); }}
                                      className="absolute top-6 right-6 w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                    >
                                      <Plus size={24} />
                                    </button>
                                  </div>
                                  <p className="text-zinc-500 text-sm leading-relaxed">{dining.description}</p>
                                  {dining.link_url && (
                                    <a href={dining.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-orange-500 font-bold text-sm hover:underline">
                                      View Menu
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </PillarSection>
                        )}

                        {activities.length > 0 && (
                          <PillarSection
                            title="Activities"
                            icon={Camera}
                            isExpanded={expandedPillars.has(`${dayNum}-activities`)}
                            onToggle={() => togglePillar(`${dayNum}-activities`)}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {activities.map((activity: any) => (
                                <div key={activity.id} className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 flex flex-col">
                                  {activity.image_url ? (
                                    <div className="relative h-48">
                                      <SpotImage src={activity.image_url} alt={activity.title} className="w-full h-full object-cover" />
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSpotToSave(activity.id); }}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                      >
                                        <Plus size={20} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="relative p-4 flex justify-end">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSpotToSave(activity.id); }}
                                        className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                      >
                                        <Plus size={20} />
                                      </button>
                                    </div>
                                  )}
                                  <div className="p-6 space-y-2">
                                    <h4 className="font-bold text-[#0A192F] text-lg">{activity.title}</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">{activity.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </PillarSection>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          });
        })()}
      </div>

      <SaveSpotModal isOpen={!!spotToSave} spotId={spotToSave} onClose={() => setSpotToSave(null)} />
    </div>
  );
}

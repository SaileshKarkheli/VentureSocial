import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SmartImage from '../components/SmartImage';
import {
  ArrowLeft,
  MapPin,
  BookOpen,
  Plus,
  ExternalLink,
  Bed,
  Utensils,
  Plane,
  ChevronDown,
  Car,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../AppContext';
import React, { useState } from 'react';

export const tripData: Record<string, any> = {
  '1': {
    title: 'La Dolce Vita: An Italian Adventure',
    description: "Italy isn't just a destination, it's an emotion. From the historical wonders of Rome to the romantic canals of Venice.",
    days: [
      {
        id: 'd1',
        day: 1,
        title: 'Arrival in Rome',
        location: 'Rome, Italy',
        transport: {
          mode: 'Flight to FCO (Rome)',
          narrative: 'Touching down in the Eternal City. The history is already palpable.'
        },
        stay: {
          name: 'Hotel Eden Rome',
          image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
          link: 'https://www.dorchestercollection.com/rome/hotel-eden'
        },
        dining: {
          name: 'Roscioli Salumeria',
          image: 'https://images.unsplash.com/photo-1590846406792-0adc7f928f1d?auto=format&fit=crop&w=1200&q=80',
          link: 'https://www.salumeriaroscioli.com'
        },
        activities: [
          {
            id: 'a1',
            name: 'Colosseum Guided Tour',
            description: 'Exploring the ancient gladiatorial arena.',
            image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'a2',
            name: 'Trevi Fountain Evening Walk',
            description: 'Tossing a coin to ensure our return to Rome.',
            image: 'https://images.unsplash.com/photo-1542820229-081e0c12af0b?auto=format&fit=crop&w=800&q=80'
          }
        ]
      },
      {
        id: 'd2',
        day: 2,
        title: 'Venetian Dreams',
        location: 'Venice, Italy',
        transport: {
          mode: 'High-speed Train to Venice',
          narrative: 'Taking the efficient Italo train up to the floating city. Every turn is a postcard.'
        },
        stay: {
          name: 'Belmond Hotel Cipriani',
          image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80',
          link: 'https://www.belmond.com'
        },
        dining: {
          name: 'Osteria alle Testiere',
          image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
          link: 'https://osteriaalletestiere.it'
        },
        activities: [
          {
            id: 'a3',
            name: 'Gondola Ride',
            description: 'A classic Venetian experience through the narrow canals.',
            image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'a4',
            name: 'St. Mark\'s Basilica Tour',
            description: 'Admiring the stunning golden mosaics and Byzantine architecture.',
            image: 'https://images.unsplash.com/photo-1521312389140-5e3d74c0529d?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'a5',
            name: 'Rialto Bridge Market',
            description: 'Shopping for fresh local produce and souvenirs along the Grand Canal.',
            image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80'
          }
        ]
      }
    ]
  },
  '2': {
    title: 'Music City Exploration',
    description: "Nashville is the soul of country music. From honky-tonk bars to historical studios.",
    days: [
      {
        id: 'd1',
        day: 1,
        title: 'Arrival in Nashville',
        location: 'Nashville, USA',
        transport: {
          mode: 'Flight to BNA',
          narrative: 'Touching down in Music City. The energy is already palpable.'
        },
        stay: {
          name: 'The Hermitage Hotel',
          image: 'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=1200&q=80',
          link: 'https://www.thehermitagehotel.com'
        },
        dining: {
          name: 'Hattie B\'s Hot Chicken',
          image: 'https://images.unsplash.com/photo-1531266752426-aad47a4583d7?auto=format&fit=crop&w=1200&q=80',
          link: 'https://hattiebs.com'
        },
        activities: [
          {
            id: 'a1',
            name: 'Broadway Honky Tonk',
            description: 'Dancing the night away to live country music.',
            image: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&w=800&q=80'
          }
        ]
      },
      {
        id: 'd2',
        day: 2,
        title: 'Country Music History',
        location: 'Nashville, USA',
        transport: {
          mode: 'Uber to Music Row',
          narrative: 'Driving through the heart of the music industry.'
        },
        stay: {
          name: 'The Hermitage Hotel',
          image: 'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=1200&q=80',
          link: 'https://www.thehermitagehotel.com'
        },
        dining: {
          name: 'Puckett\'s Grocery & Restaurant',
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
          link: 'https://puckettsrestaurant.com'
        },
        activities: [
          {
            id: 'a2',
            name: 'Country Music Hall of Fame',
            description: 'Exploring the rich history of country music legends.',
            image: 'https://images.unsplash.com/photo-1507676184212-d0330a15152a?auto=format&fit=crop&w=800&q=80'
          }
        ]
      }
    ]
  },
  '3': {
    title: 'Bali Island Retreat',
    description: "Discover the lush rainforests, ancient temples, and spiritual essence of Bali.",
    days: [
      {
        id: 'd1',
        day: 1,
        title: 'Ubud Jungle Awakenings',
        location: 'Ubud, Bali',
        transport: {
          mode: 'Private Transfer from DPS',
          narrative: 'Winding through the lush green rice paddies.'
        },
        stay: {
          name: 'Viceroy Bali',
          image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
          link: '#Booking'
        },
        dining: {
          name: 'Locavore',
          image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
          link: '#Menu'
        },
        activities: [
          {
            id: 'a1',
            name: 'Sacred Monkey Forest',
            description: 'Meeting the playful macaques in a mystical jungle temple.',
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
          }
        ]
      },
      {
        id: 'd2',
        day: 2,
        title: 'Temple Hopping',
        location: 'Uluwatu, Bali',
        transport: {
          mode: 'Scooter Rental',
          narrative: 'Cruising the coastal roads of the Bukit Peninsula.'
        },
        stay: {
          name: 'Alila Villas Uluwatu',
          image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
          link: '#Booking'
        },
        dining: {
          name: 'Single Fin',
          image: 'https://images.unsplash.com/photo-1515669097368-22e68427d265?auto=format&fit=crop&w=1200&q=80',
          link: '#Menu'
        },
        activities: [
          {
            id: 'a2',
            name: 'Uluwatu Cliff Temple at Sunset',
            description: 'Watching the Kecak fire dance as the sun dips below the ocean.',
            image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
          }
        ]
      }
    ]
  },
  '4': {
    title: 'The Empire State of Mind',
    description: "New York City: Bright lights, towering skyscrapers, and unbridled energy.",
    days: [
      {
        id: 'd1',
        day: 1,
        title: 'Concrete Jungle',
        location: 'New York, USA',
        transport: {
          mode: 'Yellow Cab from JFK',
          narrative: 'Seeing the skyline emerge from the backseat of an iconic NYC taxi.'
        },
        stay: {
          name: 'The Plaza Hotel',
          image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
          link: '#Booking'
        },
        dining: {
          name: 'Katz\'s Delicatessen',
          image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
          link: '#Menu'
        },
        activities: [
          {
            id: 'a1',
            name: 'Central Park Walk',
            description: 'Strolling through the green heart of Manhattan.',
            image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'
          }
        ]
      },
      {
        id: 'd2',
        day: 2,
        title: 'Lights of Times Square',
        location: 'New York, USA',
        transport: {
          mode: 'NYC Subway',
          narrative: 'Riding the express train like a true local.'
        },
        stay: {
          name: 'The Plaza Hotel',
          image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
          link: '#Booking'
        },
        dining: {
          name: 'Le Bernardin',
          image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
          link: '#Menu'
        },
        activities: [
          {
            id: 'a2',
            name: 'Broadway Show',
            description: 'Catching a world-class theatrical performance.',
            image: 'https://images.unsplash.com/photo-1583088924036-7c6de3470788?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'a3',
            name: 'Top of the Rock',
            description: 'Taking in panoramic views of the entire city.',
            image: 'https://images.unsplash.com/photo-1430990480609-2bf7c02a6b1a?auto=format&fit=crop&w=800&q=80'
          }
        ]
      }
    ]
  },
  '5': {
    title: 'Amalfi Coast Getaway',
    description: "Cliffside lemon groves, pastel-colored villages, and sparkling Mediterranean waters.",
    days: [
      {
        id: 'd1',
        day: 1,
        title: 'Positano Views',
        location: 'Positano, Italy',
        transport: {
          mode: 'Ferry from Naples',
          narrative: 'Approaching the vertical town from the sea is unforgettable.'
        },
        stay: {
          name: 'Le Sirenuse',
          image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
          link: '#Booking'
        },
        dining: {
          name: 'La Sponda',
          image: 'https://images.unsplash.com/photo-1598501258165-27a36f6d0f50?auto=format&fit=crop&w=1200&q=80',
          link: '#Menu'
        },
        activities: [
          {
            id: 'a1',
            name: 'Spiaggia Grande',
            description: 'Relaxing on Positano\'s main beach under the iconic umbrellas.',
            image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80'
          }
        ]
      },
      {
        id: 'd2',
        day: 2,
        title: 'Path of the Gods',
        location: 'Amalfi, Italy',
        transport: {
          mode: 'SITA Bus',
          narrative: 'Navigating the winding coastal cliff roads.'
        },
        stay: {
          name: 'Hotel Santa Caterina',
          image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
          link: '#Booking'
        },
        dining: {
          name: 'Da Gemma',
          image: 'https://images.unsplash.com/photo-1590846406792-0adc7f928f1d?auto=format&fit=crop&w=1200&q=80',
          link: '#Menu'
        },
        activities: [
          {
            id: 'a2',
            name: 'Hiking Sentiero degli Dei',
            description: 'Walking the breathtaking cliffside trail above the sea.',
            image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'
          }
        ]
      }
    ]
  }
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, saveItem } = useApp();
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Use the ID to get dynamic data, fallback to Italy (id 1)
  const trip = tripData[id || '1'] || tripData['1'];
  const initialDays = trip.days;

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = (item: any) => {
    saveItem(item);
    showNotification(`Saved ${item.name} to your Itinerary!`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-50 bg-white text-[#0A192F] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-zinc-100"
          >
            <CheckCircle2 className="text-orange-500" />
            <span className="font-bold">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => navigate('/my-trips')}
        className="flex items-center gap-2 text-zinc-500 hover:text-orange transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        <span>Back to My History</span>
      </button>

      {/* Travel Story Gist */}
      <section className="bg-white text-[#0A192F] rounded-[2rem] p-12 relative overflow-hidden shadow-2xl border border-zinc-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 text-orange-500">
            <BookOpen size={24} />
            <span className="font-bold uppercase tracking-widest text-sm">Travel Story</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight max-w-3xl text-[#0A192F]">
            {trip.title}
          </h1>
          <p className="text-zinc-500 text-xl leading-relaxed max-w-2xl font-light">
            "{trip.description}"
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate(`/blog/${id || '3'}`)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-orange-500 text-orange-500 font-bold hover:bg-orange-500 hover:text-white transition-all shadow-lg group"
            >
              <BookOpen size={20} className="group-hover:scale-110 transition-transform" />
              <span>Read about this trip completely</span>
            </button>
            <button
              onClick={() => {
                const cartMockPost = {
                  id: `trip-${id || '1'}`,
                  location: trip.title,
                  user: 'Platform Creator',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
                  price: 1200,
                  hotelType: 'Luxury',
                  activities: ['Sightseeing', 'Guided Tours'],
                  images: [{ url: trip.days[0]?.stay?.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' }]
                };
                addToCart(cartMockPost as any); 
                showNotification('Trip successfully added to your Booking Cart!');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0A192F] text-white font-bold hover:bg-black transition-all shadow-lg group"
            >
              <ShoppingBag size={20} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Book / Clone Itinerary</span>
            </button>
          </div>
        </div>
      </section>

      {/* Wide Accordion Timeline */}
      <div className="space-y-6">
        {initialDays.map((day: any) => (
          <div
            key={day.id}
            className={`bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${expandedDay === day.id ? 'border-orange shadow-2xl' : 'border-zinc-100 shadow-sm hover:border-zinc-300'
              }`}
          >
            {/* Day Header - Landscape Card */}
            <div className="w-full text-left group">
              <div className="p-8 space-y-6">
                <div
                  onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                  className="w-full flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 group-hover:bg-orange/10 group-hover:border-orange/20 transition-colors">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Day</span>
                      <span className="text-2xl font-display font-bold text-navy">{day.day}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-navy group-hover:text-orange transition-colors">
                        Day {day.day}: {day.title}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                        <MapPin size={14} />
                        <span>{day.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showNotification(`Day ${day.day} itinerary cloned to My Trips!`);
                      }}
                      className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 font-bold text-[11px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all group/clone"
                    >
                      <Copy size={14} className="group-hover/clone:scale-110 transition-transform" />
                      <span>Clone Day</span>
                    </button>
                    <div className={`p-3 rounded-full text-navy transition-transform duration-500 ${expandedDay === day.id ? 'rotate-180 bg-orange-500 text-white shadow-lg' : 'bg-zinc-50'}`}>
                      <ChevronDown size={24} />
                    </div>
                  </div>
                </div>

                {/* The Gist & Day Highlight Carousel (Always Visible) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-sm leading-relaxed italic">
                      "{day.transport.narrative}"
                    </p>
                  </div>
                  <DayHighlightCarousel day={day} />
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedDay === day.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <div className="px-8 pb-8 space-y-4">
                    {/* The Four Pillars */}

                    {/* 1. Transport */}
                    <PillarSection
                      title="Transport Mode"
                      icon={Plane}
                      isExpanded={expandedPillar === `${day.id}-transport`}
                      onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-transport` ? null : `${day.id}-transport`)}
                    >
                      <div className="flex items-start gap-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="p-4 rounded-xl bg-white shadow-sm text-orange">
                          <Car size={24} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-navy text-lg">{day.transport.mode}</h4>
                          <p className="text-zinc-600 leading-relaxed italic">"{day.transport.narrative}"</p>
                        </div>
                      </div>
                    </PillarSection>

                    {/* 2. Stay Details */}
                    <PillarSection
                      title="Stay Details"
                      icon={Bed}
                      isExpanded={expandedPillar === `${day.id}-stay`}
                      onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-stay` ? null : `${day.id}-stay`)}
                    >
                      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                            <SmartImage src={day.stay.image} alt={day.stay.name} locationName={day.stay.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-2xl font-display font-bold text-navy">{day.stay.name}</h4>
                              <button
                                onClick={() => handleSave({ ...day.stay, type: 'Stay' })}
                                className="w-12 h-12 rounded-full bg-orange text-navy flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                              >
                                <Plus size={24} />
                              </button>
                            </div>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                              A boutique experience in the heart of the city, offering unparalleled views and world-class service.
                            </p>
                            <a
                              href={day.stay.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-orange font-bold text-sm hover:underline"
                            >
                              Official Booking Site <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </PillarSection>

                    {/* 3. Dining */}
                    <PillarSection
                      title="Dining (Restaurants)"
                      icon={Utensils}
                      isExpanded={expandedPillar === `${day.id}-dining`}
                      onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-dining` ? null : `${day.id}-dining`)}
                    >
                      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden shadow-md">
                            <SmartImage src={day.dining.image} alt={day.dining.name} locationName={day.dining.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-2xl font-display font-bold text-navy">{day.dining.name}</h4>
                              <button
                                onClick={() => handleSave({ ...day.dining, type: 'Restaurant' })}
                                className="w-12 h-12 rounded-full bg-orange text-navy flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                              >
                                <Plus size={24} />
                              </button>
                            </div>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                              Experience the authentic flavors of the region in a beautifully designed space that captures the local vibe.
                            </p>
                            <a
                              href={day.dining.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-orange font-bold text-sm hover:underline"
                            >
                              View Menu & Reservations <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </PillarSection>

                    {/* 4. Activities */}
                    <PillarSection
                      title="Activities"
                      icon={Camera}
                      isExpanded={expandedPillar === `${day.id}-activities`}
                      onToggle={() => setExpandedPillar(expandedPillar === `${day.id}-activities` ? null : `${day.id}-activities`)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {day.activities.map((activity: any) => (
                          <div key={activity.id} className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 flex flex-col">
                            <div className="relative h-48">
                              <SmartImage src={activity.image} alt={activity.name} locationName={activity.name} className="w-full h-full object-cover" />
                              <button
                                onClick={() => handleSave({ ...activity, type: 'Activity' })}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-orange text-navy flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                            <div className="p-6 space-y-2">
                              <h4 className="font-bold text-navy text-lg">{activity.name}</h4>
                              <p className="text-zinc-500 text-sm leading-relaxed">{activity.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PillarSection>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayHighlightCarousel({ day }: { day: any }) {
  const images = [
    { url: day.stay.image, type: 'STAY', name: day.stay.name },
    { url: day.dining.image, type: 'DINING', name: day.dining.name },
    ...day.activities.map((a: any) => ({ url: a.image, type: 'ACTIVITY', name: a.name }))
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden h-[240px] group/carousel shadow-md bg-zinc-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <SmartImage
            src={images[currentIndex].url}
            alt={images[currentIndex].name}
            locationName={images[currentIndex].name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Type Tag */}
      <div className="absolute top-3 left-3 z-10">
        <motion.div
          key={images[currentIndex].type}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-navy uppercase tracking-widest shadow-sm border border-zinc-100"
        >
          {images[currentIndex].type}
        </motion.div>
      </div>

      {/* Name Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <p className="text-white text-xs font-bold truncate drop-shadow-md">
          {images[currentIndex].name}
        </p>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronRight size={16} />
          </button>

          {/* Pagination Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-orange' : 'w-1 bg-white/50'
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PillarSection({ title, icon: Icon, children, isExpanded, onToggle }: {
  title: string,
  icon: any,
  children: React.ReactNode,
  isExpanded: boolean,
  onToggle: () => void
}) {
  return (
    <div className="border border-zinc-100 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-zinc-50 text-orange">
            <Icon size={20} />
          </div>
          <span className="font-bold text-navy uppercase tracking-widest text-xs">{title}</span>
        </div>
        <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

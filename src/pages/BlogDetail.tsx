import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SmartImage from '../components/SmartImage';
import { ArrowLeft, Calendar, MapPin, Utensils, Map as MapIcon, BookOpen } from 'lucide-react';

const blogContent = {
  '1': {
    title: 'The Roman Holiday: A Journey Through Time',
    year: '2025',
    location: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    narrative: [
      { type: 'text', content: 'Rome wasn\'t built in a day, and it certainly can\'t be seen in one. Our journey began under the warm Italian sun, where every cobblestone seemed to whisper stories of emperors and gladiators. Walking through the Roman Forum, I felt a profound sense of scale—not just of the buildings, but of history itself.' },
      { type: 'image', content: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80', caption: 'The canals of Venice at sunrise.' },
      { type: 'text', content: 'The food, of course, was a revelation. We found a tiny trattoria tucked away in Trastevere where the carbonara was so creamy it felt like a sin. We spent hours there, sipping house wine and watching the world go by. It wasn\'t just about the sights; it was about the rhythm of life—the "dolce far niente" or the sweetness of doing nothing.' },
      { type: 'image', content: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80', caption: 'The stunning Amalfi Coast.' },
      { type: 'text', content: 'As we tossed our coins into the Trevi Fountain, I knew this wouldn\'t be my last time here. Rome has a way of getting under your skin, making you feel both incredibly small and part of something eternal.' }
    ],
    spotsCited: [
      { name: 'The Colosseum', type: 'Location' },
      { name: 'Trattoria Da Enzo al 29', type: 'Restaurant' },
      { name: 'Trevi Fountain', type: 'Location' },
      { name: 'Pantheon', type: 'Location' },
      { name: 'Gelateria del Teatro', type: 'Restaurant' }
    ]
  },
  '2': {
    title: 'Nashville: The Heart of Country Music',
    year: '2024',
    location: 'Nashville, USA',
    image: 'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=1200&q=80',
    narrative: [
      { type: 'text', content: 'Nashville is a city that sings. From the moment we stepped onto Broadway, the sound of live music pulled us in every direction. It\'s a place where dreams are chased and stories are told through three chords and the truth.' },
      { type: 'image', content: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&w=1200&q=80', caption: 'A packed honky-tonk on a Saturday night.' },
      { type: 'text', content: 'But beyond the neon lights, Nashville has a soul that\'s deeply rooted in community and comfort. We spent our afternoons exploring the Gulch and eating our weight in hot chicken. It\'s a city that welcomes you with open arms and a cold beer.' }
    ],
    spotsCited: [
      { name: 'Broadway', type: 'Location' },
      { name: 'Ryman Auditorium', type: 'Location' },
      { name: 'Hattie B\'s', type: 'Restaurant' },
      { name: 'The Gulch', type: 'Location' }
    ]
  }
};

export default function BlogDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  
  const blog = blogContent[tripId as keyof typeof blogContent] || blogContent['1'];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white min-h-screen pb-20 text-zinc-900"
    >
      {/* Header Section */}
      <header className="relative h-[70vh] w-full overflow-hidden">
        <SmartImage 
          src={blog.image} 
          alt={blog.title}
          locationName={blog.location}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 max-w-4xl"
          >
            <div className="flex items-center justify-center gap-3 text-orange-500 font-bold uppercase tracking-[0.3em] text-sm">
              <BookOpen size={20} />
              <span>Travel Story</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight drop-shadow-lg">
              {blog.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-white font-medium drop-shadow-md">
              <span className="flex items-center gap-2">
                <MapPin size={18} className="text-orange-500" />
                {blog.location}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={18} className="text-orange-500" />
                {blog.year}
              </span>
            </div>
          </motion.div>
        </div>
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all border border-white/40"
        >
          <ArrowLeft size={24} />
        </button>
      </header>

      {/* Narrative Section */}
      <article className="max-w-3xl mx-auto px-6 py-20 space-y-12">
        <div className="flex justify-center mb-12">
          <button 
            onClick={() => navigate(`/trip/${tripId}`)}
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-orange-500 text-white font-bold hover:bg-orange-400 transition-all shadow-2xl group border-2 border-transparent"
          >
            <MapIcon size={20} className="group-hover:rotate-12 transition-transform" />
            <span>Back to Itinerary</span>
          </button>
        </div>

        {blog.narrative.map((section, index) => (
          <div key={index} className="space-y-8">
            {section.type === 'text' ? (
              <p className="font-serif text-xl leading-relaxed text-zinc-600 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-orange-500">
                {section.content}
              </p>
            ) : (
              <figure className="space-y-4 py-8">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-100">
                  <SmartImage 
                    src={section.content} 
                    alt={section.caption || 'Blog image'}
                    locationName={blog.location}
                    className="w-full h-auto opacity-90"
                  />
                </div>
                {section.caption && (
                  <figcaption className="text-center italic text-zinc-400 font-serif">
                    {section.caption}
                  </figcaption>
                )}
              </figure>
            )}
          </div>
        ))}

        {/* Spots Cited Section */}
        <section className="pt-20 border-t border-zinc-100">
          <h2 className="text-3xl font-display font-bold text-[#0A192F] mb-8 flex items-center gap-3">
            <MapPin size={28} className="text-orange-500" />
            Spots Cited
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blog.spotsCited.map((spot, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group hover:border-orange-500 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm border border-zinc-100">
                  {spot.type === 'Restaurant' ? <Utensils size={20} /> : <MapPin size={20} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{spot.type}</p>
                  <p className="font-bold text-[#0A192F]">{spot.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-20 text-center">
          <div className="w-24 h-1 bg-orange-500 mx-auto mb-8 rounded-full" />
          <p className="font-serif italic text-zinc-400">Fin.</p>
        </div>
      </article>
    </motion.div>
  );
}

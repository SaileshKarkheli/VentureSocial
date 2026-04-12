import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, ArrowRight, Calendar, MapPin } from 'lucide-react';

const blogs = [
  {
    id: '1',
    title: 'The Roman Holiday: A Journey Through Time',
    year: '2025',
    location: 'Italy',
    excerpt: 'Rome wasn\'t built in a day, and it certainly can\'t be seen in one. Our journey began under the warm Italian sun...',
    image: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    title: 'Parisian Dreams: Art, Wine, and Baguettes',
    year: '2024',
    location: 'France',
    excerpt: 'Paris in the spring is exactly as the songs describe it. The air is crisp, the parks are blooming...',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  }
];

export default function BlogList() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 pb-20 text-zinc-900">
      <header>
        <h2 className="text-3xl font-display font-bold text-[#0A192F]">My Travel Blogs</h2>
        <p className="text-zinc-500">Long-form stories from my adventures around the globe.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {blogs.map((blog) => (
          <motion.div
            key={blog.id}
            whileHover={{ y: -5 }}
            onClick={() => navigate(`/blog/${blog.id}`)}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 cursor-pointer group hover:shadow-xl transition-all duration-300"
          >
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={blog.image} 
                alt={blog.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-zinc-100/20 group-hover:bg-zinc-100/10 transition-colors" />
            </div>
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4 text-xs font-bold text-orange-500 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {blog.year}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {blog.location}
                </span>
              </div>
              <h3 className="text-2xl font-display font-bold text-[#0A192F] group-hover:text-orange-500 transition-colors">
                {blog.title}
              </h3>
              <p className="text-zinc-500 line-clamp-2 font-serif italic">
                "{blog.excerpt}"
              </p>
              <div className="pt-4 flex items-center gap-2 text-[#0A192F] font-bold text-sm group-hover:gap-4 transition-all">
                <span>Read Story</span>
                <ArrowRight size={18} className="text-orange-500" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, ArrowRight, Calendar, MapPin, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Blog {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  trip_id: string | null;
  created_at: string;
  location_name?: string;
}

export default function BlogList() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select(`
            *,
            posts:blogs_trip_id_fkey(location_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          content: row.content || '',
          cover_image: row.cover_image,
          trip_id: row.trip_id,
          created_at: row.created_at,
          location_name: row.posts?.location_name || 'Unknown Location'
        }));
        setBlogs(mapped);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).getFullYear().toString();
  };

  const getExcerpt = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content || 'No content yet.';
  };

  const getImage = (blog: Blog) => {
    return blog.cover_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';
  };

  return (
    <div className="space-y-12 pb-20 text-ink">
      <div className="flex items-center justify-between">
        <header>
          <h2 className="text-3xl font-display font-bold text-ink">My Travel Blogs</h2>
          <p className="text-body">Long-form stories from adventures around the globe.</p>
        </header>
        <button
          onClick={() => navigate('/blogs/new')}
          className="flex items-center gap-2 bg-orange-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
        >
          <Plus size={18} />
          Write a Blog
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-hairline shadow-sm">
          <BookOpen size={48} className="mx-auto text-zinc-300 mb-4" />
          <h3 className="text-xl font-bold text-ink mb-2">No blogs yet</h3>
          <p className="text-body mb-6">Start writing about your travel experiences.</p>
          <button
            onClick={() => navigate('/blogs/new')}
            className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors"
          >
            Write Your First Blog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((blog) => (
            <motion.div
              key={blog.id}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/blog/${blog.id}`)}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-hairline cursor-pointer group hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={getImage(blog)} 
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-cream/20 group-hover:bg-cream/10 transition-colors" />
              </div>
              <div className="p-8 space-y-4">
                <div className="flex items-center gap-4 text-xs font-bold text-orange-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(blog.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {blog.location_name}
                  </span>
                </div>
                <h3 className="text-2xl font-display font-bold text-ink group-hover:text-orange-500 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-body line-clamp-2 font-serif italic">
                  "{getExcerpt(blog.content)}"
                </p>
                <div className="pt-4 flex items-center gap-2 text-ink font-bold text-sm group-hover:gap-4 transition-all">
                  <span>Read Story</span>
                  <ArrowRight size={18} className="text-orange-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

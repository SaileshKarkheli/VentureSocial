import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import SmartImage from '../components/SmartImage';
import { ArrowLeft, Calendar, MapPin, Utensils, Map as MapIcon, BookOpen, Loader2, Save, Pencil, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Blog {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  trip_id: string | null;
  created_at: string;
  location_name?: string;
  is_owner?: boolean;
}

interface Trip {
  id: string;
  location_name: string;
}

export default function BlogDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const isNew = tripId === 'new';
  const isEditMode = isNew || location.search.includes('edit=true');

  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    cover_image: '',
    trip_id: ''
  });

  const fetchBlog = useCallback(async () => {
    if (isNew || !tripId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          posts:blogs_trip_id_fkey(location_name)
        `)
        .eq('id', tripId)
        .single();

      if (error) throw error;

      if (data) {
        const mapped = {
          id: data.id,
          title: data.title,
          content: data.content || '',
          cover_image: data.cover_image,
          trip_id: data.trip_id,
          created_at: data.created_at,
          location_name: data.posts?.location_name || 'Unknown Location',
          is_owner: data.user_id === session?.user?.id
        };
        setBlog(mapped);
        setEditForm({
          title: mapped.title,
          content: mapped.content,
          cover_image: mapped.cover_image || '',
          trip_id: mapped.trip_id || ''
        });
      }
    } catch (err) {
      console.error('Error fetching blog:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId, isNew, session?.user?.id]);

  const fetchUserTrips = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, location_name')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTrips(data || []);
    } catch (err) {
      console.error('Error fetching user trips:', err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchBlog();
    fetchUserTrips();
  }, [fetchBlog, fetchUserTrips]);

  const handleSave = async () => {
    if (!session?.user?.id || !editForm.title.trim()) return;
    setIsSaving(true);

    try {
      const payload = {
        title: editForm.title.trim(),
        content: editForm.content,
        cover_image: editForm.cover_image || null,
        trip_id: editForm.trip_id || null,
        user_id: session.user.id
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('blogs')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          navigate(`/blog/${data.id}`);
        }
      } else if (tripId) {
        const { error } = await supabase
          .from('blogs')
          .update(payload)
          .eq('id', tripId);

        if (error) throw error;
        await fetchBlog();
        navigate(`/blog/${tripId}`);
      }
    } catch (err) {
      console.error('Error saving blog:', err);
      alert('Failed to save blog. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getNarrative = (content: string) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map((p, i) => {
      if (p.startsWith('http') && (p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.png') || p.includes('unsplash') || p.includes('images.'))) {
        return { type: 'image' as const, content: p, caption: '' };
      }
      return { type: 'text' as const, content: p };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!isNew && !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-zinc-500">
        <BookOpen size={48} className="mb-4 text-zinc-300" />
        <p className="text-lg font-bold">Blog not found</p>
        <button onClick={() => navigate('/blogs')} className="mt-4 text-orange-500 font-bold hover:underline">
          Back to Blogs
        </button>
      </div>
    );
  }

  const displayBlog = blog || {
    id: 'new',
    title: '',
    content: '',
    cover_image: null,
    trip_id: null,
    created_at: new Date().toISOString(),
    location_name: 'New Blog',
    is_owner: true
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white min-h-screen pb-20 text-zinc-900"
    >
      {/* Header Section */}
      <header className="relative h-[50vh] w-full overflow-hidden">
        <SmartImage 
          src={editForm.cover_image || displayBlog.cover_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80'} 
          alt={displayBlog.title || 'New Blog'}
          locationName={displayBlog.location_name || ''}
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
              <span>{isNew ? 'New Travel Story' : 'Travel Story'}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight drop-shadow-lg">
              {isNew ? 'Write Your Story' : displayBlog.title}
            </h1>
            {!isNew && (
              <div className="flex items-center justify-center gap-6 text-white font-medium drop-shadow-md">
                <span className="flex items-center gap-2">
                  <MapPin size={18} className="text-orange-500" />
                  {displayBlog.location_name}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar size={18} className="text-orange-500" />
                  {formatDate(displayBlog.created_at)}
                </span>
              </div>
            )}
          </motion.div>
        </div>
        
        <button 
          onClick={() => {
            if (isNew) {
              navigate('/blogs');
            } else {
              navigate(-1);
            }
          }}
          className="absolute top-8 left-8 p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all border border-white/40"
        >
          <ArrowLeft size={24} />
        </button>

        {!isNew && displayBlog.is_owner && !isEditMode && (
          <button
            onClick={() => navigate(`/blog/${tripId}?edit=true`)}
            className="absolute top-8 right-8 p-3 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-lg flex items-center gap-2 px-4"
          >
            <Pencil size={16} />
            Edit
          </button>
        )}
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {isEditMode ? (
          /* Edit Mode */
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your story a captivating title..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xl font-bold text-[#0A192F] focus:ring-2 focus:ring-orange-500/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Cover Image URL</label>
              <input
                type="text"
                value={editForm.cover_image}
                onChange={(e) => setEditForm(prev => ({ ...prev, cover_image: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Linked Trip</label>
              <select
                value={editForm.trip_id}
                onChange={(e) => setEditForm(prev => ({ ...prev, trip_id: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
              >
                <option value="">None (standalone blog)</option>
                {userTrips.map(trip => (
                  <option key={trip.id} value={trip.id}>{trip.location_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Content</label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Tell your story... Use double line breaks to separate paragraphs. Paste image URLs on their own line to embed them."
                rows={20}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm leading-relaxed focus:ring-2 focus:ring-orange-500/50 outline-none resize-y"
              />
              <p className="text-[10px] text-zinc-400">
                Tip: Separate paragraphs with a blank line. Paste image URLs on their own line to embed them automatically.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => isNew ? navigate('/blogs') : navigate(`/blog/${tripId}`)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 text-zinc-600 font-bold hover:bg-zinc-200 transition-colors"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editForm.title.trim()}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : (isNew ? 'Publish Blog' : 'Save Changes')}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            <div className="flex justify-center mb-12">
              {displayBlog.trip_id && (
                <button 
                  onClick={() => navigate(`/trip/${displayBlog.trip_id}`)}
                  className="flex items-center gap-2 px-8 py-4 rounded-full bg-orange-500 text-white font-bold hover:bg-orange-400 transition-all shadow-2xl group border-2 border-transparent"
                >
                  <MapIcon size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>View Linked Itinerary</span>
                </button>
              )}
            </div>

            {getNarrative(displayBlog.content).map((section, index) => (
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
                        alt="Blog image"
                        locationName={displayBlog.location_name || ''}
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

            <div className="pt-20 text-center">
              <div className="w-24 h-1 bg-orange-500 mx-auto mb-8 rounded-full" />
              <p className="font-serif italic text-zinc-400">Fin.</p>
            </div>
          </>
        )}
      </article>
    </motion.div>
  );
}

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, MapPin, Plus, Filter, Check } from 'lucide-react';
import { useApp } from '../AppContext';
import SmartImage from '../components/SmartImage';

const categories = [
  'All',
  'Hiking',
  'Boat Rentals',
  'Guided Tours',
  'Paragliding',
  'Museum Passes',
  'Food Tours',
  'Photography',
  'Equipment Rental'
];

export default function TravelServices() {
  const { travelServices, saveItem } = useApp();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (category: string) => {
    if (category === 'All') {
      setSelectedCategories(['All']);
      return;
    }

    setSelectedCategories(prev => {
      const filtered = prev.filter(c => c !== 'All');
      if (filtered.includes(category)) {
        const next = filtered.filter(c => c !== category);
        return next.length === 0 ? ['All'] : next;
      } else {
        return [...filtered, category];
      }
    });
  };

  const filteredServices = useMemo(() => {
    return travelServices.filter(service => {
      const matchesCategory = selectedCategories.includes('All') || selectedCategories.includes(service.category);
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           service.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [travelServices, selectedCategories, searchQuery]);

  return (
    <div className="flex gap-8 pb-20 text-ink">
      {/* Sticky Sidebar Filter */}
      <aside className="w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-ink mb-6">Activities</h2>
            <div className="space-y-2">
              {categories.map((category) => {
                const isActive = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group border border-transparent ${
                      isActive 
                        ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20' 
                        : 'text-body hover:bg-white hover:text-ink hover:shadow-sm'
                    }`}
                  >
                    <span className="text-sm">{category}</span>
                    {isActive && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-white border border-hairline rounded-3xl text-ink space-y-4 shadow-sm">
            <h4 className="font-bold text-orange-500">Need a Guide?</h4>
            <p className="text-xs text-body leading-relaxed">
              Connect with local experts for a personalized travel experience.
            </p>
            <button className="w-full py-2 bg-tint hover:bg-cream border border-hairline rounded-xl text-xs font-bold transition-colors">
              Browse Guides
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-ink">Travel Guide</h1>
            <p className="text-body">Discover and book curated travel experiences.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => (
              <motion.div
                layout
                key={service.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white rounded-[2rem] overflow-hidden border border-hairline shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
              >
                <div className="relative h-56 overflow-hidden">
                  <SmartImage
                    src={service.image}
                    alt={service.name}
                    locationName={service.location}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm text-[10px] font-bold text-ink uppercase tracking-widest shadow-sm border border-hairline">
                    {service.category}
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold">
                    <Star size={12} className="text-white fill-white" />
                    {service.rating}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1 text-muted text-[10px] font-bold uppercase tracking-wider mb-1">
                      <MapPin size={10} />
                      {service.location}
                    </div>
                    <h3 className="text-xl font-display font-bold text-ink group-hover:text-orange-500 transition-colors">
                      {service.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                    <div>
                      <span className="text-xs text-muted block font-bold uppercase tracking-tighter">Starting from</span>
                      <span className="text-2xl font-display font-bold text-ink">${service.price}</span>
                    </div>
                    <button
                      onClick={() => saveItem({ ...service, type: 'Service' })}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                      <Plus size={18} />
                      <span>Add to Trip</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-hairline">
            <Filter size={48} className="mx-auto text-zinc-200 mb-4" />
            <h3 className="text-xl font-bold text-ink">No services found</h3>
            <p className="text-body">Try adjusting your filters or search query.</p>
            <button 
              onClick={() => {
                setSelectedCategories(['All']);
                setSearchQuery('');
              }}
              className="mt-6 text-orange-500 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

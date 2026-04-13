import React from 'react';
import { Star, ChevronDown, X, Clock, MapPin, Bed, Utensils, Plane, Camera } from 'lucide-react';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['Hotel', 'Restaurant', 'Transport', 'Activity'];
const RATINGS = [5, 4, 3, 2, 1];
const DURATIONS = ['1-3 Days', '4-7 Days', '8-14 Days', '14+ Days'];
const LOCATIONS = ['Paris', 'Tokyo', 'New York', 'London', 'Rome', 'Bali'];

export default function FilterBar() {
  const { filters, setFilters, sortBy, setSortBy } = useApp();

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      activities: prev.activities.includes(category)
        ? prev.activities.filter(a => a !== category)
        : [...prev.activities, category]
    }));
  };

  const handlePriceChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => {
      const newRange = [...prev.priceRange] as [number, number];
      newRange[index] = numValue;
      return { ...prev, priceRange: newRange };
    });
  };

  const removeFilter = (type: string, value?: string) => {
    setFilters(prev => {
      switch (type) {
        case 'minStars': return { ...prev, minStars: 0 };
        case 'activity': return { ...prev, activities: prev.activities.filter(a => a !== value) };
        case 'hotelType': return { ...prev, hotelTypes: prev.hotelTypes.filter(t => t !== value) };
        case 'duration': return { ...prev, duration: null };
        case 'location': return { ...prev, location: null };
        default: return prev;
      }
    });
  };

  const activeFiltersCount = 
    (filters.minStars > 0 ? 1 : 0) + 
    filters.activities.length + 
    (filters.duration ? 1 : 0) + 
    (filters.location ? 1 : 0);

  return (
    <div className="w-full space-y-4 py-2 text-zinc-900">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar px-2">
        {/* Sort Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-sm font-bold text-[#0A192F] hover:border-orange-500 transition-all whitespace-nowrap">
            Sort: {sortBy}
            <ChevronDown size={16} />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {['Most Liked', 'Highest Rated', 'Price: Low to High'].map(option => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors ${sortBy === option ? 'text-orange-500 font-bold' : 'text-zinc-600'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Stars Filter */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-sm font-bold text-[#0A192F] hover:border-orange-500 transition-all whitespace-nowrap">
            Rating
            <Star size={16} className={filters.minStars > 0 ? 'fill-orange-500 text-orange-500' : ''} />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button
              onClick={() => setFilters(prev => ({ ...prev, minStars: 0 }))}
              className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 text-zinc-600"
            >
              All Ratings
            </button>
            {RATINGS.map(star => (
              <button
                key={star}
                onClick={() => setFilters(prev => ({ ...prev, minStars: star }))}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 flex items-center gap-2 ${filters.minStars === star ? 'text-orange-500 font-bold' : 'text-zinc-600'}`}
              >
                {star} Stars & Up
                <div className="flex">
                  {[...Array(star)].map((_, i) => (
                    <Star key={i} size={12} className="fill-orange-500 text-orange-500" />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration Filter */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-sm font-bold text-[#0A192F] hover:border-orange-500 transition-all whitespace-nowrap">
            Duration
            <Clock size={16} className={filters.duration ? 'text-orange-500' : ''} />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => setFilters(prev => ({ ...prev, duration: d }))}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors ${filters.duration === d ? 'text-orange-500 font-bold' : 'text-zinc-600'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-sm font-bold text-[#0A192F] hover:border-orange-500 transition-all whitespace-nowrap">
            City/Local
            <MapPin size={16} className={filters.location ? 'text-orange-500' : ''} />
          </button>
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {LOCATIONS.map(l => (
              <button
                key={l}
                onClick={() => setFilters(prev => ({ ...prev, location: l }))}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors ${filters.location === l ? 'text-orange-500 font-bold' : 'text-zinc-600'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Hotel Type Removed - Rolled into Global Categories */}

        {/* Price Range Filter */}
        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-full px-4 py-1.5 whitespace-nowrap">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Price</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0] || ''}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              className="w-12 bg-transparent border-none text-sm font-bold text-[#0A192F] focus:ring-0 p-0"
            />
            <span className="text-zinc-300">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1] || ''}
              onChange={(e) => handlePriceChange(1, e.target.value)}
              className="w-12 bg-transparent border-none text-sm font-bold text-[#0A192F] focus:ring-0 p-0"
            />
          </div>
        </div>
      </div>

      {/* Customizable Filter Chips */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 px-2"
          >
            {filters.minStars > 0 && (
              <FilterChip label={`${filters.minStars} Stars & Up`} onRemove={() => removeFilter('minStars')} />
            )}
            {filters.activities.map(a => (
              <FilterChip key={a} label={a} onRemove={() => removeFilter('activity', a)} />
            ))}
            {filters.hotelTypes.map(t => (
              <FilterChip key={t} label={t} onRemove={() => removeFilter('hotelType', t)} />
            ))}
            {filters.duration && (
              <FilterChip label={filters.duration} onRemove={() => removeFilter('duration')} />
            )}
            {filters.location && (
              <FilterChip label={filters.location} onRemove={() => removeFilter('location')} />
            )}
            <button 
              onClick={() => setFilters({
                minStars: 0,
                activities: [],
                hotelTypes: [],
                priceRange: [0, 5000],
                duration: null,
                location: null
              })}
              className="text-xs font-bold text-orange-500 hover:underline px-2"
            >
              Clear All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Absolute Categories Enforced */}
      <div className="flex flex-wrap gap-2 px-2 pb-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest self-center mr-2">Module Categories:</span>
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              filters.activities.includes(category)
                ? 'bg-[#0A192F] border-[#0A192F] text-orange-500 shadow-md scale-[1.02]'
                : 'bg-white border-zinc-200 text-[#0A192F] hover:border-orange-500 shadow-sm'
            }`}
          >
            {category === 'Hotel' && <Bed size={14} className={filters.activities.includes(category) ? 'text-orange-500' : 'text-zinc-400'}/>}
            {category === 'Restaurant' && <Utensils size={14} className={filters.activities.includes(category) ? 'text-orange-500' : 'text-zinc-400'}/>}
            {category === 'Transport' && <Plane size={14} className={filters.activities.includes(category) ? 'text-orange-500' : 'text-zinc-400'}/>}
            {category === 'Activity' && <Camera size={14} className={filters.activities.includes(category) ? 'text-orange-500' : 'text-zinc-400'}/>}
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void; key?: React.Key }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold"
    >
      {label}
      <button onClick={onRemove} className="hover:text-[#0A192F] transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

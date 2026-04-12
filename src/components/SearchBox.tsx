import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ExternalLink, X } from 'lucide-react';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface SearchBoxProps {
  placeholder: string;
  context?: string;
  onSelect: (result: SearchResult) => void;
  className?: string;
}

export default function SearchBox({ placeholder, context, onSelect, className = "" }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
  const CX = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setShowDropdown(true);

    try {
      const searchQuery = context ? `${val} ${context}` : val;
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data.items) {
        setResults(data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet
        })));
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-4 rounded-2xl bg-zinc-100 border border-zinc-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-zinc-800 placeholder:text-zinc-400"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 animate-spin" size={18} />
        )}
        {!isLoading && query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (results.length > 0 || isLoading) && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-orange-500" size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Searching Real-World Data...</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {results.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left p-4 hover:bg-zinc-50 transition-colors group flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-800 group-hover:text-orange-600 transition-colors line-clamp-1">
                      {result.title}
                    </span>
                    <ExternalLink size={14} className="text-zinc-300 group-hover:text-orange-400" />
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {result.snippet}
                  </p>
                  <span className="text-[10px] text-zinc-400 truncate mt-1">
                    {result.link}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

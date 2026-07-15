import React, { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon, Loader2, MapPin } from 'lucide-react';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  coordinates?: { lat: number; lng: number };
  photoUrl?: string;
  placeId?: string;
}

interface SearchBoxProps {
  placeholder: string;
  context?: string; // Used strictly for UI labeling if needed
  onSelect: (result: SearchResult) => void;
  className?: string;
  types?: string[];
  inputClassName?: string;
}

export default function SearchBox({ placeholder, context, onSelect, className = "", types, inputClassName = "" }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [isReady, setIsReady] = useState(false);

  // Keep the latest onSelect in a ref so the setup effect can run once on mount.
  // Depending on onSelect directly rebuilt the Autocomplete on every parent
  // render (onSelect is usually an inline arrow), leaking listeners/instances.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key is missing. Places Autocomplete cannot load.');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setIsReady(true);
        const win = window as any;
        if (autocompleteRef.current) return; // already initialised — don't rebuild
        if (inputRef.current && win.google && win.google.maps && win.google.maps.places) {
          autocompleteRef.current = new win.google.maps.places.Autocomplete(inputRef.current, {
            fields: ['name', 'geometry', 'photos', 'url', 'place_id', 'formatted_address'],
            types: types,
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (!place.geometry || !place.geometry.location) {
              return;
            }

            // Extract high-res photo if available
            let photoUrl = '';
            if (place.photos && place.photos.length > 0) {
              photoUrl = place.photos[0].getUrl({ maxWidth: 1200 });
            }

            const result: SearchResult = {
              title: place.name || place.formatted_address || '',
              link: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
              snippet: place.formatted_address || '',
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              photoUrl: photoUrl,
              placeId: place.place_id
            };

            onSelectRef.current(result);
            if (inputRef.current) inputRef.current.value = '';
          });
        }
      })
      .catch((err) => console.error(err));
    // Runs once on mount; onSelect is read via ref to avoid rebuilding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
      <input
        ref={inputRef}
        type="text"
        placeholder={isReady ? placeholder : "Loading Maps SDK..."}
        disabled={!isReady}
        className={`w-full pl-12 pr-10 py-4 rounded-2xl bg-zinc-100 border border-zinc-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-zinc-800 placeholder:text-zinc-400 disabled:opacity-50 ${inputClassName}`}
      />
      {!isReady && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 animate-spin" size={18} />
      )}
    </div>
  );
}

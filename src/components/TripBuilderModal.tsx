import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Map as MapIcon,
  Bed,
  Car,
  Plane,
  Bike,
  Camera,
  Sparkles,
  Plus,
  Navigation,
  ChevronRight,
  ExternalLink,
  Trash2,
  Copy,
  Utensils,
  MapPin,
  ImagePlus,
  AlertCircle
} from 'lucide-react';
import SmartImage from './SmartImage';
import SearchBox from './SearchBox';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';
import { useApp } from '../AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

interface TripBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful save so the parent can refresh its trip list. */
  onSaved?: () => void;
  /** If provided, opens in edit mode with this trip pre-loaded */
  editTrip?: {
    id: string;
    destination: string;
    isBudgetPublic?: boolean;
    spots: Array<{
      day_number: number;
      title: string;
      description: string;
      category: 'Transport' | 'Stay' | 'Dining' | 'Activity';
      image_url: string | null;
      image_urls?: string[] | null;
      link_url: string | null;
      lat?: number | null;
      lng?: number | null;
    }>;
  } | null;
}

type TransportMode = 'Rental' | 'Flights' | 'Own';

interface RouteItem {
  id: string;
  title: string;
  link: string;
  type: 'hotel' | 'transport' | 'activity' | 'dining';
  coordinates?: { lat: number; lng: number };
  description?: string;
}

interface TripState {
  transportMode: TransportMode;
  budget: number;
  routeSummary: RouteItem[];
  destination: string;
  dayTitle: string;
  images: string[];
}

const EXPERT_ITINERARIES = [
  {
    destination: 'Nashville, TN',
    dayTitle: 'Day 1: Music City Arrival',
    routeSummary: [
      { id: 'e1', title: 'Nashville International Airport', link: 'https://flynashville.com/', type: 'transport' as const },
      { id: 'e2', title: 'The Hermitage Hotel', link: 'https://www.thehermitagehotel.com/', type: 'hotel' as const },
      { id: 'e3', title: 'Broadway Honky Tonk Central', link: 'https://honkytonkcentral.com/', type: 'activity' as const },
      { id: 'e4', title: 'Hattie B\'s Hot Chicken', link: 'https://hattiebs.com/', type: 'dining' as const },
    ],
    budget: 1500,
    transportMode: 'Rental' as const,
    images: ['https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=800&q=80']
  }
];

export default function TripBuilderModal({ isOpen, onClose, onSaved, editTrip }: TripBuilderModalProps) {
  interface DayState {
    id: string;
    title: string;
    transportMode: TransportMode;
    transportDetails: string;
    budget: number;
    routeSummary: RouteItem[];
    images: string[];
    categoryImages?: Record<string, string[]>;
    categoryCosts?: Record<string, number>;
    stayCategory?: 'Hotel' | 'Villa' | 'Airbnb';
  }

  const createEmptyDay = (index: number): DayState => ({
    id: `day-${index + 1}`,
    title: `Day ${index + 1}`,
    transportMode: 'Rental',
    transportDetails: '',
    budget: 0,
    routeSummary: [],
    images: [],
    categoryImages: {},
    categoryCosts: {},
    stayCategory: 'Hotel'
  });

  const { session } = useAuth();
  const { setGlobalToast } = useApp();

  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isBudgetPublic, setIsBudgetPublic] = useState(false);
  const [days, setDays] = useState<DayState[]>([createEmptyDay(0)]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [manualTransport, setManualTransport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const destinationInputRef = useRef<HTMLInputElement>(null);

  const changeDayIndex = (idx: number) => {
    setCurrentDayIndex(idx);
    setShowManualEntry(null);
    setManualItem({ title: '', link: '' });
    setManualTransport('');
  };

  const handleDeleteDay = (idxToDelete: number) => {
    if (idxToDelete === 0) return; // Cannot delete Day 1

    const confirmed = window.confirm(
      `Delete Day ${idxToDelete + 1} and everything on it (stops, photos, costs)? This can't be undone.`
    );
    if (!confirmed) return;

    setDays(prev => {
      const filtered = prev.filter((_, i) => i !== idxToDelete);
      // Renumber day titles and IDs
      return filtered.map((day, i) => ({
        ...day,
        title: `Day ${i + 1}`,
        id: `day-${i + 1}`
      }));
    });

    // Handle active day index change
    if (currentDayIndex >= idxToDelete) {
      changeDayIndex(Math.max(0, currentDayIndex - 1));
    } else {
      changeDayIndex(currentDayIndex);
    }
  };

  // Load Google Maps Places script dynamically on mount using VITE_GOOGLE_MAPS_API_KEY
  // Also seed edit data when opening in edit mode
  useEffect(() => {
    if (isOpen) {
      if (editTrip) {
        // Pre-populate from saved trip data
        setDestination(editTrip.destination);
        setDestinationCoords(null); // re-geocoded from the destination string on save
        setIsBudgetPublic(editTrip.isBudgetPublic ?? false);
        // Build days from spots grouped by day_number
        const byDay: Record<number, typeof editTrip.spots> = {};
        editTrip.spots.forEach(s => {
          if (!byDay[s.day_number]) byDay[s.day_number] = [];
          byDay[s.day_number].push(s);
        });
        const sortedDayNums = Object.keys(byDay).map(Number).sort((a, b) => a - b);
        const builtDays: DayState[] = sortedDayNums.map((dayNum, idx) => {
          const daySpots = byDay[dayNum];
          const catTypeMap: Record<string, RouteItem['type']> = {
            Transport: 'transport', Stay: 'hotel', Dining: 'dining', Activity: 'activity'
          };
          const routeSummary: RouteItem[] = daySpots.map((s, si) => ({
            id: `edit-${dayNum}-${si}`,
            title: s.title,
            link: s.link_url || '',
            type: catTypeMap[s.category] || 'activity',
            description: s.description,
            coordinates: (s.lat != null && s.lng != null)
              ? { lat: Number(s.lat), lng: Number(s.lng) }
              : undefined
          }));
          const categoryImages: Record<string, string[]> = {};
          daySpots.forEach(s => {
            const key = catTypeMap[s.category] || 'activity';
            if (Array.isArray(s.image_urls) && s.image_urls.length > 0) {
              categoryImages[key] = [...(categoryImages[key] || []), ...s.image_urls];
            } else if (s.image_url) {
              if (!categoryImages[key]) categoryImages[key] = [];
              categoryImages[key].push(s.image_url);
            }
          });
          const transportSpot = daySpots.find(s => s.category === 'Transport');
          return {
            id: `day-${idx + 1}`,
            title: `Day ${idx + 1}`,
            transportMode: 'Rental' as TransportMode,
            transportDetails: transportSpot?.description || '',
            budget: 0,
            routeSummary,
            images: [],
            categoryImages,
            categoryCosts: {},
            stayCategory: 'Hotel' as const
          };
        });
        setDays(builtDays.length > 0 ? builtDays : [createEmptyDay(0)]);
        setCurrentDayIndex(0);
      } else {
        // Fresh mode — reset everything
        setDestination('');
        setDestinationCoords(null);
        setIsBudgetPublic(false);
        setDays([createEmptyDay(0)]);
        setCurrentDayIndex(0);
        setError(null);
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        loadGoogleMapsScript(apiKey).then(() => {
          const win = window as any;
          if (destinationInputRef.current && win.google && win.google.maps && win.google.maps.places) {
            const destAutocomplete = new win.google.maps.places.Autocomplete(destinationInputRef.current, {
              types: ['geocode', 'establishment'],
              fields: ['name', 'formatted_address', 'geometry']
            });
            destAutocomplete.addListener('place_changed', () => {
              const place = destAutocomplete.getPlace();
              const placeName = place.name || place.formatted_address || '';
              setDestination(placeName);
              if (place.geometry && place.geometry.location) {
                setDestinationCoords({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                });
              }
            });
          }
        }).catch((err) =>
          console.error("Error loading Google Maps in TripBuilderModal:", err)
        );
      }
    }
  }, [isOpen, editTrip?.id]);

  const activeDay = days[currentDayIndex];

  const updateActiveDay = (updater: (prev: DayState) => DayState) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[currentDayIndex] = updater(newDays[currentDayIndex]);
      return newDays;
    });
  };

  const contextFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${session?.user?.id || 'anon'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${session?.user?.id || 'anon'}/${fileName}`;

    console.log(`[Storage Upload] Attempting upload to trip-images. File path: ${filePath}, type: ${file.type}, size: ${file.size}`);

    const { error: uploadError } = await supabase.storage
      .from('trip-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("[Storage Upload Error] Detailed Supabase error:", {
        message: uploadError.message,
        name: uploadError.name,
        status: (uploadError as any).status,
        statusCode: (uploadError as any).statusCode,
        error: uploadError
      });
      throw uploadError;
    }

    const { data } = supabase.storage.from('trip-images').getPublicUrl(filePath);
    console.log(`[Storage Upload Success] Generated public URL: ${data.publicUrl}`);
    return data.publicUrl;
  };

  const handleContextImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && uploadCategory) {
      const category = uploadCategory;
      setIsSaving(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          try {
            return await uploadFile(file);
          } catch (err) {
            console.error("Supabase upload failed, falling back to base64:", err);
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }
        });
        const newUrls = await Promise.all(uploadPromises);
        updateActiveDay(prev => {
          const existingUrls = (prev.categoryImages || {})[category] || [];
          return {
            ...prev,
            categoryImages: {
              ...(prev.categoryImages || {}),
              [category]: [...existingUrls, ...newUrls]
            }
          };
        });
      } catch (err) {
        console.error("Failed uploading images:", err);
        setError("Failed to upload images. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
    if (contextFileInputRef.current) contextFileInputRef.current.value = '';
    setUploadCategory(null);
  };

  const removeCategoryImage = (category: string, idx: number) => {
    updateActiveDay(prev => {
      const existing = (prev.categoryImages || {})[category] || [];
      const updated = existing.filter((_, i) => i !== idx);
      return {
        ...prev,
        categoryImages: { ...(prev.categoryImages || {}), [category]: updated }
      };
    });
  };

  const handleCostChange = (category: string, val: string) => {
    updateActiveDay(prev => ({
      ...prev,
      categoryCosts: { ...(prev.categoryCosts || {}), [category]: parseFloat(val) || 0 }
    }));
  };

  const addRouteItem = (title: string, link: string, type: RouteItem['type'], coordinates?: { lat: number, lng: number }, photoUrl?: string, description?: string) => {
    const newItem: RouteItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      link,
      type,
      coordinates,
      description
    };

    updateActiveDay(prev => ({
      ...prev,
      routeSummary: [...prev.routeSummary, newItem]
    }));
  };

  const removeRouteItem = (dayIndex: number, itemId: string) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        routeSummary: newDays[dayIndex].routeSummary.filter(item => item.id !== itemId)
      };
      return newDays;
    });
  };

  const handleRemix = () => {
    const hasWork = destination.trim() !== '' ||
      days.some(d => d.routeSummary.length > 0 || (d.transportDetails && d.transportDetails.trim()));
    if (hasWork) {
      const confirmed = window.confirm(
        'Load an expert itinerary? This replaces the destination and everything you\'ve entered so far.'
      );
      if (!confirmed) return;
    }

    const randomItinerary = EXPERT_ITINERARIES[Math.floor(Math.random() * EXPERT_ITINERARIES.length)];
    setDestination(randomItinerary.destination);
    setDays([{
      id: 'day-1',
      title: randomItinerary.dayTitle,
      transportMode: randomItinerary.transportMode,
      transportDetails: '',
      budget: randomItinerary.budget,
      routeSummary: [...randomItinerary.routeSummary],
      images: [...randomItinerary.images]
    }]);
    setCurrentDayIndex(0);
  };

  // Resolve a destination string to coordinates via the Maps JS Geocoder.
  // Returns null if Maps isn't loaded or the address can't be resolved.
  const geocodeDestination = (address: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      const win = window as any;
      if (!win.google || !win.google.maps || !win.google.maps.Geocoder) {
        resolve(null);
        return;
      }
      try {
        const geocoder = new win.google.maps.Geocoder();
        geocoder.geocode({ address }, (results: any, status: string) => {
          if (status === 'OK' && results && results[0] && results[0].geometry?.location) {
            const loc = results[0].geometry.location;
            resolve({ lat: loc.lat(), lng: loc.lng() });
          } else {
            resolve(null);
          }
        });
      } catch {
        resolve(null);
      }
    });
  };

  const handleFinishTrip = async () => {
    if (isSaving) return;
    setError(null);
    console.log("handleFinishTrip called. User session ID:", session?.user?.id);
    
    if (!session?.user?.id) {
      setError("User is not authenticated. Please log in.");
      console.error("Save failed: User is not authenticated.");
      return;
    }
    
    if (!destination) {
      setError("Please enter a destination at the top before finishing.");
      console.error("Save failed: Destination is empty.");
      return;
    }

    // Find the first high-res photo loaded in any day's category to use as Cover Photo
    let coverPhoto = 'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=800&q=80';
    for (const day of days) {
      if (day.images && day.images.length > 0) { coverPhoto = day.images[0]; break; }
      if (day.categoryImages) {
        const allArrays = Object.values(day.categoryImages) as string[][];
        const firstImg = allArrays.flat()[0];
        if (firstImg) { coverPhoto = firstImg; break; }
      }
    }

    // Geocode the destination so trips carry coordinates for location-based
    // discovery. Prefer coords captured from the autocomplete selection; fall
    // back to geocoding the typed/edited destination string.
    const destCoords = destinationCoords || await geocodeDestination(destination);

    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
    
    if (isMockMode) {
      console.log("Mock mode detected. Saving trip directly to localStorage...");
      setIsSaving(true);
      try {
        const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
        const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];

        const spots: any[] = [];
        days.forEach((day, idx) => {
          const dayNum = idx + 1;
          const categoryMap: Record<string, 'Transport' | 'Stay' | 'Dining' | 'Activity'> = {
            transport: 'Transport',
            hotel: 'Stay',
            dining: 'Dining',
            activity: 'Activity'
          };

          // Synthesize a transport spot only when the user actually entered transport
          // details (transportMode defaults to 'Rental', so it can't signal intent).
          const hasTransportItem = day.routeSummary.some(item => item.type === 'transport');
          if (!hasTransportItem && day.transportDetails && day.transportDetails.trim()) {
            const cost = day.categoryCosts?.['transport'];
            const modeLabel = day.transportMode === 'Rental' ? 'Rental Car' : day.transportMode === 'Flights' ? 'Flight' : 'Own Vehicle';
            let desc = day.transportDetails || `Traveling by ${modeLabel}.`;
            if (cost !== undefined && cost > 0) desc += ` Cost: $${cost}.`;
            const imgs = day.categoryImages?.['transport'] || [];
            spots.push({
              id: `transport-${dayNum}-auto`,
              day_number: dayNum,
              title: modeLabel,
              description: desc,
              category: 'Transport',
              image_url: imgs[0] || null,
              image_urls: imgs,
              link_url: null
            });
          }

          day.routeSummary.forEach(item => {
            const cost = day.categoryCosts?.[item.type];
            let description = item.description || `Details for ${item.title}.`;
            if (cost !== undefined && cost > 0) description += ` Cost: $${cost}.`;
            const imgs = day.categoryImages?.[item.type] || [];
            spots.push({
              id: item.id,
              day_number: dayNum,
              title: item.title,
              description,
              category: categoryMap[item.type],
              image_url: imgs[0] || null,
              image_urls: imgs,
              link_url: item.link
            });
          });

          // Ensure uploaded photos are never lost: persist an image-only spot for
          // any pillar that has images but no named place added.
          const coveredCats = new Set<string>(day.routeSummary.map(i => i.type));
          if (!hasTransportItem && day.transportDetails && day.transportDetails.trim()) coveredCats.add('transport');
          Object.keys(day.categoryImages || {}).forEach(catKey => {
            const imgs2 = day.categoryImages?.[catKey] || [];
            if (imgs2.length > 0 && !coveredCats.has(catKey) && categoryMap[catKey]) {
              spots.push({
                id: `${catKey}-${dayNum}-photos`,
                day_number: dayNum,
                title: categoryMap[catKey],
                description: '',
                category: categoryMap[catKey],
                image_url: imgs2[0] || null,
                image_urls: imgs2,
                link_url: null
              });
            }
          });
        });

        if (editTrip?.id) {
          // Update the existing local trip in place instead of duplicating it.
          const idx = customTrips.findIndex((t: any) => t.id === editTrip.id);
          const updatedTrip = {
            id: editTrip.id,
            year: new Date().getFullYear().toString(),
            country: destination,
            image: coverPhoto,
            base_price: totalBudget,
            is_budget_public: isBudgetPublic,
            lat: destCoords?.lat ?? null,
            lng: destCoords?.lng ?? null,
            spots
          };
          if (idx >= 0) customTrips[idx] = updatedTrip;
          else customTrips.push(updatedTrip);
        } else {
          const newTrip = {
            id: `custom-${Date.now()}`,
            year: new Date().getFullYear().toString(),
            country: destination,
            image: coverPhoto,
            base_price: totalBudget,
            is_budget_public: isBudgetPublic,
            lat: destCoords?.lat ?? null,
            lng: destCoords?.lng ?? null,
            spots
          };
          customTrips.push(newTrip);
        }
        localStorage.setItem('venturesocial_custom_trips', JSON.stringify(customTrips));
        setIsSaving(false);
        setGlobalToast(editTrip?.id ? 'Trip updated!' : 'Trip saved!');
        onClose();
        onSaved?.();
      } catch (err: any) {
        console.error("Local storage save failed:", err);
        setError("Failed to save trip locally: " + err.message);
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      // Ensure user profile exists in profiles table before inserting posts (satisfies posts_profile_fkey)
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
          
        if (profileError || !profile) {
          console.log("Profile not found in DB. Proactively creating a profile record...");
          const safeName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Explorer';
          const uniqueUsername = `${safeName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.random().toString(36).substr(2, 5)}`;
          
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              full_name: safeName,
              username: uniqueUsername,
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'
            });
            
          if (insertProfileError) {
            console.warn("Proactive profile insertion failed (might already exist or permission restricted):", insertProfileError);
          } else {
            console.log("Proactive profile insertion succeeded.");
          }
        }
      } catch (profileCheckErr) {
        console.warn("Exception during proactive profile check/insert:", profileCheckErr);
      }

      const isEditing = !!editTrip?.id;
      let postId: string;

      if (isEditing) {
        // Update the existing trip in place instead of inserting a duplicate.
        // is_private and category are intentionally left untouched so editing a
        // shared trip does not silently revert its privacy.
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            location_name: destination,
            base_price: totalBudget,
            is_budget_public: isBudgetPublic,
            lat: destCoords?.lat ?? null,
            lng: destCoords?.lng ?? null,
          })
          .eq('id', editTrip!.id);

        if (updateError) {
          console.error("Posts Update Error Object:", updateError);
          throw new Error(`Failed to update trip post: ${updateError.message} (Code: ${updateError.code})`);
        }
        postId = editTrip!.id;

        // Replace existing spots so repeated edits don't accumulate duplicates.
        const { error: deleteError } = await supabase
          .from('trip_spots')
          .delete()
          .eq('post_id', postId);

        if (deleteError) {
          console.error("Trip Spots Delete Error Object:", deleteError);
          throw new Error(`Failed to update trip spots: ${deleteError.message} (Code: ${deleteError.code})`);
        }
      } else {
        const postInsertData = {
          user_id: session.user.id,
          location_name: destination,
          caption: `My Custom Trip to ${destination}`,
          category: 'Activity', // Required NOT NULL column in posts schema
          base_price: totalBudget,
          is_private: true, // Created trips are private/drafts by default, shared via PublishModal later
          is_budget_public: isBudgetPublic,
          lat: destCoords?.lat ?? null,
          lng: destCoords?.lng ?? null
        };

        console.log("Inserting post into Supabase:", postInsertData);

        const { data, error } = await supabase.from('posts').insert(postInsertData).select().single();

        if (error) {
          console.error("Posts Insert Error Object:", error);
          throw new Error(`Failed to insert trip post: ${error.message} (Code: ${error.code})`);
        }
        postId = data.id;
      }

      const spotsToInsert: any[] = [];
      days.forEach((day, idx) => {
        const dayNum = idx + 1;
        const categoryMap: Record<string, 'Transport' | 'Stay' | 'Dining' | 'Activity'> = {
          transport: 'Transport',
          hotel: 'Stay',
          dining: 'Dining',
          activity: 'Activity'
        };

        // Synthesize a transport spot only when the user actually entered transport
        // details (transportMode defaults to 'Rental', so it can't signal intent).
        const hasTransportItem = day.routeSummary.some(item => item.type === 'transport');
        if (!hasTransportItem && day.transportDetails && day.transportDetails.trim()) {
          const cost = day.categoryCosts?.['transport'];
          const modeLabel = day.transportMode === 'Rental' ? 'Rental Car' : day.transportMode === 'Flights' ? 'Flight' : 'Own Vehicle';
          let desc = day.transportDetails || `Traveling by ${modeLabel}.`;
          if (cost !== undefined && cost > 0) desc += ` Cost: $${cost}.`;
          const imgs = day.categoryImages?.['transport'] || [];
          spotsToInsert.push({
            post_id: postId,
            day_number: dayNum,
            title: modeLabel,
            description: desc,
            category: 'Transport',
            image_url: imgs[0] || null,
            image_urls: imgs.length > 0 ? imgs : null,
            link_url: null,
            lat: null,
            lng: null,
            location_coords: null
          });
        }

        day.routeSummary.forEach(item => {
          const cost = day.categoryCosts?.[item.type];
          let description = item.description || `Details for ${item.title}.`;
          if (cost !== undefined && cost > 0) description += ` Cost: $${cost}.`;
          const imgs = day.categoryImages?.[item.type] || [];
          spotsToInsert.push({
            post_id: postId,
            day_number: dayNum,
            title: item.title,
            description,
            category: categoryMap[item.type],
            image_url: imgs[0] || null,
            image_urls: imgs.length > 0 ? imgs : null,
            link_url: item.link,
            lat: item.coordinates ? item.coordinates.lat : null,
            lng: item.coordinates ? item.coordinates.lng : null,
            location_coords: item.coordinates ? `(${item.coordinates.lng},${item.coordinates.lat})` : null
          });
        });

        // Ensure uploaded photos are never lost: for any pillar that has images
        // but no named place added, persist an image-only spot so the photos and
        // the day are saved.
        const coveredCats = new Set<string>(day.routeSummary.map(i => i.type));
        if (!hasTransportItem && day.transportDetails && day.transportDetails.trim()) coveredCats.add('transport');
        Object.keys(day.categoryImages || {}).forEach(catKey => {
          const imgs = day.categoryImages?.[catKey] || [];
          if (imgs.length > 0 && !coveredCats.has(catKey) && categoryMap[catKey]) {
            const cost = day.categoryCosts?.[catKey];
            const description = cost !== undefined && cost > 0 ? `Cost: $${cost}.` : null;
            spotsToInsert.push({
              post_id: postId,
              day_number: dayNum,
              title: categoryMap[catKey],
              description,
              category: categoryMap[catKey],
              image_url: imgs[0] || null,
              image_urls: imgs.length > 0 ? imgs : null,
              link_url: null,
              lat: null,
              lng: null,
              location_coords: null
            });
          }
        });
      });

      if (spotsToInsert.length > 0) {
        console.log("Saving trip spots into Supabase:", spotsToInsert);
        const { error: spotsError } = await supabase.from('trip_spots').insert(spotsToInsert);
        if (spotsError) {
          console.error("Trip Spots Insert Error Object:", spotsError);
          throw new Error(`Failed to save trip spots: ${spotsError.message} (Code: ${spotsError.code})`);
        }
      }
      setIsSaving(false);
      setGlobalToast(isEditing ? 'Trip updated!' : 'Trip saved!');
      onClose();
      onSaved?.();
    } catch (err: any) {
      console.error("handleFinishTrip caught error:", err);
      setError(err.message || "An unexpected error occurred while saving the trip.");
      setIsSaving(false);
    }
  };


  const [showManualEntry, setShowManualEntry] = useState<RouteItem['type'] | null>(null);
  const [manualItem, setManualItem] = useState({ title: '', link: '' });

  const handleManualAdd = (type: RouteItem['type']) => {
    if (!manualItem.title) return;
    addRouteItem(manualItem.title, manualItem.link || '#', type);
    setManualItem({ title: '', link: '' });
    setShowManualEntry(null);
  };

  const getItemizedCost = (day: DayState) => {
    const costs = Object.values(day.categoryCosts || {}) as number[];
    return costs.reduce((a, b) => a + b, 0);
  };

  // A manual "Cost Estimate" (day.budget) overrides the itemized per-pillar costs.
  // The UI flags this when both are present so itemized costs are never silently dropped.
  const getDayCost = (day: DayState) => {
    if (day.budget > 0) return day.budget;
    return getItemizedCost(day);
  };

  const totalBudget = days.reduce((sum, day) => sum + getDayCost(day), 0);
  const allRouteItems = days.flatMap(d => d.routeSummary);

  // ---- Real coordinate route map logic ----
  const itemsWithCoords = allRouteItems.filter(item => item.coordinates);
  const hasEnoughCoords = itemsWithCoords.length >= 2;

  const svgWidth = 400;
  const svgHeight = 300;
  const svgPad = 30;

  const projectCoords = (lat: number, lng: number) => {
    const lats = itemsWithCoords.map(item => item.coordinates!.lat);
    const lngs = itemsWithCoords.map(item => item.coordinates!.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = (maxLat - minLat) || 0.001;
    const lngSpan = (maxLng - minLng) || 0.001;
    const x = svgPad + ((lng - minLng) / lngSpan) * (svgWidth - 2 * svgPad);
    const y = svgHeight - svgPad - ((lat - minLat) / latSpan) * (svgHeight - 2 * svgPad);
    return { x, y };
  };

  const pathD = hasEnoughCoords
    ? itemsWithCoords.map((item, i) => {
        const { x, y } = projectCoords(item.coordinates!.lat, item.coordinates!.lng);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ')
    : '';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <style>{`
            .pac-container {
              z-index: 999999 !important;
            }
          `}</style>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A192F]/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]"
          >
            {/* Left Side: Builder Form (2/3) */}
            <div className="flex-[2] overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar bg-white">
              <div className="flex items-center justify-between">
                <div className="space-y-4 w-full mr-8">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-display font-bold text-[#0A192F]">Trip Builder</h2>
                    <button
                      onClick={handleRemix}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 text-[10px] font-bold uppercase tracking-wider hover:bg-orange-500/20 transition-all border border-orange-500/20"
                    >
                      <Copy size={12} />
                      Remix Expert Itinerary
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <MapPin size={16} />
                    <input
                      ref={destinationInputRef}
                      type="text"
                      placeholder="Enter Destination (e.g. Venice, Italy)"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-[#0A192F] placeholder:text-zinc-300 w-64 md:w-96 places-autocomplete-input"
                    />
                  </div>

                  {/* Day Timeline */}
                  <div className="flex gap-3 overflow-x-auto pb-2 pt-2 custom-scrollbar items-center">
                    {days.map((day, idx) => (
                      <div
                        key={day.id}
                        className="relative flex items-center shrink-0"
                      >
                        <button
                          onClick={() => changeDayIndex(idx)}
                          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap shadow-sm border ${
                            idx > 0 ? 'pr-9' : ''
                          } ${
                            idx === currentDayIndex
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-zinc-400 border-zinc-200 hover:border-orange-500 hover:text-orange-500'
                          }`}
                        >
                          {day.title}
                        </button>
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDay(idx);
                            }}
                            className={`absolute right-2.5 p-0.5 rounded-md text-[10px] font-extrabold transition-all hover:scale-110 flex items-center justify-center ${
                              idx === currentDayIndex
                                ? 'text-white/80 hover:text-white hover:bg-white/10'
                                : 'text-zinc-400 hover:text-rose-500 hover:bg-rose-50'
                            }`}
                            style={{ width: '16px', height: '16px' }}
                            title="Delete Day"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newDaysLength = days.length;
                        setDays(prev => [...prev, createEmptyDay(newDaysLength)]);
                        changeDayIndex(newDaysLength);
                      }}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all whitespace-nowrap flex items-center gap-2 border border-orange-500/10"
                    >
                      <Plus size={16} /> Add Day
                    </button>
                  </div>

                  {/* Day Cost Estimate Input */}
                  <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-2xl w-full max-w-md mt-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[#0A192F] uppercase tracking-wider">
                        {activeDay.title} Cost Estimate
                      </h4>
                      <p className="text-[10px] text-zinc-400">Enter the budget or spent amount for this day</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-sm focus-within:border-orange-500 transition-all">
                      <span className="text-zinc-400 font-bold font-mono text-sm">$</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={activeDay.budget || ''}
                        onChange={(e) => updateActiveDay(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                        className="w-24 bg-transparent border-0 focus:ring-0 p-0 text-right font-mono text-sm font-bold text-[#0A192F]"
                      />
                    </div>
                  </div>
                  {activeDay.budget > 0 && getItemizedCost(activeDay) > 0 && (
                    <p className="text-[11px] font-semibold text-amber-600 mt-2 max-w-md">
                      This manual estimate is overriding your itemized total of ${getItemizedCost(activeDay).toFixed(2)}. Clear this field to use the itemized sum instead.
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-full bg-zinc-100 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all self-start"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Sections (Pillars) */}
              <div className="space-y-12">
                {/* Transport Pillar */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-4">
                    {(activeDay.categoryImages?.['transport'] || []).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {(activeDay.categoryImages!['transport']).map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative w-20 h-20 border-2 border-[#0A192F] overflow-hidden group shadow-md flex-shrink-0" style={{ borderRadius: '6px' }}>
                            <img src={imgUrl} alt="Transport" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeCategoryImage('transport', imgIdx)}
                              className="absolute top-1 right-1 p-1 bg-white text-rose-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[#0A192F]">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 shadow-sm">
                          <Navigation size={20} />
                        </div>
                        <h3 className="font-bold uppercase tracking-widest text-[11px]">Transport Mode</h3>
                      </div>
                      <div className="flex flex-row items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-0.5 border-b-2 border-zinc-200 focus-within:border-[#0A192F] transition-all pb-0.5">
                          <span className="text-zinc-400 font-mono text-[10px]">$</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={activeDay.categoryCosts?.['transport'] || ''}
                            onChange={(e) => handleCostChange('transport', e.target.value)}
                            className="w-12 bg-transparent border-0 focus:ring-0 text-right font-mono text-xs font-bold text-[#0A192F] p-0"
                          />
                        </div>
                        <button
                            onClick={() => { setUploadCategory('transport'); contextFileInputRef.current?.click(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#0A192F] text-[#0A192F] hover:bg-[#0A192F] hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold shadow-sm"
                            style={{ borderRadius: '2px' }}
                          >
                            <ImagePlus size={12} /> {(activeDay.categoryImages?.['transport'] || []).length > 0 ? '+ More Photos' : 'Add Photos'}
                          </button>
                        <button
                          onClick={() => setShowManualEntry(showManualEntry === 'transport' ? null : 'transport')}
                          className="text-[10px] font-bold text-zinc-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
                        >
                          {showManualEntry === 'transport' ? 'Cancel' : 'Add Manually'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showManualEntry === 'transport' ? (
                    <ManualEntryForm
                      value={manualItem}
                      onChange={setManualItem}
                      onAdd={() => handleManualAdd('transport')}
                      placeholder="e.g. Private Shuttle"
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'Rental', icon: Car, label: 'Rental Car' },
                          { id: 'Flights', icon: Plane, label: 'Flight' },
                          { id: 'Own', icon: Bike, label: 'Own Vehicle' }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => updateActiveDay(prev => ({ ...prev, transportMode: mode.id as TransportMode }))}
                            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border ${activeDay.transportMode === mode.id
                                ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-lg'
                                : 'bg-white border-zinc-200 text-zinc-500 hover:border-orange-500'
                              }`}
                          >
                            <mode.icon size={20} />
                            <span className="text-sm">{mode.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder={`Enter ${activeDay.transportMode === 'Rental' ? 'Rental Car' : activeDay.transportMode === 'Flights' ? 'Flight' : 'Own Vehicle'} details, pickup notes, etc...`}
                          value={activeDay.transportDetails}
                          onChange={(e) => updateActiveDay(prev => ({ ...prev, transportDetails: e.target.value }))}
                          className="w-full pl-6 pr-4 py-4 rounded-2xl bg-zinc-100 border border-zinc-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-zinc-800 placeholder:text-zinc-400"
                        />
                        <p className="text-[9px] text-zinc-400 mt-1 ml-2">These details will be auto-saved with your trip — no need to click Add.</p>
                      </div>
                    </>
                  )}
                </section>

                {/* Stay Pillar */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-4">
                    {(activeDay.categoryImages?.['hotel'] || []).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {(activeDay.categoryImages!['hotel']).map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative w-24 h-24 border-2 border-[#0A192F] overflow-hidden group shadow-md flex-shrink-0" style={{ borderRadius: '6px' }}>
                            <img src={imgUrl} alt="Stay" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <button
                              onClick={() => removeCategoryImage('hotel', imgIdx)}
                              className="absolute top-1 right-1 p-1 bg-white text-rose-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[#0A192F]">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 shadow-sm">
                          <Bed size={20} />
                        </div>
                        <h3 className="font-bold uppercase tracking-widest text-[11px]">Stay Details</h3>
                      </div>
                      <div className="flex flex-row items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-0.5 border-b-2 border-zinc-200 focus-within:border-[#0A192F] transition-all pb-0.5">
                          <span className="text-zinc-400 font-mono text-[10px]">$</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={activeDay.categoryCosts?.['hotel'] || ''}
                            onChange={(e) => handleCostChange('hotel', e.target.value)}
                            className="w-12 bg-transparent border-0 focus:ring-0 text-right font-mono text-xs font-bold text-[#0A192F] p-0"
                          />
                        </div>
                        <button
                            onClick={() => { setUploadCategory('hotel'); contextFileInputRef.current?.click(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#0A192F] text-[#0A192F] hover:bg-[#0A192F] hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold shadow-sm"
                            style={{ borderRadius: '2px' }}
                          >
                            <ImagePlus size={12} /> {(activeDay.categoryImages?.['hotel'] || []).length > 0 ? '+ More Photos' : 'Add Photos'}
                          </button>
                        <button
                          onClick={() => setShowManualEntry(showManualEntry === 'hotel' ? null : 'hotel')}
                          className="text-[10px] font-bold text-zinc-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
                        >
                          {showManualEntry === 'hotel' ? 'Cancel' : 'Add Manually'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showManualEntry === 'hotel' ? (
                    <ManualEntryForm
                      value={manualItem}
                      onChange={setManualItem}
                      onAdd={() => handleManualAdd('hotel')}
                      placeholder="e.g. Luxury Villa"
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {['Hotel', 'Villa', 'Airbnb'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => updateActiveDay(prev => ({ ...prev, stayCategory: cat as any }))}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${(activeDay.stayCategory || 'Hotel') === cat
                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-orange-500/30'
                              }`}
                          >
                            {cat}s
                          </button>
                        ))}
                      </div>
                      <SearchBox
                        placeholder={`Search ${(activeDay.stayCategory || 'Hotel')}s, Resorts, or Boutique Stays...`}
                        context={`${(activeDay.stayCategory || 'Hotel').toLowerCase()} in ${destination}`}
                        types={['lodging']}
                        inputClassName="places-autocomplete-input"
                        onSelect={(res) => addRouteItem(res.title, res.link, 'hotel', res.coordinates, res.photoUrl, res.snippet)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {['Luxury', 'Boutique', 'Budget', 'Beachfront', 'Mountain'].map((tag) => (
                          <span key={tag} className="text-[9px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Dining Pillar */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-4">
                    {(activeDay.categoryImages?.['dining'] || []).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {(activeDay.categoryImages!['dining']).map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative w-24 h-24 border-2 border-[#0A192F] overflow-hidden group shadow-md flex-shrink-0" style={{ borderRadius: '6px' }}>
                            <img src={imgUrl} alt="Dining" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <button
                              onClick={() => removeCategoryImage('dining', imgIdx)}
                              className="absolute top-1 right-1 p-1 bg-white text-rose-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[#0A192F]">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 shadow-sm">
                          <Utensils size={20} />
                        </div>
                        <h3 className="font-bold uppercase tracking-widest text-[11px]">Dining</h3>
                      </div>
                      <div className="flex flex-row items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-0.5 border-b-2 border-zinc-200 focus-within:border-[#0A192F] transition-all pb-0.5">
                          <span className="text-zinc-400 font-mono text-[10px]">$</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={activeDay.categoryCosts?.['dining'] || ''}
                            onChange={(e) => handleCostChange('dining', e.target.value)}
                            className="w-12 bg-transparent border-0 focus:ring-0 text-right font-mono text-xs font-bold text-[#0A192F] p-0"
                          />
                        </div>
                        <button
                            onClick={() => { setUploadCategory('dining'); contextFileInputRef.current?.click(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#0A192F] text-[#0A192F] hover:bg-[#0A192F] hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold shadow-sm"
                            style={{ borderRadius: '2px' }}
                          >
                            <ImagePlus size={12} /> {(activeDay.categoryImages?.['dining'] || []).length > 0 ? '+ More Photos' : 'Add Photos'}
                          </button>
                        <button
                          onClick={() => setShowManualEntry(showManualEntry === 'dining' ? null : 'dining')}
                          className="text-[10px] font-bold text-zinc-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
                        >
                          {showManualEntry === 'dining' ? 'Cancel' : 'Add Manually'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showManualEntry === 'dining' ? (
                    <ManualEntryForm
                      value={manualItem}
                      onChange={setManualItem}
                      onAdd={() => handleManualAdd('dining')}
                      placeholder="e.g. Local Bistro"
                    />
                  ) : (
                    <div className="space-y-3">
                      <SearchBox
                        placeholder="Search Restaurants, Cafes, or Bars..."
                        context={`restaurant in ${destination}`}
                        onSelect={(res) => addRouteItem(res.title, res.link, 'dining', res.coordinates, res.photoUrl)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {['Fine Dining', 'Street Food', 'Vegan', 'Seafood', 'Rooftop'].map((tag) => (
                          <span key={tag} className="text-[9px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Activities Pillar */}
                <section className="space-y-6">
                  <div className="flex flex-col gap-4">
                    {(activeDay.categoryImages?.['activity'] || []).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {(activeDay.categoryImages!['activity']).map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative w-24 h-24 border-2 border-[#0A192F] overflow-hidden group shadow-md flex-shrink-0" style={{ borderRadius: '6px' }}>
                            <img src={imgUrl} alt="Activity" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <button
                              onClick={() => removeCategoryImage('activity', imgIdx)}
                              className="absolute top-1 right-1 p-1 bg-white text-rose-500 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[#0A192F]">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 shadow-sm">
                          <Camera size={20} />
                        </div>
                        <h3 className="font-bold uppercase tracking-widest text-[11px]">Activities</h3>
                      </div>
                      <div className="flex flex-row items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-0.5 border-b-2 border-zinc-200 focus-within:border-[#0A192F] transition-all pb-0.5">
                          <span className="text-zinc-400 font-mono text-[10px]">$</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={activeDay.categoryCosts?.['activity'] || ''}
                            onChange={(e) => handleCostChange('activity', e.target.value)}
                            className="w-12 bg-transparent border-0 focus:ring-0 text-right font-mono text-xs font-bold text-[#0A192F] p-0"
                          />
                        </div>
                        <button
                            onClick={() => { setUploadCategory('activity'); contextFileInputRef.current?.click(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#0A192F] text-[#0A192F] hover:bg-[#0A192F] hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold shadow-sm"
                            style={{ borderRadius: '2px' }}
                          >
                            <ImagePlus size={12} /> {(activeDay.categoryImages?.['activity'] || []).length > 0 ? '+ More Photos' : 'Add Photos'}
                          </button>
                        <button
                          onClick={() => setShowManualEntry(showManualEntry === 'activity' ? null : 'activity')}
                          className="text-[10px] font-bold text-zinc-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
                        >
                          {showManualEntry === 'activity' ? 'Cancel' : 'Add Manually'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showManualEntry === 'activity' ? (
                    <ManualEntryForm
                      value={manualItem}
                      onChange={setManualItem}
                      onAdd={() => handleManualAdd('activity')}
                      placeholder="e.g. Sunset Cruise"
                    />
                  ) : (
                    <div className="space-y-3">
                      <SearchBox
                        placeholder="Search Tours, Landmarks, or Experiences..."
                        context={`activity tour in ${destination}`}
                        types={['tourist_attraction', 'establishment']}
                        inputClassName="places-autocomplete-input"
                        onSelect={(res) => addRouteItem(res.title, res.link, 'activity', res.coordinates, res.photoUrl, res.snippet)}
                      />
                      <div className="flex flex-wrap gap-2">
                        {['Museums', 'Hiking', 'Nightlife', 'Shopping', 'Workshops'].map((tag) => (
                          <span key={tag} className="text-[9px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Hidden input for contextual per-pillar category photos — multiple allowed */}
                <input
                  type="file"
                  ref={contextFileInputRef}
                  onChange={handleContextImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {error && (
                <div className="p-4 mb-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-10 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex flex-col items-start pr-6 sm:border-r sm:border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{activeDay.title} Total: <span className="font-mono text-xs font-bold text-[#0A192F]">${getDayCost(activeDay).toFixed(2)}</span></span>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Grand Total: <span className="font-mono text-lg font-extrabold text-orange-600">${totalBudget.toFixed(2)}</span></span>
                  </div>
                  {totalBudget > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-8 h-4 border-2 transition-colors relative flex items-center shrink-0 ${isBudgetPublic ? 'bg-[#0A192F] border-[#0A192F]' : 'bg-transparent border-zinc-300'}`} style={{ borderRadius: '2px' }}>
                        <div className={`absolute w-2 h-2 transition-all ${isBudgetPublic ? 'bg-orange-500 left-[18px]' : 'bg-zinc-400 left-0.5'}`} style={{ borderRadius: '0px' }} />
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isBudgetPublic}
                        onChange={(e) => setIsBudgetPublic(e.target.checked)}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F]">Publicize Budget</span>
                    </label>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const nextIndex = currentDayIndex + 1;
                      if (currentDayIndex === days.length - 1) {
                        setDays(prev => [...prev, createEmptyDay(prev.length)]);
                      }
                      changeDayIndex(nextIndex);
                    }}
                    className="bg-zinc-100 text-[#0A192F] font-bold px-6 py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 group whitespace-nowrap"
                  >
                    {currentDayIndex === days.length - 1 ? 'Save & Add Next Day' : 'Next Day'}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    id="finish-trip-button"
                    onClick={handleFinishTrip}
                    disabled={isSaving}
                    className={`bg-orange-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:bg-orange-600 transition-all flex items-center gap-2 whitespace-nowrap ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Saving...' : 'Finish Trip'}
                    <Sparkles size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Map & Summary (1/3) */}
            <div className="w-full md:w-[400px] bg-zinc-50 relative group overflow-hidden border-l border-zinc-100 flex-shrink-0">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-10 grayscale group-hover:grayscale-0 transition-all duration-1000" />

              <div className="relative z-10 h-full flex flex-col p-8">
                <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-xl border border-zinc-100 mb-8">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                    <MapIcon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A192F] text-sm">Trip Map</h4>
                    <p className="text-[10px] text-zinc-400">Visualizing route in {destination || 'Selected Location'}</p>
                  </div>
                </div>

                {/* Route Visualization */}
                <div className="flex-[0.8] flex flex-col items-center justify-start relative mb-4">
                  <div className="w-full h-[250px] relative">
                    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                      {hasEnoughCoords ? (
                        <>
                          <motion.path
                            d={pathD}
                            fill="none"
                            stroke="#F97316"
                            strokeWidth="3"
                            strokeDasharray="6 6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                          {itemsWithCoords.map((item, i) => {
                            const { x, y } = projectCoords(item.coordinates!.lat, item.coordinates!.lng);
                            return (
                              <g key={item.id}>
                                <circle cx={x} cy={y} r="5" fill={i === 0 ? '#F97316' : '#CBD5E1'} stroke="#fff" strokeWidth="2" />
                                <text x={x + 8} y={y + 3} fontSize="8" fill="#0A192F" fontWeight="bold">{item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title}</text>
                              </g>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <motion.path
                            d="M 100 50 Q 200 100 150 200 T 250 300"
                            fill="none"
                            stroke="#F97316"
                            strokeWidth="3"
                            strokeDasharray="6 6"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                          {allRouteItems.map((_, i) => (
                            <circle
                              key={i}
                              cx={100 + (i * 15)}
                              cy={50 + (i * 40)}
                              r="4"
                              fill={i === 0 ? '#F97316' : '#CBD5E1'}
                              className="shadow-lg"
                            />
                          ))}
                        </>
                      )}
                    </svg>

                    {!hasEnoughCoords && allRouteItems.slice(0, 3).map((item, i) => (
                      <div
                        key={item.id}
                        style={{ top: `${40 + (i * 40)}px`, left: `${80 + (i * 10)}px` }}
                        className="absolute px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-zinc-100 text-[9px] font-bold text-[#0A192F] max-w-[120px] truncate"
                      >
                        {item.title}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-zinc-100 flex flex-col flex-1 min-h-0">
                  <h5 className="font-bold text-[#0A192F] text-[10px] uppercase tracking-widest opacity-60 mb-4 shrink-0">Complete Route Summary</h5>
                  <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
                    {days.map((day, dIdx) => (
                      <div key={day.id} className="mb-6 last:mb-2">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-bold text-orange-500 text-xs uppercase tracking-widest">{day.title}</h6>
                          <span className="text-[10px] font-bold text-zinc-400">${getDayCost(day)}</span>
                        </div>

                        {day.routeSummary.length === 0 ? (
                          <p className="text-[10px] text-zinc-400 italic py-2 pl-2 border-l-2 border-zinc-100">No items added to {day.title} yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {day.routeSummary.map((item, idx) => (
                              <div key={item.id} className="flex items-start justify-between group/item">
                                <div className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full border-2 mt-1 ${item.type === 'hotel' ? 'border-orange-500 bg-orange-500' :
                                        item.type === 'transport' ? 'border-blue-400 bg-blue-400' :
                                          item.type === 'dining' ? 'border-yellow-400 bg-yellow-400' :
                                            'border-emerald-400 bg-emerald-400'
                                      }`} />
                                    {idx !== day.routeSummary.length - 1 && (
                                      <div className="w-0.5 h-6 bg-zinc-100 my-0.5" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-[#0A192F] font-bold line-clamp-1 leading-none mb-1">{item.title}</span>
                                    <span className="text-[9px] text-zinc-400 uppercase tracking-tighter">{item.type}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity">
                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-500">
                                    <ExternalLink size={12} />
                                  </a>
                                  <button onClick={() => removeRouteItem(dIdx, item.id)} className="text-zinc-400 hover:text-rose-500">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ManualEntryForm({ value, onChange, onAdd, placeholder }: {
  value: { title: string, link: string },
  onChange: (val: any) => void,
  onAdd: () => void,
  placeholder: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Name / Title</label>
          <input
            type="text"
            placeholder={placeholder}
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            className="w-full bg-white border-zinc-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Website Link (Optional)</label>
          <input
            type="text"
            placeholder="https://..."
            value={value.link}
            onChange={(e) => onChange({ ...value, link: e.target.value })}
            className="w-full bg-white border-zinc-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
          />
        </div>
      </div>
      <button
        onClick={onAdd}
        className="w-full bg-[#0A192F] text-white font-bold py-3 rounded-xl hover:bg-navy/90 transition-all text-xs uppercase tracking-widest"
      >
        Add to Itinerary
      </button>
    </motion.div>
  );
}

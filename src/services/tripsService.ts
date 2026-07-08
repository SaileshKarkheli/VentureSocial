import { supabase } from '../supabaseClient';
import { mockMyTrips, mockPublicPosts } from '../utils/mockData';

export interface ItineraryItem {
  id: string;
  type: 'Stay' | 'Restaurant' | 'Service';
  name: string;
  link: string;
}

export interface TripDayData {
  id: string;
  day_number: number;
  title: string;
  description: string;
  category: 'Transport' | 'Stay' | 'Dining' | 'Activity';
  image_url?: string;
  link_url?: string;
}

export const tripsService = {
  // Fetch a user's travel history
  async fetchMyTrips(userId: string) {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    if (isMockMode) {
      const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
      const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
      return [...customTrips, ...mockMyTrips];
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          location_name,
          created_at,
          trip_spots ( image_url )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fallbackImage = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';
      return (data || []).map((post: any) => {
        const spotWithImage = Array.isArray(post.trip_spots)
          ? post.trip_spots.find((s: any) => s.image_url)
          : post.trip_spots?.image_url ? post.trip_spots : null;

        return {
          id: post.id,
          year: new Date(post.created_at).getFullYear().toString(),
          country: post.location_name,
          image: spotWithImage?.image_url || fallbackImage
        };
      });
    } catch (err) {
      console.warn("Supabase fetch failed in tripsService, falling back to local mock data:", err);
      const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
      const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
      return [...customTrips, ...mockMyTrips];
    }
  },

  // Fetch detailed info for a single trip
  async fetchTripDetail(tripId: string) {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    
    const getMockFallback = () => {
      const matchedPost = mockPublicPosts.find((p: any) => p.id === tripId || p.tripId === tripId);
      if (matchedPost) {
        const post = {
          id: matchedPost.id,
          location_name: matchedPost.location,
          caption: matchedPost.caption,
          base_price: matchedPost.price || 0,
          profiles: { full_name: matchedPost.user, username: matchedPost.user.toLowerCase().replace(/ /g, '') }
        };
        const spots = matchedPost.images.map((img: any, idx: number) => ({
          id: `spot-${idx}`,
          day_number: img.day,
          title: img.description,
          description: img.activities.join(', '),
          category: idx === 0 ? 'Transport' : (idx === 1 ? 'Stay' : 'Activity'),
          image_url: img.url
        }));
        return { post, spots };
      }

      // Check localStorage custom trips
      const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
      const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
      const matchedCustom = customTrips.find((t: any) => t.id === tripId);
      if (matchedCustom) {
        const post = {
          id: matchedCustom.id,
          location_name: matchedCustom.country,
          caption: `My custom trip to ${matchedCustom.country}`,
          base_price: matchedCustom.base_price || 0,
          profiles: { full_name: 'Alex Explorer', username: 'alex_explorer' }
        };
        // Use the full saved spots array if available (includes image_urls)
        const spots = Array.isArray(matchedCustom.spots) && matchedCustom.spots.length > 0
          ? matchedCustom.spots.map((s: any, idx: number) => ({
              id: s.id || `spot-${idx}`,
              day_number: s.day_number || 1,
              title: s.title || '',
              description: s.description || '',
              category: s.category || 'Activity',
              image_url: s.image_url || null,
              image_urls: s.image_urls || null,
              link_url: s.link_url || null
            }))
          : [{ id: '1', day_number: 1, title: 'Arrival & Setup', description: 'Arrive at destination and settle in.', category: 'Transport', image_url: matchedCustom.image, image_urls: null, link_url: null }];
        return { post, spots };
      }

      // Final default fallback
      const post = {
        id: tripId,
        location_name: 'Kyoto, Japan',
        caption: 'Exploring ancient temples and Ryokans.',
        base_price: 1500,
        profiles: { full_name: 'Alex Explorer', username: 'alex_explorer' }
      };
      const spots = [
        { id: '1', day_number: 1, title: 'Bullet Train to Kyoto', description: 'Smooth ride on the Shinkansen.', category: 'Transport', image_url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80' },
        { id: '2', day_number: 1, title: 'Traditional Ryokan', description: 'Authentic Japanese inn experience.', category: 'Stay', image_url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80' },
        { id: '3', day_number: 2, title: 'Fushimi Inari Shrine', description: 'Walking through the thousand Torii gates.', category: 'Activity', image_url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80' }
      ];
      return { post, spots };
    };

    if (isMockMode) {
      return getMockFallback();
    }

    try {
      const { data: postData, error } = await supabase.from('posts').select('*').eq('id', tripId).single();
      if (error) throw error;

      if (postData) {
        const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', postData.user_id).single();
        const postWithProfile = { ...postData, profiles: profile };
        const { data: spotsData } = await supabase.from('trip_spots').select('*').eq('post_id', tripId).order('day_number');
        return { post: postWithProfile, spots: spotsData || [] };
      }
      throw new Error("No post found with that ID");
    } catch (err) {
      console.warn("Supabase fetch failed in tripsService.fetchTripDetail, trying mock fallback:", err);
      return getMockFallback();
    }
  },

  // Save new custom trip shell from TripBuilderModal
  async createTrip(userId: string, destination: string, totalBudget: number, coverPhoto: string) {
    try {
      const { data, error } = await supabase.from('posts').insert({
        user_id: userId,
        location_name: destination,
        caption: `My Custom Trip to ${destination}`,
        category: 'Activity', // Required NOT NULL column in posts schema
        base_price: totalBudget
      }).select().single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase insert failed in tripsService, saving to localStorage:", err);
      const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
      const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
      const newTrip = {
        id: `custom-${Date.now()}`,
        year: new Date().getFullYear().toString(),
        country: destination,
        image: coverPhoto,
        base_price: totalBudget
      };
      customTrips.push(newTrip);
      localStorage.setItem('venturesocial_custom_trips', JSON.stringify(customTrips));
      return newTrip;
    }
  }
};

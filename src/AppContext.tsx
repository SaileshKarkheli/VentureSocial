import React, { createContext, useContext, useState, useEffect } from 'react';
import { SavedItem, TimelineEvent, Post, User } from './types';
import { supabase } from './supabaseClient';
import { SocialService } from './lib/socialService';
import { mockPublicPosts, mockTravelServices, mockFlights, mockRentalCars, mockMyTrips } from './utils/mockData';



export interface MyTrip {
  id: string;
  year: string;
  country: string;
  image: string;
  availableImages: string[];
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  savedItems: SavedItem[];
  saveItem: (item: any) => void;
  publicPosts: Post[];
  isLoadingFeed: boolean;
  addPublicPost: (post: Post) => void;
  togglePublic: (eventId: string, isPublic: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sortBy: string;
  setSortBy: (sort: string) => void;
  travelServices: TravelService[];
  myTrips: MyTrip[];
  isLoadingTrips: boolean;
  cartItems: Post[];
  addToCart: (post: Post) => void;
  removeFromCart: (postId: string) => void;
  clearCart: () => void;
  flights: FlightOption[];
  rentalCars: RentalCarOption[];
  isLoadingServices: boolean;
  globalToast: string | null;
  setGlobalToast: (msg: string | null) => void;
  followedUsers: string[];
  requestedUsers: string[];
  toggleFollow: (targetId: string, isPrivate: boolean) => Promise<void>;
  userInterestTags: string[];
  addUserInterest: (tag: string) => void;
  customTripSpots: import('./types').PostImage[];
  toggleCustomSpot: (spot: import('./types').PostImage) => void;
  userLikedPosts: string[];
  togglePostLike: (postId: string) => void;
  clearCustomTrip: () => void;
  hasUnreadMessages: boolean;
  setHasUnreadMessages: (has: boolean) => void;
  userLocation: { lat: number, lng: number } | null;
  requestLocation: () => void;
  remixFolders: Record<string, Post[]>;
  addToRemixFolder: (post: Post) => void;
  removeFromRemixFolder: (locationKey: string, postId: string) => void;
  addCustomTrip: (trip: MyTrip) => void;
  isAuthInitializing: boolean;
  activeProfile: any;
  updateActiveProfile: (newData: any) => void;
  currentUserProfile: any;
}

export interface FlightOption {
  id: string;
  airline: string;
  class: string;
  price: number;
  duration: string;
  logo: string;
}

export interface RentalCarOption {
  id: string;
  company: string;
  type: string;
  pricePerDay: number;
  image: string;
}

export interface TravelService {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  location: string;
}

interface FilterState {
  minStars: number;
  activities: string[];
  hotelTypes: string[];
  priceRange: [number, number];
  duration: string | null;
  location: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const isAuthenticated = !!user;

  // Supabase Auth Integration
  useEffect(() => {
    const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
    const mockSessionStr = isMockEnabled ? localStorage.getItem('venturesocial_mock_session') : null;
    if (mockSessionStr) {
      const mockData = JSON.parse(mockSessionStr);
      setUser({
        id: mockData.user.id,
        name: mockData.user.name || 'User',
        email: mockData.user.email || '',
        avatar: mockData.user.avatar || '',
        bio: ''
      });
      setActiveProfile({
        id: mockData.user.id,
        full_name: mockData.user.name || 'Alex Explorer',
        username: mockData.user.email ? mockData.user.email.split('@')[0] : 'alex_explorer'
      });
      setIsAuthInitializing(false);
      return;
    }

    const initializeSession = async (session: any) => {
      try {
        setUser(session?.user ? { id: session.user.id, name: session.user.user_metadata?.name || 'User', email: session.user.email || '', avatar: '', bio: '' } : null);
        if (session?.user) {
          let profData = null;
          try {
            const { data, error: profErr } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profErr) {
              if (profErr.code === 'PGRST116') {
                // PGRST116 indicates NO ROW FOUND. Bootstrapping legacy users who registered before Trigger injection.
                const safeName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Explorer';
                const randomSuffix = Math.floor(Math.random() * 1000);
                
                const newProfile = {
                  id: session.user.id,
                  full_name: safeName,
                  username: `${safeName.toLowerCase().replace(/[^a-z0-9]/g, '')}${randomSuffix}`,
                  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
                };
                
                const { data: fallbackSync, error: insertErr } = await supabase.from('profiles').insert(newProfile).select('*').single();
                if (insertErr) {
                  console.error('Error inserting fallback profile:', insertErr.message);
                  profData = newProfile;
                } else {
                  profData = fallbackSync;
                }
              } else {
                throw profErr;
              }
            } else {
              profData = data;
            }
          } catch (profileError) {
            console.error('Failed to get/bootstrap profile, using local fallback:', profileError);
            const safeName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Explorer';
            profData = {
              id: session.user.id,
              full_name: safeName,
              username: safeName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'explorer',
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
            };
          }

          if (profData) {
            if (!profData.avatar_url) {
              const fallbackAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150';
              try {
                const { data: updatedProf, error: updateErr } = await supabase
                  .from('profiles')
                  .update({ avatar_url: fallbackAvatar })
                  .eq('id', session.user.id)
                  .select('*')
                  .single();
                if (updateErr) {
                  console.error('Error updating fallback avatar:', updateErr.message);
                  setActiveProfile({ ...profData, avatar_url: fallbackAvatar });
                } else {
                  setActiveProfile(updatedProf || { ...profData, avatar_url: fallbackAvatar });
                }
              } catch (updateErr) {
                console.error('Failed to update fallback avatar:', updateErr);
                setActiveProfile({ ...profData, avatar_url: fallbackAvatar });
              }
            } else {
              setActiveProfile(profData);
            }
          }

          try {
            await Promise.all([
              fetchUserFollows(session.user.id).catch(err => console.error("fetchUserFollows failed", err)),
              fetchUserLikesCache(session.user.id).catch(err => console.error("fetchUserLikesCache failed", err))
            ]);
          } catch (err) {
            console.error("Promise.all follows/likes hydration failed", err);
          }
        } else {
          setActiveProfile(null);
        }
      } catch (err) {
        console.error("initializeSession unexpected error:", err);
        if (session?.user) {
          const safeName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Explorer';
          setActiveProfile({
            id: session.user.id,
            full_name: safeName,
            username: safeName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'explorer',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
          });
        }
      } finally {
        setIsAuthInitializing(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      initializeSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      initializeSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserFollows = async (userId: string) => {
    // Relational join to extract the explicit username attached to the following_id, mapped safely via Supabase foreign keys
    const { data, error } = await supabase
      .from('follows')
      .select('profiles!follows_following_id_fkey(username, id)')
      .eq('follower_id', userId);
      
    if (!error && data) {
       // Dual identity injection: Allows the UI to check `.includes` against either UUID or Username perfectly!
      const activeIdentities: string[] = [];
      data.forEach((d: any) => {
        if (d.profiles?.id) activeIdentities.push(d.profiles.id);
        if (d.profiles?.username) activeIdentities.push(d.profiles.username);
      });
      setFollowedUsers(activeIdentities);
    }
  };

  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([]);
  const fetchUserLikesCache = async (userId: string) => {
    const likes = await SocialService.fetchUserLikes(userId);
    setUserLikedPosts(likes);
  };

  const togglePostLike = async (postId: string) => {
    if (!user) {
      showToast('Must be logged in to like posts.');
      return;
    }
    const isCurrentlyLiked = userLikedPosts.includes(postId);
    // Optimistic UI Update
    setUserLikedPosts(prev => isCurrentlyLiked ? prev.filter(id => id !== postId) : [...prev, postId]);
    setPublicPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
    
    try {
      await SocialService.toggleLike(postId, user.id);
    } catch {
      // Revert if API fails
      setUserLikedPosts(prev => isCurrentlyLiked ? [...prev, postId] : prev.filter(id => id !== postId));
      setPublicPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes: isCurrentlyLiked ? p.likes + 1 : p.likes - 1 }
          : p
      ));
      showToast('Failed to update like status.');
    }
  };

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Real-Time P2P Interceptor 
  useEffect(() => {
    if (!user) return;
    const channel = SocialService.subscribeToGlobalMessages((payload) => {
      if (payload.new.sender_id !== user.id) {
        setHasUnreadMessages(true);
        showToast('📬 New Travel Message Received!');
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Real-Time Profile Updates Interceptor
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            updateActiveProfile(payload.new);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Data States
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const [myTrips, setMyTrips] = useState<MyTrip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  const [travelServices, setTravelServices] = useState<TravelService[]>([]);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [rentalCars, setRentalCars] = useState<RentalCarOption[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch logic directly connected to Supabase
  useEffect(() => {
    const isMockMode = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true' && !!localStorage.getItem('venturesocial_mock_session');
    if (isMockMode) {
      setPublicPosts(mockPublicPosts as any);
      setIsLoadingFeed(false);

      const customTripsStr = localStorage.getItem('venturesocial_custom_trips');
      const customTrips = customTripsStr ? JSON.parse(customTripsStr) : [];
      setMyTrips([...customTrips, ...mockMyTrips]);
      setIsLoadingTrips(false);

      setTravelServices(mockTravelServices as any);
      setFlights(mockFlights as any);
      setRentalCars(mockRentalCars as any);
      setIsLoadingServices(false);
      return;
    }

    const fetchFeedData = async () => {
      setIsLoadingFeed(true);
      try {
        const data = await SocialService.fetchFeed();
        setPublicPosts(data || []);
      } catch (err: any) {
        console.warn("Supabase feed fetch failed, falling back to mock data:", err?.message || err);
        setPublicPosts(mockPublicPosts as any);
      } finally {
        setIsLoadingFeed(false);
      }
    };
    fetchFeedData();

    const fetchUserTrips = async () => {
      setIsLoadingTrips(true);
      try {
        const { data, error } = await supabase.from('posts').select(`
          id,
          location_name,
          created_at,
          trip_spots ( image_url )
        `).eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          const formatted = data.map((post: any) => {
            const spotWithImage = Array.isArray(post.trip_spots) 
              ? post.trip_spots.find((s: any) => s.image_url) 
              : post.trip_spots?.image_url ? post.trip_spots : null;
              
            return {
              id: post.id,
              year: post.created_at ? new Date(post.created_at).getFullYear().toString() : new Date().getFullYear().toString(),
              country: post.location_name,
              image: spotWithImage?.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
              availableImages: []
            };
          });
          setMyTrips(formatted);
        } else {
          setMyTrips([]);
        }
      } catch (err) {
        console.error("Supabase myTrips fetch error:", err);
        setMyTrips([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };

    if (user) {
      fetchUserTrips();
    } else {
      setMyTrips([]);
      setIsLoadingTrips(false);
    }


    setTravelServices(mockTravelServices as any);
    setFlights(mockFlights as any);
    setRentalCars(mockRentalCars as any);
    setIsLoadingServices(false);

  }, [user]);

  const addCustomTrip = (trip: MyTrip) => {
    // Pipeline to save new trips directly to the UI immediately, bypassing mock APIs
    setMyTrips(prev => [trip, ...prev]);
    showToast(`Successfully saved ${trip.country} to your history.`);

    // In production, sync to database here:
    // await supabase.from('trips').insert([trip]);
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const register = async (name: string, email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name, full_name: name, user_name: name } }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Most Liked');
  const [filters, setFilters] = useState<FilterState>({
    minStars: 0,
    activities: [],
    hotelTypes: [],
    priceRange: [0, 5000],
    duration: null,
    location: null,
  });

  const saveItem = (item: any) => {
    const newItem: SavedItem = {
      ...item,
      savedAt: new Date().toISOString()
    };
    setSavedItems(prev => [...prev, newItem]);
  };

  const addPublicPost = async (post: Post) => {
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      const data = await res.json();
      if (data.success) {
        setPublicPosts(prev => [data.post, ...prev]);
      }
    } catch { }
  };

  const togglePublic = (eventId: string, isPublic: boolean) => {
    console.log(`Event ${eventId} public status: ${isPublic}`);
  };

  const [cartItems, setCartItems] = useState<Post[]>([]);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  // Follow System State
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [requestedUsers, setRequestedUsers] = useState<string[]>([]);

  // Personalization & Remix State
  const [userInterestTags, setUserInterestTags] = useState<string[]>([]);
  const [customTripSpots, setCustomTripSpots] = useState<import('./types').PostImage[]>([]);

  const addUserInterest = (tag: string) => {
    setUserInterestTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
  };

  const toggleCustomSpot = (spot: import('./types').PostImage) => {
    setCustomTripSpots(prev => {
      const exists = prev.find(s => s.description === spot.description);
      if (exists) {
        showToast(`Removed from your Custom Trip`);
        return prev.filter(s => s.description !== spot.description);
      } else {
        showToast(`Added to your Custom Trip!`);
        return [...prev, { ...spot, id: spot.id || Math.random().toString(36).substr(2, 9) }];
      }
    });
  };

  const clearCustomTrip = () => setCustomTripSpots([]);

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3000);
  };

  // Location tracking state
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          showToast(`Live location updated! Fetching local recommendations.`);
        },
        (error) => {
          showToast(`Location error: ${error.message}`);
        }
      );
    } else {
      showToast("Geolocation is not supported by this browser.");
    }
  };

  const toggleFollow = async (targetId: string, isPrivate: boolean) => {
    if (!user) {
      showToast("Must be logged in to follow");
      return;
    }
    
    if (followedUsers.includes(targetId)) {
      // Optimistic Unfollow
      setFollowedUsers(prev => prev.filter(u => u !== targetId));
      showToast(`Unfollowed account.`);
      // Unfollow in Database
      const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      if (error) {
        showToast("Error unfollowing");
      }
      await fetchUserFollows(user.id);
    } else {
      // Optimistic Follow
      setFollowedUsers(prev => [...prev, targetId]);
      showToast(`You are now following them!`);
      // Bind connection in Database
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      if (error) {
        showToast("Error executing follow relation.");
      }
      await fetchUserFollows(user.id);
    }
  };

  const addToCart = (post: Post) => {
    if (!cartItems.find(item => item.id === post.id)) {
      setCartItems(prev => [...prev, post]);
      showToast(`Added ${post.location} Itinerary to Cart!`);
      // Sync strictly to Supabase Baskets for Analytics Remix Scoring
      if (user) {
        SocialService.remixPost(post.id, user.id).catch(err => {
          console.error("Supabase Remix Logging Error:", err);
        });
      }
    } else {
      showToast(`${post.location} is already in your Cart.`);
    }
  };
  const removeFromCart = (postId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== postId));
  };
  const clearCart = () => setCartItems([]);

  const [remixFolders, setRemixFolders] = useState<Record<string, Post[]>>({});

  const addToRemixFolder = (post: Post) => {
    const locationKey = post.location.split(',')[0].trim();

    setRemixFolders(prev => {
      const existing = prev[locationKey] || [];
      if (existing.some(p => p.id === post.id)) {
        showToast(`This item is already in your ${locationKey} Remix.`);
        return prev;
      }

      showToast(`Added to ${locationKey} Remix Workspace!`);
      if (user) {
        SocialService.remixPost(post.id, user.id).catch(err => {
          console.error("Supabase Remix Logging Error:", err);
        });
      }

      return {
        ...prev,
        [locationKey]: [...existing, post]
      };
    });
  };

  const removeFromRemixFolder = (locationKey: string, postId: string) => {
    setRemixFolders(prev => {
      const existing = prev[locationKey] || [];
      const updated = existing.filter(p => p.id !== postId);

      if (updated.length === 0) {
        const newFolders = { ...prev };
        delete newFolders[locationKey];
        return newFolders;
      }

      return {
        ...prev,
        [locationKey]: updated
      };
    });
    showToast('Removed from Remix Studio.');
  };

  const updateActiveProfile = (newData: any) => {
    setActiveProfile((prev: any) => ({ ...prev, ...newData }));
    
    // Zero-Refresh Matrix Overwrite
    const nextName = newData.full_name || newData.username || 'Anonymous Explorer';
    const nextAvatar = newData.avatar_url;
    
    const patchIdentity = (p: Post) => p.userId === user?.id 
      ? { ...p, user: nextName, avatar: nextAvatar || p.avatar } 
      : p;

    setPublicPosts(prev => prev.map(patchIdentity));
    setCartItems(prev => prev.map(patchIdentity));
    
    setRemixFolders(prev => {
      const patched: Record<string, Post[]> = {};
      Object.keys(prev).forEach(k => {
        patched[k] = prev[k].map(patchIdentity);
      });
      return patched;
    });
  };

  return (
    <AppContext.Provider value={{
      user, isAuthenticated, login, register, logout,
      savedItems, saveItem,
      publicPosts, isLoadingFeed, addPublicPost, togglePublic,
      searchQuery, setSearchQuery, filters, setFilters, sortBy, setSortBy,
      travelServices, flights, rentalCars, isLoadingServices,
      myTrips, isLoadingTrips,
      cartItems, addToCart, removeFromCart, clearCart,
      globalToast, setGlobalToast,
      followedUsers, requestedUsers, toggleFollow,
      userInterestTags, addUserInterest,
      customTripSpots, toggleCustomSpot, clearCustomTrip,
      userLikedPosts, togglePostLike,
      hasUnreadMessages, setHasUnreadMessages,
      userLocation, requestLocation,
      remixFolders, addToRemixFolder, removeFromRemixFolder,
      addCustomTrip, activeProfile, updateActiveProfile,
      currentUserProfile: activeProfile
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}

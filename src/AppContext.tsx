import React, { createContext, useContext, useState, useEffect } from 'react';
import { SavedItem, TimelineEvent, Post, User } from './types';

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
  toggleFollow: (username: string, isPrivate: boolean) => void;
  userInterestTags: string[];
  addUserInterest: (tag: string) => void;
  customTripSpots: import('./types').PostImage[];
  toggleCustomSpot: (spot: import('./types').PostImage) => void;
  clearCustomTrip: () => void;
  userLocation: { lat: number, lng: number } | null;
  requestLocation: () => void;
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
  const isAuthenticated = !!user;

  // Data States
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const [myTrips, setMyTrips] = useState<MyTrip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  const [travelServices, setTravelServices] = useState<TravelService[]>([]);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [rentalCars, setRentalCars] = useState<RentalCarOption[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch logic
  useEffect(() => {
    fetch('/api/feed').then(res => res.json()).then(data => {
      setPublicPosts(data);
      setIsLoadingFeed(false);
    }).catch(() => setIsLoadingFeed(false));

    fetch('/api/trips').then(res => res.json()).then(data => {
      setMyTrips(data);
      setIsLoadingTrips(false);
    }).catch(() => setIsLoadingTrips(false));

    fetch('/api/services').then(res => res.json()).then(data => {
      setTravelServices(data.travelServices || []);
      setFlights(data.flights || []);
      setRentalCars(data.rentalCars || []);
      setIsLoadingServices(false);
    }).catch(() => setIsLoadingServices(false));
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setUser(data.user);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });
    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    setUser(data.user);
  };

  const logout = () => setUser(null);

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
    } catch {}
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

  const toggleFollow = (username: string, isPrivate: boolean) => {
    if (followedUsers.includes(username)) {
      // Unfollow
      setFollowedUsers(prev => prev.filter(u => u !== username));
      showToast(`Unfollowed ${username}`);
    } else if (requestedUsers.includes(username)) {
      // Cancel Request
      setRequestedUsers(prev => prev.filter(u => u !== username));
      showToast(`Cancelled request to ${username}`);
    } else {
      // Follow / Request
      if (isPrivate) {
        setRequestedUsers(prev => [...prev, username]);
        showToast(`Requested to follow ${username} 🔒`);
      } else {
        setFollowedUsers(prev => [...prev, username]);
        showToast(`You are now following ${username}!`);
      }
    }
  };

  const addToCart = (post: Post) => {
    if (!cartItems.find(item => item.id === post.id)) {
      setCartItems(prev => [...prev, post]);
      showToast(`Added ${post.location} Itinerary to Cart!`);
    } else {
      showToast(`${post.location} is already in your Cart.`);
    }
  };
  const removeFromCart = (postId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== postId));
  };
  const clearCart = () => setCartItems([]);

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
      userLocation, requestLocation
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

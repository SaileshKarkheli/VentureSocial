export interface User {
  id: string;
  name: string;
  dob: string;
  email: string;
  avatar: string;
}

export interface ItineraryItem {
  id: string;
  type: 'Stay' | 'Restaurant' | 'Service';
  name: string;
  link: string;
}

export interface TimelineEvent {
  id: string;
  day: number;
  title: string;
  description: string;
  image?: string;
  location: string;
  isPublic: boolean;
  itinerary: ItineraryItem[];
}

export interface Trip {
  id: string;
  title: string;
  location: string;
  date: string;
  image: string;
  description: string;
  events: TimelineEvent[];
}

export interface PostImage {
  id?: string;
  url: string;
  day: number;
  description: string;
  coordinates?: { lat: number, lng: number };
  activities?: string[];
}

export interface Post {
  id: string;
  userId: string;
  tripId: string;
  user: string;
  avatar: string;
  location: string;
  images: PostImage[];
  videos?: string[];
  caption: string;
  likes: number;
  comments: number;
  rating: number;
  activities: string[];
  hotelType: string;
  price: number;
  isPrivate?: boolean;
}

export interface SavedItem extends ItineraryItem {
  savedAt: string;
}

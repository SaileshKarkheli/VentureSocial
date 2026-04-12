import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Mock Data from AppContext
const myTrips = [
  {
    id: '1',
    year: '2025',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=400&q=80',
    availableImages: [
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: '2',
    year: '2024',
    country: 'Nashville',
    image: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=400&q=80',
    availableImages: [
      'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: '3',
    year: '2024',
    country: 'Bali',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80',
    availableImages: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: '4',
    year: '2023',
    country: 'New York',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80',
    availableImages: [
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583088924036-7c6de3470788?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1430990480609-2bf7c02a6b1a?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: '5',
    year: '2023',
    country: 'Amalfi',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=400&q=80',
    availableImages: [
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1598501258165-27a36f6d0f50?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

let publicPosts = [
  {
    id: 'p1',
    userId: 'u1',
    tripId: 't1',
    user: 'Sarah Miller',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    location: 'Nashville, USA',
    images: [
      { url: 'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=800&q=80', day: 1, description: 'Day 1: Nashville Skyline', activities: ['Downtown Tour', 'Photography Walk', 'Coffee Tasting'], coordinates: { lat: 36.1627, lng: -86.7816 } },
      { url: 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&w=800&q=80', day: 2, description: 'Day 2: Live Concert', activities: ['Broadway Bars', 'Live Country Music Session', 'Line Dancing'], coordinates: { lat: 36.1601, lng: -86.7788 } },
      { url: 'https://images.unsplash.com/photo-1531266752426-aad47a4583d7?auto=format&fit=crop&w=800&q=80', day: 3, description: 'Day 3: Southern Food', activities: ['BBQ Tasting', 'Whiskey Distillery Tour', 'Souvenir Shopping'], coordinates: { lat: 36.1659, lng: -86.7844 } }
    ],
    videos: [
      'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-1531-large.mp4'
    ],
    caption: 'Music City vibes! 🎸 #nashville #music #usa',
    likes: 1240,
    comments: 84,
    rating: 5,
    activities: ['Foodie', 'Music'],
    hotelType: 'Boutique',
    price: 800,
    isPrivate: false
  },
  {
    id: 'p2',
    userId: 'u2',
    tripId: 't2',
    user: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    location: 'Italy',
    images: [
      { url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80', day: 1, description: 'Day 1: Venice Canals', activities: ['Gondola Ride', 'St. Mark Square Tour', 'Gelato Tasting'], coordinates: { lat: 45.4408, lng: 12.3155 } },
      { url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=80', day: 2, description: 'Day 2: Amalfi Coast', activities: ['Cliffside Hiking', 'Lemon Farm Visit', 'Seafood Sunset Dinner'], coordinates: { lat: 40.6340, lng: 14.6027 } },
      { url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', day: 3, description: 'Day 3: Roman Forum', activities: ['Colosseum Tour', 'Gladiator Museum', 'Pasta Making Class'], coordinates: { lat: 41.8925, lng: 12.4853 } }
    ],
    caption: 'The history and beauty of Italy is unmatched. 🇮🇹 #italy #europe #history',
    likes: 856,
    comments: 42,
    rating: 4,
    activities: ['Museum', 'Foodie'],
    hotelType: 'Boutique',
    price: 600,
    isPrivate: true
  },
  {
    id: 'p3',
    userId: 'u3',
    tripId: 't3',
    user: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    location: 'Bali, Indonesia',
    images: [
      { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', day: 1, description: 'Day 1: Luxury Resort', activities: ['Welcome Massage', 'Beachfront Meditation', 'Private Cabana'], coordinates: { lat: -8.4095, lng: 115.1889 } },
      { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', day: 2, description: 'Day 2: Infinity Pool', activities: ['Floating Breakfast', 'Jungle Swing', 'Cocktail Hour'], coordinates: { lat: -8.5069, lng: 115.2625 } },
      { url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80', day: 3, description: 'Day 3: Ancient Temple', activities: ['Monkey Forest Explore', 'Traditional Dance Info', 'Cultural Blessing'], coordinates: { lat: -8.6186, lng: 115.0860 } }
    ],
    videos: [
      'https://assets.mixkit.co/videos/preview/mixkit-snowy-mountain-peak-under-a-blue-sky-4412-large.mp4'
    ],
    caption: 'Pure relaxation in Bali. 🌴 #bali #indonesia #relax',
    likes: 2103,
    comments: 156,
    rating: 5,
    activities: ['Relaxation', 'Hiking'],
    hotelType: 'Resort',
    price: 2500,
    isPrivate: false
  }
];

const travelServices = [
  { id: 's1', name: 'Private Gondola Tour', category: 'Boat Rentals', price: 120, rating: 4.9, image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=400&q=80', location: 'Venice, Italy' },
  { id: 's2', name: 'Amalfi Coast Hiking Guide', category: 'Hiking', price: 85, rating: 4.8, image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80', location: 'Amalfi, Italy' },
  { id: 's3', name: 'Colosseum Priority Pass', category: 'Museum Passes', price: 45, rating: 4.7, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&q=80', location: 'Rome, Italy' },
  { id: 's4', name: 'Bali Jungle Paragliding', category: 'Paragliding', price: 150, rating: 4.9, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80', location: 'Ubud, Bali' },
  { id: 's5', name: 'Nashville Music City Tour', category: 'Guided Tours', price: 65, rating: 4.6, image: 'https://images.unsplash.com/photo-1541844053589-3462d48979e2?auto=format&fit=crop&w=400&q=80', location: 'Nashville, USA' },
  { id: 's6', name: 'Santorini Sunset Cruise', category: 'Boat Rentals', price: 200, rating: 5.0, image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=400&q=80', location: 'Oia, Greece' }
];

const flights = [
  { id: 'f1', airline: 'Delta Airlines', class: 'Economy', price: 350, duration: '4h 20m', logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=100&q=80' },
  { id: 'f2', airline: 'United Airlines', class: 'Business', price: 850, duration: '4h 10m', logo: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=100&q=80' },
  { id: 'f3', airline: 'American Airlines', class: 'First Class', price: 1200, duration: '4h 05m', logo: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=100&q=80' }
];

const rentalCars = [
  { id: 'c1', company: 'Hertz', type: 'Compact', pricePerDay: 45, image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=200&q=80' },
  { id: 'c2', company: 'Enterprise', type: 'SUV', pricePerDay: 85, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=200&q=80' },
  { id: 'c3', company: 'Avis', type: 'Luxury', pricePerDay: 150, image: 'https://images.unsplash.com/photo-1503376760367-15ea4dc09a3a?auto=format&fit=crop&w=200&q=80' }
];

// Helper to simulate network latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// APIs
app.get('/api/feed', async (req, res) => {
  await delay(800); // simulate realistic latency
  res.json(publicPosts);
});

app.post('/api/feed', async (req, res) => {
  await delay(500);
  const newPost = req.body;
  publicPosts = [newPost, ...publicPosts];
  res.json({ success: true, post: newPost });
});

app.get('/api/trips', async (req, res) => {
  await delay(800);
  res.json(myTrips);
});

app.get('/api/services', async (req, res) => {
  await delay(600);
  res.json({ travelServices, flights, rentalCars });
});

// Auth simulating real backend
app.post('/api/auth/login', async (req, res) => {
  await delay(1200);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // Real apps verify password hash here
  res.json({
    token: 'mock_jwt_token_123',
    user: {
      id: 'u123',
      name: 'Alex Explorer',
      email,
      dob: '1990-01-01',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100'
    }
  });
});

app.post('/api/auth/register', async (req, res) => {
  await delay(1200);
  const { name, email, password } = req.body;
  
  res.json({
    token: 'mock_jwt_token_124',
    user: {
      id: 'u124',
      name,
      email,
      dob: '1990-01-01',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100'
    }
  });
});

app.listen(port, () => {
  console.log(`Express Mock Backend running on http://localhost:${port}`);
});

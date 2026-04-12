import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import MyTrips from './pages/MyTrips';
import TripDetail from './pages/TripDetail';
import BlogDetail from './pages/BlogDetail';
import BlogList from './pages/BlogList';
import Search from './pages/Search';
import TravelServices from './pages/TravelServices';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/blog/:tripId" element={<BlogDetail />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/search" element={<Search />} />
          <Route path="/services" element={<TravelServices />} />
          
          {/* Placeholder routes for the rest of the sidebar */}
          <Route path="/photos" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Photos coming soon...</div></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Videos coming soon...</div></ProtectedRoute>} />
          <Route path="/clubs" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Travel Clubs coming soon...</div></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Settings coming soon...</div></ProtectedRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

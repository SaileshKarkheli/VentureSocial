import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import DynamicProfile from './pages/profile/[username]';
import MyTrips from './pages/MyTrips';
import TripDetail from './pages/TripDetail';
import RemixStudio from './pages/RemixStudio';
import BlogDetail from './pages/BlogDetail';
import BlogList from './pages/BlogList';
import Search from './pages/Search';
import TravelServices from './pages/TravelServices';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/update-password" element={<UpdatePassword />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<DynamicProfile />} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/remix" element={<RemixStudio />} />
          <Route path="/blog/:tripId" element={<BlogDetail />} />
          <Route path="/blogs/new" element={<ProtectedRoute><BlogDetail /></ProtectedRoute>} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/search" element={<Search />} />
          <Route path="/services" element={<TravelServices />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          
          {/* Placeholder routes for the rest of the sidebar */}
          <Route path="/photos" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Photos coming soon...</div></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Videos coming soon...</div></ProtectedRoute>} />
          <Route path="/clubs" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Travel Clubs coming soon...</div></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><div className="p-8 text-center text-zinc-500">Settings coming soon...</div></ProtectedRoute>} />
        </Route>
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

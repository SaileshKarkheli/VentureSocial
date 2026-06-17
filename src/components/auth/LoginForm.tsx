import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onOpenSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onOpenSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error initiating Google login.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // Always surface the error — no silent mock fallback in submit handler.
      // Use the "Bypass Login" button below for offline development.
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
      setLoading(false);
    }
  };

  const handleMockBypass = () => {
    localStorage.setItem('venturesocial_mock_session', JSON.stringify({
      user: {
        id: 'u123',
        name: 'Alex Explorer',
        email: 'alex@venturesocial.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100'
      },
      token: 'mock_jwt_token_123'
    }));
    window.location.reload();
  };

  const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100 w-full max-w-md">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Hero Entry: Google Auth at the absolute top */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-xl shadow-sm hover:bg-zinc-50 hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Continue with Google
        </button>

        {isMockEnabled && (
          <button
            type="button"
            onClick={handleMockBypass}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
          >
            Bypass Login (Offline Mock Mode)
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <span className="border-b border-zinc-200 w-1/5 lg:w-1/4"></span>
        <span className="text-xs text-center text-zinc-400 font-bold uppercase tracking-widest">or use email</span>
        <span className="border-b border-zinc-200 w-1/5 lg:w-1/4"></span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all placeholder:text-zinc-400"
            placeholder="Email address"
            disabled={loading}
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all placeholder:text-zinc-400"
            placeholder="Password"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-[#0A192F] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-black transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/auth/forgot-password"
          className="text-sm font-bold text-[#3B82F6] hover:text-blue-600 transition-colors hover:underline focus:outline-none"
        >
          Forgotten password?
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-200 flex justify-center">
        <button
          type="button"
          onClick={onOpenSignup}
          className="py-3 px-8 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all text-base"
        >
          Create new account
        </button>
      </div>
    </div>
  );
};

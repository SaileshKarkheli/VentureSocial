import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/update-password',
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error sending reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-zinc-100 z-10"
      >
        <div className="flex justify-center mb-6 text-orange-500">
          <div className="p-4 bg-orange-500/10 rounded-full">
            <Mail size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-display font-bold text-center text-[#0A192F] mb-2">
          Find Your Account
        </h2>
        <p className="text-zinc-500 text-center mb-8 text-sm">
          Please enter your email address to search for your account.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            <CheckCircle2 size={48} className="text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-[#0A192F] mb-2">Check your email</h3>
            <p className="text-zinc-500 text-sm mb-6">We've sent password reset instructions to your email address.</p>
            <Link 
              to="/login"
              className="py-3 px-8 bg-[#0A192F] text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all w-full text-center"
            >
              Return to Login
            </Link>
          </motion.div>
        ) : (
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

            <div className="pt-4 flex gap-3">
              <Link
                to="/login"
                className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-700 font-bold rounded-xl hover:bg-zinc-200 transition-all text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !email}
                className="flex-1 py-3 px-4 bg-[#3B82F6] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

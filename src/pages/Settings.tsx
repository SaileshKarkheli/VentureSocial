import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Save, RefreshCw, ToggleLeft, ToggleRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { activeProfile, updateActiveProfile, user } = useApp();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [location, setLocation] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [performanceOpt, setPerformanceOpt] = useState(() => {
    return localStorage.getItem('venturesocial_performance_opt') === 'true';
  });

  useEffect(() => {
    if (activeProfile) {
      setFullName(activeProfile.full_name || '');
      setUsername(activeProfile.username || '');
      setBio(activeProfile.bio || '');
      setEducation(activeProfile.education || '');
      setLocation(activeProfile.location || '');
    }
  }, [activeProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("You must be logged in to modify settings.");
      return;
    }
    
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          bio: bio,
          education: education,
          location: location,
        })
        .eq('id', user.id);

      if (error) throw error;

      updateActiveProfile({
        full_name: fullName,
        username: username,
        bio: bio,
        education: education,
        location: location,
      });

      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setErrorMessage(err.message || "Failed to update profile settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePerformance = () => {
    const newVal = !performanceOpt;
    setPerformanceOpt(newVal);
    localStorage.setItem('venturesocial_performance_opt', String(newVal));
    setSuccessMessage(`Performance mode ${newVal ? 'enabled' : 'disabled'}!`);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleCacheFlush = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20 px-6 text-zinc-900 mt-6">
      <header className="space-y-2">
        <h2 className="text-4xl font-display font-bold text-[#0A192F]">Settings</h2>
        <p className="text-zinc-500">Manage your profile metadata, performance parameters, and storage cache.</p>
      </header>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-semibold shadow-sm"
          >
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold shadow-sm"
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Info Form Section */}
      <section className="bg-white p-8 rounded-3xl border border-zinc-150 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-[#0A192F] border-b border-zinc-100 pb-4">
          Profile Information
        </h3>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Explorer"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all placeholder:text-zinc-400 font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alex_explorer"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all placeholder:text-zinc-400 font-medium font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, USA"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all placeholder:text-zinc-400 font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all placeholder:text-zinc-400 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Biography</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your travels..."
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all placeholder:text-zinc-400 font-medium resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#0A192F] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* App Performance Settings Section */}
      <section className="bg-white p-8 rounded-3xl border border-zinc-150 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-[#0A192F] border-b border-zinc-100 pb-4">
          Preferences & Diagnostics
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-150">
            <div className="space-y-1">
              <h4 className="font-bold text-[#0A192F]">App Performance Optimization</h4>
              <p className="text-sm text-zinc-500 max-w-lg">
                Accelerate rendering timelines, lazy-load heavy media components, and streamline background handshake operations.
              </p>
            </div>
            <button
              onClick={handleTogglePerformance}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none shrink-0 ${performanceOpt ? 'bg-orange-500' : 'bg-zinc-200'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${performanceOpt ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-150 gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-[#0A192F]">Cache Cleansing Flush</h4>
              <p className="text-sm text-zinc-500 max-w-lg">
                Instantly clear local state values, local storage cache identifiers, and force a browser reload to synchronize with the server.
              </p>
            </div>
            <button
              onClick={handleCacheFlush}
              className="bg-rose-500 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-rose-600 transition-colors shrink-0 shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Flush Cache
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

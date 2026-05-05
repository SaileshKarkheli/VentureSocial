import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username?: string | null;
  [key: string]: any;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error.message);
          return null;
        }
        return data as UserProfile;
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
        return null;
      }
    };

    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const profile = await fetchProfile(initialSession.user.id);
        if (mounted) setUserProfile(profile);
      }
      
      if (mounted) setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        const profile = await fetchProfile(currentSession.user.id);
        if (mounted) setUserProfile(profile);
      } else {
        if (mounted) setUserProfile(null);
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username, bio, cover_url')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserProfile(data as UserProfile);
        }
      } catch (err) {
        console.error('Failed to refresh profile', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

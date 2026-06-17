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
      try {
        // ─── DEVELOPMENT ONLY: Mock session bypass ────────────────────────────
        // Dead code in production (VITE_ENABLE_MOCK_MODE is not 'true').
        const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
        if (isMockEnabled) {
          const mockSessionStr = localStorage.getItem('venturesocial_mock_session');
          if (mockSessionStr) {
            const mockData = JSON.parse(mockSessionStr);
            if (mounted) {
              setSession({
                access_token: mockData.access_token,
                token_type: 'bearer',
                expires_in: 3600,
                user: mockData.user,
              } as any);
              setUser(mockData.user);
              setUserProfile({
                id: mockData.user.id,
                full_name: mockData.user.name || 'Alex Explorer',
                avatar_url: mockData.user.avatar || '',
                username: mockData.user.email ? mockData.user.email.split('@')[0] : 'alex_explorer'
              });
              setLoading(false);
              return; // Do NOT proceed to Supabase auth in mock mode
            }
          }
        }
        // ─── END DEVELOPMENT ONLY ─────────────────────────────────────────────

        // Production auth: Supabase is always the sole source of truth.
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const profile = await fetchProfile(initialSession.user.id);
          if (mounted) setUserProfile(profile);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      // In mock mode, onAuthStateChange fires with null session (no real Supabase login).
      // Ignore state changes when mock mode is active — mock state is set once in initializeAuth.
      const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
      if (isMockEnabled && localStorage.getItem('venturesocial_mock_session')) return;
      
      try {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('venturesocial_mock_session');
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const profile = await fetchProfile(currentSession.user.id);
          if (mounted) setUserProfile(profile);
        } else {
          // No Supabase session and not mock mode = genuinely logged out.
          if (mounted) setUserProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        // cover_photo_url is the canonical DB column (cover_url does not exist in schema)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username, bio, cover_photo_url')
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

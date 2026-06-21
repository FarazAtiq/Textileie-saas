import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { signUp, signIn, signOut, getProfile } from '../lib/db.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch { setProfile(null); }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (data) => {
    await signUp(data);
    // Supabase sends a confirmation email by default
    // For dev, disable it: Supabase → Auth → Settings → Disable email confirmation
  };

  const login = async (email, password) => {
    const { user } = await signIn({ email, password });
    return user;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = () => user && loadProfile(user.id);

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

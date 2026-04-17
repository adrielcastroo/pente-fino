
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useAppStore } from '@/store/useAppStore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isGuest: boolean;
  loginAsGuest: (name?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('isGuest') === 'true');
  const setConferente = useAppStore(s => s.setConferente);

  useEffect(() => {
    // Set up auth listener FIRST (before getSession) to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use setTimeout to avoid Supabase auth deadlock
        setTimeout(() => fetchProfile(session.user.id), 0);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await (supabase
      .from('profiles' as any)
      .select('*')
      .eq('id', userId)
      .single() as any);
    
    if (!error && data) {
      setProfile(data);
      setConferente((data as any).display_name || '');
    }
  };

  const loginAsGuest = (name?: string) => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    if (name) {
      setConferente(name);
    }
  };

  const signOut = async () => {
    // Clear remember-me preference
    localStorage.removeItem('rememberMe');
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    setConferente('');
  };

  const value = useMemo(() => ({
    user, profile, loading, isGuest, loginAsGuest, signOut
  }), [user, profile, loading, isGuest]);

  return (
    <AuthContext.Provider value={value}>
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

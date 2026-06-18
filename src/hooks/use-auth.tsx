
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useAppStore } from '@/store/useAppStore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isGuest: boolean;
  guestName: string;
  isAdmin: boolean;
  loginAsGuest: (name?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('isGuest') === 'true');
  const [guestName, setGuestName] = useState(() => localStorage.getItem('guestName') || '');
  const setConferente = useAppStore(s => s.setConferente);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle() as any);
      if (!cancelled) setIsAdmin(!!data);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    // Set up auth listener FIRST (before getSession) to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use setTimeout to avoid Supabase auth deadlock
        setTimeout(() => fetchProfile(session.user.id, session.user.email), 0);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        localStorage.removeItem('guestName');
        setGuestName('');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
        localStorage.removeItem('guestName');
        setGuestName('');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    const { data, error } = await (supabase
      .from('profiles' as any)
      .select('*')
      .eq('id', userId)
      .single() as any);
    
    if (!error && data) {
      setProfile(data);
      const name = data.display_name || email?.split('@')[0] || 'Usuário';
      setConferente(name);
    } else if (email) {
      // Even without a profile, set the conferente from email
      setConferente(email.split('@')[0]);
    }
  };

  const loginAsGuest = (name?: string) => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    if (name) {
      setGuestName(name);
      localStorage.setItem('guestName', name);
      setConferente(name);
    }
  };

  const signOut = async () => {
    // Clear remember-me preference
    localStorage.removeItem('rememberMe');
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    localStorage.removeItem('guestName');
    setGuestName('');
    setConferente('');
  };

  const value = useMemo(() => ({
    user, profile, loading, isGuest, guestName, isAdmin, loginAsGuest, signOut
  }), [user, profile, loading, isGuest, guestName, isAdmin]);

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

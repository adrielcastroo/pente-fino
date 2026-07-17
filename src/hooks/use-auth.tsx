
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useAppStore } from '@/store/useAppStore';
import { normalizeRole, can as canDo, type Role, type Action } from '@/lib/permissions';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isGuest: boolean;
  guestName: string;
  isAdmin: boolean;
  role: Role | null;
  modules: string[];
  can: (action: Action) => boolean;
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
  const [role, setRole] = useState<Role | null>(null);
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!user) { setRole(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase.rpc as any)('get_my_role');
      if (!cancelled) setRole(data ? normalizeRole(data as string) : 'operador');
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
    try {
      const { data, error } = await (supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle() as any);

      if (!error && data) {
        setProfile(data);
        const name = data.display_name || email?.split('@')[0] || 'Usuário';
        setConferente(name);
        return;
      }
    } catch (e) {
      console.warn('[auth] fetchProfile failed', e);
    }
    // Fallback: never leave profile null, or RoleHomeRedirect fica em loop.
    setProfile({ id: userId, email, modules: ['estoque'] });
    if (email) setConferente(email.split('@')[0]);
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

  const can = useCallback((action: Action) => canDo(role, action), [role]);

  const modules = useMemo<string[]>(() => {
    // Admin sempre tem acesso a todos os módulos, independente do que estiver no profile.
    if (isAdmin) return ['estoque', 'expedicao', 'compras'];
    const raw = (profile as any)?.modules;
    if (Array.isArray(raw) && raw.length) return raw as string[];
    return ['estoque'];
  }, [profile, isAdmin]);

  const value = useMemo(() => ({
    user, profile, loading, isGuest, guestName, isAdmin, role, modules, can, loginAsGuest, signOut
  }), [user, profile, loading, isGuest, guestName, isAdmin, role, modules, can]);

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

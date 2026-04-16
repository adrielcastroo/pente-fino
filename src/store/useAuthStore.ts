import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: any | null;
  profile: any | null;
  isGuest: boolean;
  guestName: string;
  loading: boolean;
  setUser: (user: any) => void;
  setProfile: (profile: any) => void;
  setGuest: (isGuest: boolean, name?: string) => void;
  setGuestName: (name: string) => void;
  signOut: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isGuest: false,
      guestName: '',
      loading: true,
      setUser: (user) => set({ user, isGuest: false, loading: false }),
      setProfile: (profile) => set({ profile }),
      setGuest: (isGuest, name = '') => set({ isGuest, guestName: name, user: null, profile: null, loading: false }),
      setGuestName: (name) => set({ guestName: name }),
      setLoading: (loading) => set({ loading }),
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, isGuest: false, guestName: '', loading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isGuest: state.isGuest, 
        guestName: state.guestName 
      }),
    }
  )
);

import { Header } from "./Header";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { setUser, setProfile, isGuest, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial Auth State
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        // Fetch Profile
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      }
    });

    // Auth Listeners
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      } else {
        // Only clear if not guest
        if (!isGuest) {
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, isGuest]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-6 mx-auto">
        {children}
      </main>
    </div>
  );
};

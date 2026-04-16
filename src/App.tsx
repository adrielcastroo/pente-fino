import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "./components/Layout";

const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Inventory = lazy(() => import("./pages/Inventory.tsx"));
const History = lazy(() => import("./pages/History.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const AIChat = lazy(() => import("./pages/AIChat.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthStore();
  if (loading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              {/* Public Routes with Layout */}
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
              <Route path="/history" element={<Layout><History /></Layout>} />
              
              {/* Private Routes with Layout */}
              <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
              <Route path="/ai-chat" element={<PrivateRoute><Layout><AIChat /></Layout></PrivateRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" closeButton duration={2000} />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;




import { Suspense, lazy, useState } from 'react';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePresenceTracker } from '@/hooks/use-presence';
import TopBar from '@/components/TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Home, ScanBarcode, History, Table, Settings, Waves, TreePine, Settings2, Warehouse, Archive } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

// Lazy load all panels
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const HistoryPanel = lazy(() => import('@/components/HistoryPanel'));
const RightPanel = lazy(() => import('@/components/RightPanel'));
const LeftPanel = lazy(() => import('@/components/LeftPanel').then(m => ({ default: m.LeftPanel })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ShortcutsModal = lazy(() => import('@/components/ShortcutsModal'));

const PageSkeleton = () => (
  <div className="p-4 sm:p-8 space-y-4">
    <div className="h-8 bg-muted rounded w-1/4" />
    <div className="h-32 bg-muted rounded w-full" />
  </div>
);

export default function MainLayout() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  usePresenceTracker();
  
  const [activeMainTab, setActiveMainTab] = useState("dashboard");
  const setMode = useAppStore(s => s.setMode);
  const currentMode = useAppStore(s => s.currentMode);
  const setFormData = useAppStore(s => s.setFormData);

  const handleModeChange = (mode: any) => {
    setMode(mode);
    setFormData({ activeTab: mode });
  };

  return (
    <div className="h-[100dvh] flex flex-col w-full bg-background overflow-hidden relative app-bg-pattern">
      <TopBar />
      
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-card/50 border-b border-border/40 px-4 py-2 flex justify-center overflow-x-auto no-scrollbar">
            <TabsList className="bg-muted/30 p-1 h-auto gap-1">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Início</span>
              </TabsTrigger>
              <TabsTrigger value="bipagem" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg">
                <ScanBarcode className="w-4 h-4" />
                <span className="hidden sm:inline">Bipagem</span>
              </TabsTrigger>
              <TabsTrigger value="tabela" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg">
                <Table className="w-4 h-4" />
                <span className="hidden sm:inline">Tabela</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 rounded-lg">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Ajustes</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
            <div className="max-w-[2000px] mx-auto p-3 sm:p-6 lg:p-8 h-full">
              <Suspense fallback={<PageSkeleton />}>
                <TabsContent value="dashboard" className="m-0 h-full animate-in fade-in zoom-in-95 duration-300">
                  <DashboardPage />
                </TabsContent>
                
                <TabsContent value="bipagem" className="m-0 h-full animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex flex-col gap-6">
                    {/* Mode selector inside Bipagem */}
                    <div className="flex flex-wrap gap-2 justify-center p-2 bg-muted/20 rounded-xl border border-border/40">
                      {[
                        { id: 'manual', label: 'Tecido', icon: Waves },
                        { id: 'madeira', label: 'Madeira', icon: TreePine },
                        { id: 'motor', label: 'Motor', icon: Settings2 },
                        { id: 'estoque', label: 'Estoque', icon: Warehouse },
                        { id: 'saida', label: 'Saída', icon: Archive },
                      ].map((m) => (
                        <Button
                          key={m.id}
                          variant={currentMode === m.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleModeChange(m.id)}
                          className="rounded-lg gap-2"
                        >
                          <m.icon className="w-4 h-4" />
                          {m.label}
                        </Button>
                      ))}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="w-full lg:w-[480px] shrink-0">
                        <LeftPanel />
                      </div>
                      <div className="flex-1 hidden lg:block">
                        <RightPanel />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tabela" className="m-0 h-full animate-in fade-in duration-300">
                  <RightPanel />
                </TabsContent>

                <TabsContent value="historico" className="m-0 h-full animate-in fade-in duration-300">
                  <HistoryPanel />
                </TabsContent>

                <TabsContent value="config" className="m-0 h-full animate-in fade-in duration-300">
                  <SettingsPage />
                </TabsContent>
              </Suspense>
            </div>
          </div>
        </Tabs>
      </main>

      <Suspense fallback={null}>
        <ShortcutsModal open={false} onClose={() => {}} />
      </Suspense>
    </div>
  );
}

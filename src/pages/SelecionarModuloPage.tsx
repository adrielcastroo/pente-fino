import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Boxes, Truck, ShoppingCart, ArrowRightLeft, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/ModuleCard';

export default function SelecionarModuloPage() {
  const { profile, user, modules, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [greeting, setGreeting] = useState('');

  // Greeting logic
  useEffect(() => {
    const updateGreeting = () => {
      const h = new Date().getHours();
      if (h < 12) setGreeting('Bom dia');
      else if (h < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  // Module stats fetching
  const { data: stats } = useQuery({
    queryKey: ['module-selection-stats'],
    refetchInterval: 30000,
    queryFn: async () => {
      const [openConfs, pendPickings, comprasPend] = await Promise.all([
        supabase.from('conferences').select('id', { count: 'exact', head: true }).is('finished_at', null),
        supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_separacao']) as any,
        supabase.from('compras_pedidos' as any).select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_andamento']) as any,
      ]);
      return {
        estoque: openConfs.count ?? 0,
        expedicao: pendPickings.count ?? 0,
        compras: comprasPend.count ?? 0,
      };
    }
  });

  const availableModules = [
    {
      id: 'estoque',
      title: 'Estoque',
      icon: Boxes,
      path: '/estoque',
      stats: stats?.estoque || 0,
      statusTemplate: (n: number) => n > 0 ? `${n} abertas` : 'Sem conferências',
      hasWarning: (n: number) => n > 0,
      ariaLabel: (n: number) => `Estoque, ${n > 0 ? `${n} conferências abertas` : 'sem conferências'}. Atalho 1.`
    },
    {
      id: 'expedicao',
      title: 'Expedição',
      icon: Truck,
      path: '/expedicao/painel',
      stats: stats?.expedicao || 0,
      statusTemplate: (n: number) => n > 0 ? `${n} em separação` : 'Sem pendências',
      hasWarning: () => false, // Neutral per requirements
      ariaLabel: (n: number) => `Expedição, ${n > 0 ? `${n} em separação` : 'sem pendências'}. Atalho 2.`
    },
    {
      id: 'compras',
      title: 'Compras',
      icon: ShoppingCart,
      path: '/compras/acompanhamentos',
      stats: stats?.compras || 0,
      statusTemplate: (n: number) => n > 0 ? `${n} em acompanhamento` : 'Tudo em dia',
      hasWarning: () => false, // Neutral per requirements
      ariaLabel: (n: number) => `Compras, ${n > 0 ? `${n} pedidos em acompanhamento` : 'tudo em dia'}. Atalho 3.`
    }
  ].filter(m => modules.includes(m.id));

  const handleEnterModule = useCallback((index: number) => {
    const mod = availableModules[index];
    if (mod) navigate(mod.path);
  }, [availableModules, navigate]);

  const handleNewConference = useCallback(() => {
    navigate('/estoque/operacao');
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      const key = e.key.toLowerCase();
      
      // Numbers 1, 2, 3
      if (['1', '2', '3'].includes(key)) {
        const idx = parseInt(key) - 1;
        if (idx < availableModules.length) {
          handleEnterModule(idx);
        }
        return;
      }

      // Arrows
      if (['arrowright', 'arrowdown'].includes(key)) {
        setActiveIndex(prev => (prev + 1) % availableModules.length);
      } else if (['arrowleft', 'arrowup'].includes(key)) {
        setActiveIndex(prev => (prev - 1 + availableModules.length) % availableModules.length);
      }

      // Enter
      if (key === 'enter') {
        handleEnterModule(activeIndex);
      }

      // N for new conference
      if (key === 'n') {
        handleNewConference();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [availableModules, activeIndex, handleEnterModule, handleNewConference]);

  const firstName = profile?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Operador';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Topbar */}
      <header className="h-[60px] bg-slate-800 shrink-0">
        <div className="max-w-[1080px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[hsl(201_96%_45%)] text-[hsl(var(--navy-2))] grid place-items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6v12 M8 6v12 M12 6v12 M16 6v12 M20 6v12" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-white">Pente Fino</span>
          </div>

          <button
            onClick={() => signOut().then(() => navigate('/login'))}
            aria-label="Trocar de conta"
            className="min-h-[44px] px-4 rounded-md border border-[hsl(217_33%_26%)] bg-transparent text-slate-300 text-sm font-medium flex items-center gap-2 hover:bg-[hsl(217_33%_22%)] transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Trocar conta</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center py-10 max-md:justify-start max-md:pt-6">
        <div className="container max-w-[1080px] mx-auto px-6">
          <div className="mb-6">
            <h1 className="font-bold tracking-tight text-[clamp(1.625rem,1.15rem+1.8vw,2.125rem)]">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Selecione um módulo para continuar
            </p>
          </div>

          <div className="mb-4 text-sm text-muted-foreground max-md:hidden">
            Pressione <kbd className="font-mono text-[13px] border border-border rounded px-2 py-0.5 bg-card mx-1">1</kbd> 
            <kbd className="font-mono text-[13px] border border-border rounded px-2 py-0.5 bg-card mx-1">2</kbd> 
            <kbd className="font-mono text-[13px] border border-border rounded px-2 py-0.5 bg-card mx-1">3</kbd> 
            ou navegue com <kbd className="font-mono text-[13px] border border-border rounded px-2 py-0.5 bg-card mx-1">setas</kbd> e <kbd className="font-mono text-[13px] border border-border rounded px-2 py-0.5 bg-card mx-1">Enter</kbd>.
          </div>

          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1" role="list">
            {availableModules.map((mod, idx) => (
              <ModuleCard
                key={mod.id}
                index={idx + 1}
                title={mod.title}
                icon={mod.icon}
                statusText={mod.statusTemplate(mod.stats)}
                hasWarning={mod.hasWarning(mod.stats)}
                isActive={activeIndex === idx}
                onClick={() => handleEnterModule(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                ariaLabel={mod.ariaLabel(mod.stats)}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Button 
              onClick={handleNewConference}
              className="min-h-[48px] px-[1.375rem] text-[15px] font-semibold max-md:min-h-[56px] max-md:w-full"
            >
              <Plus className="w-[18px] h-[18px] mr-2" />
              Iniciar nova conferência
            </Button>
            <span className="text-[13px] text-muted-foreground max-md:hidden">
              ou pressione <kbd className="font-mono text-[13px] border border-border rounded px-2 py-0.5 bg-card mx-1">N</kbd>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

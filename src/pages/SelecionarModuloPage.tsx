import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Boxes, Truck, ShoppingCart, ArrowRightLeft, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/ModuleCard';
import logoComb from '@/assets/logo-comb.webp';

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
      statusTemplate: (n: number) => n > 0 ? `${n} conferência${n > 1 ? 's' : ''} em aberto` : 'Nenhuma conferência em aberto',
      hasWarning: (n: number) => n > 0,
      ariaLabel: (n: number) => `Estoque, ${n > 0 ? `${n} conferências em aberto` : 'nenhuma conferência em aberto'}. Atalho 1.`
    },
    {
      id: 'expedicao',
      title: 'Expedição',
      icon: Truck,
      path: '/expedicao/painel',
      stats: stats?.expedicao || 0,
      statusTemplate: (n: number) => n > 0 ? `${n} picking${n > 1 ? 's' : ''} em separação` : 'Nada em separação agora',
      hasWarning: () => false, // Neutral per requirements
      ariaLabel: (n: number) => `Expedição, ${n > 0 ? `${n} pickings em separação` : 'nada em separação'}. Atalho 2.`
    },
    {
      id: 'compras',
      title: 'Compras',
      icon: ShoppingCart,
      path: '/compras/acompanhamentos',
      stats: stats?.compras || 0,
      statusTemplate: (n: number) => n > 0 ? `${n} pedido${n > 1 ? 's' : ''} em acompanhamento` : 'Nenhum pedido pendente',
      hasWarning: () => false, // Neutral per requirements
      ariaLabel: (n: number) => `Compras, ${n > 0 ? `${n} pedidos em acompanhamento` : 'nenhum pedido pendente'}. Atalho 3.`
    }
  ].filter(m => modules.includes(m.id));

  const handleEnterModule = useCallback((index: number) => {
    const mod = availableModules[index];
    if (mod) navigate(mod.path);
  }, [availableModules, navigate]);

  const handleNewConference = useCallback(() => {
    // navigate('/estoque/operacao'); // Removido por solicitação do usuário
  }, []);

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

      // N for new conference - Disabled by user request
      /* if (key === 'n') {
        handleNewConference();
      } */
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [availableModules, activeIndex, handleEnterModule, handleNewConference]);

  const firstName = profile?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Operador';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center py-10 max-md:justify-start max-md:pt-12">
        <div className="container max-w-[1080px] mx-auto px-6">
          {/* Centralized Branding */}
          <div className="flex flex-col items-center justify-center mb-10 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="w-16 h-16 mb-4 rounded-xl bg-transparent overflow-hidden grid place-items-center">
              <img 
                src={logoComb} 
                alt="Logo Pente Fino" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Pente Fino
            </h2>
          </div>

          <div className="mb-6">
            <h1 className="font-bold tracking-tight text-[clamp(1.625rem,1.15rem+1.8vw,2.125rem)]">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Escolha por onde começar. O status de cada módulo é atualizado em tempo real.
            </p>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" role="list">
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

          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Botão remover por solicitação do usuário */}
            </div>

            <button
              onClick={() => signOut().then(() => navigate('/login'))}
              aria-label="Trocar de conta"
              className="min-h-[44px] px-4 rounded-md border border-border bg-transparent text-muted-foreground text-xs font-medium flex items-center gap-2 hover:bg-muted transition-colors max-md:w-full max-md:justify-center"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Trocar conta</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

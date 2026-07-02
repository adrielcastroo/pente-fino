import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Warehouse,
  Table as TableIcon,
  FolderOpen,
  Package,
  PlayCircle,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OpAction {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const actions: OpAction[] = [
  { to: '/estoque/saida', label: 'Conferir saída', description: 'Bipar documento e itens', icon: Archive },
  { to: '/estoque/mapa', label: 'Consultar estoque', description: 'Localizar posições', icon: Warehouse },
  { to: '/estoque/reservas', label: 'Reservas', description: 'Visualizar e registrar reservas', icon: TableIcon },
  { to: '/estoque/cadastros', label: 'Cadastros', description: 'Consultar itens cadastrados', icon: Package },
  { to: '/estoque/historico', label: 'Histórico recente', description: 'Últimas conferências', icon: FolderOpen },
];

export default function OperacaoHomePage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const conferente = useAppStore(s => s.conferente);
  const name =
    conferente ||
    profile?.display_name ||
    user?.email?.split('@')[0] ||
    'Operador';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen p-4 md:p-6 lg:p-8 bg-background">
      <header className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm md:text-base text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{name}</h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">O que deseja fazer?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            size="lg"
            onClick={() => navigate('/estoque/conferencia')}
            className="h-12 px-5 text-base font-semibold gap-2"
            aria-label="Iniciar nova conferência"
          >
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
            Nova conferência
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/estoque/configuracoes')}
            className="h-12 px-5 text-base font-semibold"
            aria-label="Abrir configurações pessoais"
          >
            Configurações
          </Button>
        </div>
      </header>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
        role="list"
        aria-label="Ações operacionais"
      >
        {actions.map(({ to, label, description, icon: Icon }) => (
          <button
            key={to}
            type="button"
            role="listitem"
            onClick={() => navigate(to)}
            className={cn(
              'group flex flex-col items-start gap-3 rounded-md border border-border/60 bg-card',
              'p-5 md:p-6 min-h-[140px] text-left',
              'transition-all duration-150 hover:border-primary/60 hover:bg-primary/5',
              'active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
            aria-label={label}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              aria-hidden="true"
            >
              <Icon className="h-7 w-7" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground leading-tight">
                {label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

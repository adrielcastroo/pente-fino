import { useNavigate } from 'react-router-dom';
import { PlayCircle, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface HubAction {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface ModuleHubProps {
  /** Título contextual, ex.: "O que deseja fazer?" */
  question?: string;
  /** Rota do CTA principal (Nova conferência). */
  primaryCtaTo: string;
  /** Rota de configurações do módulo. */
  settingsTo: string;
  /** Ações do grid. */
  actions: HubAction[];
  /** Rótulos de acessibilidade dos aria-label. */
  ariaGridLabel?: string;
  /** Nome exibido; se omitido, deriva do store/auth. */
  nameOverride?: string;
}

/**
 * Hub compartilhado entre módulos (Estoque, Expedição, …).
 * Espelha a mesma "casca" visual — header + grid de ações — para
 * garantir consistência de design system.
 */
export default function ModuleHub({
  question = 'O que deseja fazer?',
  primaryCtaTo,
  settingsTo,
  actions,
  ariaGridLabel = 'Ações operacionais',
  nameOverride,
}: ModuleHubProps) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const conferente = useAppStore(s => s.conferente);
  const name =
    nameOverride ||
    conferente ||
    profile?.display_name ||
    user?.email?.split('@')[0] ||
    'Operador';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <main className="min-h-full p-4 md:p-6 lg:p-8 bg-background">
      <header className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm md:text-base text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">{name}</h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">{question}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            size="lg"
            onClick={() => navigate(primaryCtaTo)}
            className="h-12 px-5 text-base font-semibold gap-2"
            aria-label="Iniciar nova conferência"
          >
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
            Nova conferência
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(settingsTo)}
            className="h-12 px-5 text-base font-semibold"
            aria-label="Abrir configurações"
          >
            Configurações
          </Button>
        </div>
      </header>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
        role="list"
        aria-label={ariaGridLabel}
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

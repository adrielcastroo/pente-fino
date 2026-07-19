import { useNavigate } from 'react-router-dom';
import { ScanLine, TreePine, Zap, ArrowRight, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

type HubOption = {
  to: string;
  label: string;
  description: string;
  icon: typeof ScanLine;
};

const options: HubOption[] = [
  {
    to: '/estoque/tecido',
    label: 'Tecido',
    description: 'Bipar etiquetas de rolos de tecido e registrar conferência.',
    icon: ScanLine,
  },
  {
    to: '/estoque/madeira',
    label: 'Madeira',
    description: 'Conferir lâminas, bases e bandôs por lote mestre.',
    icon: TreePine,
  },
  {
    to: '/estoque/motor',
    label: 'Motor / Controle',
    description: 'Bipar números de série de motores, controles e coulisses.',
    icon: Zap,
  },
  {
    to: '/estoque/componentes',
    label: 'Componentes',
    description: 'Bipar código do componente e informar quantidade por pacote.',
    icon: Package,
  },
];

export default function ConferenciaHubPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 w-full min-w-0">
      <PageHeader title="Conferência" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map(({ to, label, description, icon: Icon }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className={cn(
              'group relative text-left rounded-lg border border-border bg-card p-5 transition-colors',
              'hover:border-primary/50 hover:bg-accent/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border">
                <Icon className="w-5 h-5 text-foreground" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <ArrowRight
                className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">{label}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

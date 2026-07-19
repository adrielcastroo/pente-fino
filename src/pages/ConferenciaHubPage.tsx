import { useNavigate } from 'react-router-dom';
import { ScanLine, TreePine, Zap, ArrowRight, Package } from '@/components/icons';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

type HubOption = {
  to: string;
  label: string;
  description: string;
  icon: typeof ScanLine;
  accent: string;
};

const options: HubOption[] = [
  {
    to: '/estoque/tecido',
    label: 'Tecido',
    description: 'Bipar etiquetas de rolos de tecido e registrar conferência.',
    icon: ScanLine,
    accent: 'from-sky-500/20 to-cyan-500/10 border-sky-500/30',
  },
  {
    to: '/estoque/madeira',
    label: 'Madeira',
    description: 'Conferir lâminas, bases e bandôs por lote mestre.',
    icon: TreePine,
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
  },
  {
    to: '/estoque/motor',
    label: 'Motor / Controle',
    description: 'Bipar números de série de motores, controles e coulisses.',
    icon: Zap,
    accent: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/30',
  },
  {
    to: '/estoque/componentes',
    label: 'Componentes',
    description: 'Bipar código do componente e informar quantidade por pacote.',
    icon: Package,
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
  },
];

export default function ConferenciaHubPage() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Conferência"
        subtitle="Escolha o tipo de item que deseja bipar."
        className="mb-8"
      />


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map(({ to, label, description, icon: Icon, accent }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className={cn(
              'group relative text-left rounded-2xl border bg-gradient-to-br p-6 transition-all',
              'hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              accent
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-background/60 backdrop-blur flex items-center justify-center">
                <Icon className="w-6 h-6 text-foreground" strokeWidth={2} aria-hidden="true" />
              </div>
              <ArrowRight
                className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold mb-1">{label}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

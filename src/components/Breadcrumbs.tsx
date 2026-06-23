import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const LABELS: Record<string, string> = {
  dashboard: 'Início',
  conferencia: 'Conferência',
  tecido: 'Tecido',
  madeira: 'Madeira',
  motor: 'Motor/Controle',
  saida: 'Saída',
  estoque: 'Estoque',
  reservas: 'Reservas',
  historico: 'Histórico',
  cadastros: 'Cadastros',
  auditoria: 'Auditoria',
  configuracoes: 'Configurações',
};

const CONFERENCIA_CHILDREN = new Set(['tecido', 'madeira', 'motor']);

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return null;
  }

  const crumbs = segments.map((seg, i) => {
    const to = '/' + segments.slice(0, i + 1).join('/');
    const label = LABELS[seg] ?? decodeURIComponent(seg);
    const isLast = i === segments.length - 1;
    return { to, label, isLast };
  });

  return (
    <nav
      aria-label="Trilha de navegação"
      className="hidden lg:flex items-center gap-1.5 px-6 py-2 text-xs text-muted-foreground border-b border-border/30 bg-background/40"
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-primary transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Início</span>
      </Link>
      {crumbs.map((c) => (
        <span key={c.to} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 opacity-50" />
          {c.isLast ? (
            <span className={cn('font-semibold text-foreground')}>{c.label}</span>
          ) : (
            <Link to={c.to} className="hover:text-primary transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { atLeast } from '@/lib/permissions';
import { useAuth } from '@/hooks/use-auth';

const COMPACT_KEY = 'pf_compactMode';

function applyCompact(on: boolean) {
  const root = document.documentElement;
  root.classList.toggle('compact', on);
  try { localStorage.setItem(COMPACT_KEY, on ? '1' : '0'); } catch { /* noop */ }
}

/**
 * Floating Action Button — quick switch between Estoque ↔ Expedição
 * plus a compact-mode toggle. Hidden on mobile to avoid clashing with BottomTabBar.
 */
export default function ModuleSwitchFab() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth() as any;
  const [compact, setCompact] = useState<boolean>(() => {
    try { return localStorage.getItem(COMPACT_KEY) === '1'; } catch { return false; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => { applyCompact(compact); }, [compact]);

  // Only users com acesso a expedição podem trocar (usa mesma regra do RoleHomeRedirect)
  const canSwitch = atLeast(role, 'supervisor');
  if (!canSwitch) return null;

  // Esconder em telas de seleção/login
  if (pathname.startsWith('/selecionar-modulo') || pathname.startsWith('/login')) return null;

  const target = '/selecionar-modulo';
  const targetLabel = 'Trocar de módulo';

  return (
    <div className="hidden desktop:flex tablet-landscape:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-2">
      {open && (
        <button
          type="button"
          onClick={() => setCompact((v) => !v)}
          className="h-10 px-3 rounded-full bg-card border border-border shadow-md flex items-center gap-2 text-xs font-medium text-foreground hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2"
          aria-label={compact ? 'Sair do modo compacto' : 'Ativar modo compacto'}
        >
          {compact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          {compact ? 'Modo normal' : 'Modo compacto'}
        </button>
      )}
      {open && (
        <button
          type="button"
          onClick={() => { setOpen(false); navigate(target); }}
          className="h-10 px-3 rounded-full bg-card border border-border shadow-md flex items-center gap-2 text-xs font-medium text-foreground hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2"
          aria-label={targetLabel}
        >
          <ArrowLeftRight className="w-4 h-4" />
          {targetLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'rotate-180'
        )}
        aria-label="Ações rápidas"
        aria-expanded={open}
      >
        <ArrowLeftRight className="w-5 h-5" />
      </button>
    </div>
  );
}

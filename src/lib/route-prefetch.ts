// Prefetch lazy page modules on user intent (hover / focus on nav links).
// Each entry returns the same dynamic import used in App.tsx, so Vite serves
// the already-fetched chunk instantly when the user actually navigates.

type Prefetcher = () => Promise<unknown>;

const prefetchers: Record<string, Prefetcher> = {
  '/dashboard': () => import('@/pages/DashboardPage'),
  '/tecido': () => import('@/pages/TecidoPage'),
  '/madeira': () => import('@/pages/MadeiraPage'),
  '/motor': () => import('@/pages/MotorControlePage'),
  '/estoque': () => import('@/pages/EstoquePage'),
  '/saida': () => import('@/pages/SaidaPage'),
  '/reservas': () => import('@/pages/ReservasPage'),
  '/historico': () => import('@/pages/HistoricoPage'),
  '/configuracoes': () => import('@/pages/SettingsPage'),
  '/cadastros': () => import('@/pages/CadastrosPage'),
};

const done = new Set<string>();

export function prefetchRoute(path: string): void {
  if (done.has(path)) return;
  const fn = prefetchers[path];
  if (!fn) return;
  done.add(path);
  // Fire and forget; swallow errors so a failed prefetch never breaks UX.
  fn().catch(() => done.delete(path));
}

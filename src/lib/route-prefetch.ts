/**
 * Route prefetch registry — dispara o dynamic import da página no hover/focus
 * do link e no idle após o mount. Cada import é feito uma única vez (o
 * bundler cacheia o módulo) e resolve praticamente instantâneo depois.
 */

type Loader = () => Promise<unknown>;

// Mapa path → loader. Cobre rotas mais quentes; rotas ausentes são no-op.
const registry: Record<string, Loader> = {
  // Estoque
  '/estoque/operacao': () => import('@/pages/OperacaoHomePage'),
  '/estoque/dashboard': () => import('@/pages/DashboardPage'),
  '/estoque/conferencia': () => import('@/pages/ConferenciaHubPage'),
  '/estoque/tecido': () => import('@/pages/TecidoPage'),
  '/estoque/madeira': () => import('@/pages/MadeiraPage'),
  '/estoque/motor': () => import('@/pages/MotorControlePage'),
  '/estoque/mapa': () => import('@/pages/EstoquePage'),
  '/estoque/saida': () => import('@/pages/SaidaPage'),
  '/estoque/entradas': () => import('@/pages/EntradasPage'),
  '/estoque/reservas': () => import('@/pages/ReservasPage'),
  '/estoque/rastreamento': () => import('@/pages/RastreamentoPage'),
  '/estoque/transferencias': () => import('@/pages/TransferenciasPage'),
  '/estoque/historico': () => import('@/pages/HistoricoPage'),
  '/estoque/cadastros': () => import('@/pages/CadastrosPage'),
  '/estoque/auditoria': () => import('@/pages/AuditoriaPage'),
  '/estoque/minha-atividade': () => import('@/pages/MinhaAtividadePage'),
  '/estoque/configuracoes': () => import('@/pages/SettingsPage'),
  // Expedição
  '/expedicao/operacao': () => import('@/pages/expedicao/OperacaoHomePage'),
  '/expedicao/painel': () => import('@/pages/expedicao/PainelPage'),
  '/expedicao/conferencia': () => import('@/pages/expedicao/ConferenciaPage'),
  '/expedicao/romaneio': () => import('@/pages/expedicao/RomaneioPage'),
  '/expedicao/dashboard': () => import('@/pages/expedicao/DashboardOperacionalPage'),
  '/expedicao/logistica': () => import('@/pages/expedicao/DashboardLogisticoPage'),
  '/expedicao/carrinhos': () => import('@/pages/expedicao/CarrinhosPage'),
  '/expedicao/historico': () => import('@/pages/expedicao/HistoricoPage'),
  '/expedicao/relatorios': () => import('@/pages/expedicao/RelatoriosPage'),
  '/expedicao/etiquetas': () => import('@/pages/expedicao/EtiquetasPage'),
  '/expedicao/double-check': () => import('@/pages/expedicao/DoubleCheckPage'),
  // Compras
  '/compras/acompanhamentos': () => import('@/pages/compras/AcompanhamentosPage'),
  '/compras/acompanhamentos/starcolor': () => import('@/pages/compras/StarcolorPage'),
  // Admin
  '/admin': () => import('@/pages/admin/AdminPanelPage'),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string): void {
  if (prefetched.has(path)) return;
  const loader = registry[path];
  if (!loader) return;
  prefetched.add(path);
  // Silencia falhas de rede — é só otimização.
  loader().catch(() => prefetched.delete(path));
}

/** Dispara prefetch em idle para uma lista de paths (ex.: itens visíveis da sidebar). */
export function prefetchOnIdle(paths: string[], delayMs = 1500): void {
  if (typeof window === 'undefined') return;
  const run = () => paths.forEach(prefetchRoute);
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) ric(run, { timeout: delayMs + 2000 });
  else window.setTimeout(run, delayMs);
}

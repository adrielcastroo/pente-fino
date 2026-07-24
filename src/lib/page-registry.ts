/**
 * Catálogo central de páginas do app.
 * Cada `page_key` é a chave persistida em `team_page_permissions.page_key`.
 * `path` é o caminho canônico usado para o guard de rota.
 */

export type PageModule = 'estoque' | 'expedicao' | 'compras';

export interface PageEntry {
  key: string;
  label: string;
  module: PageModule;
  path: string;
}

export const PAGE_REGISTRY: PageEntry[] = [
  // Estoque — Operações
  { key: 'estoque.dashboard', label: 'Dashboard', module: 'estoque', path: '/estoque/dashboard' },
  { key: 'estoque.operacao', label: 'Início', module: 'estoque', path: '/estoque/operacao' },
  { key: 'estoque.conferencia', label: 'Conferência', module: 'estoque', path: '/estoque/conferencia' },
  { key: 'estoque.saida', label: 'Saída', module: 'estoque', path: '/estoque/saida' },
  { key: 'estoque.entradas', label: 'Entradas', module: 'estoque', path: '/estoque/entradas' },
  { key: 'estoque.acabamentos', label: 'Acabamentos', module: 'estoque', path: '/estoque/acabamentos' },
  // Estoque — Estoque
  { key: 'estoque.mapa', label: 'Mapa de Estoque', module: 'estoque', path: '/estoque/mapa' },
  { key: 'estoque.reservas', label: 'Reservas', module: 'estoque', path: '/estoque/reservas' },
  { key: 'estoque.transferencias', label: 'Transferências', module: 'estoque', path: '/estoque/transferencias' },
  { key: 'estoque.historico', label: 'Histórico', module: 'estoque', path: '/estoque/historico' },
  // Estoque — Admin
  { key: 'estoque.cadastros', label: 'Cadastros', module: 'estoque', path: '/estoque/cadastros' },
  { key: 'estoque.auditoria', label: 'Auditoria', module: 'estoque', path: '/estoque/auditoria' },

  // Expedição
  { key: 'expedicao.operacao', label: 'Início', module: 'expedicao', path: '/expedicao/operacao' },
  { key: 'expedicao.painel', label: 'Painel', module: 'expedicao', path: '/expedicao/painel' },
  { key: 'expedicao.conferencia', label: 'Conferência', module: 'expedicao', path: '/expedicao/conferencia' },
  { key: 'expedicao.double-check', label: 'Double-Check', module: 'expedicao', path: '/expedicao/double-check' },
  { key: 'expedicao.romaneio', label: 'Romaneio', module: 'expedicao', path: '/expedicao/romaneio' },
  { key: 'expedicao.dashboard', label: 'Dashboard Operacional', module: 'expedicao', path: '/expedicao/dashboard' },
  { key: 'expedicao.logistica', label: 'Dashboard Logístico', module: 'expedicao', path: '/expedicao/logistica' },
  { key: 'expedicao.carrinhos', label: 'Carrinhos', module: 'expedicao', path: '/expedicao/carrinhos' },
  { key: 'expedicao.etiquetas', label: 'Etiquetas', module: 'expedicao', path: '/expedicao/etiquetas' },
  { key: 'expedicao.historico', label: 'Histórico', module: 'expedicao', path: '/expedicao/historico' },
  { key: 'expedicao.relatorios', label: 'Relatórios', module: 'expedicao', path: '/expedicao/relatorios' },

  // Compras
  { key: 'compras.acompanhamentos', label: 'Acompanhamentos', module: 'compras', path: '/compras/acompanhamentos' },
  { key: 'compras.starcolor', label: 'Starcolor', module: 'compras', path: '/compras/acompanhamentos/starcolor' },
  { key: 'compras.starcolor.romaneios', label: 'Romaneios Starcolor', module: 'compras', path: '/compras/acompanhamentos/starcolor/romaneios' },
];

export const MODULE_LABEL: Record<PageModule, string> = {
  estoque: 'Estoque',
  expedicao: 'Expedição',
  compras: 'Compras',
};

const KEY_BY_PATH: Record<string, string> = PAGE_REGISTRY.reduce((acc, p) => {
  acc[p.path] = p.key;
  return acc;
}, {} as Record<string, string>);

/** Retorna o page_key para o pathname atual (ou null se não catalogado). */
export function pageKeyForPath(pathname: string): string | null {
  if (KEY_BY_PATH[pathname]) return KEY_BY_PATH[pathname];
  // Fallback: match por prefixo — /compras/acompanhamentos/starcolor/romaneios/123 mapeia para o item de romaneios.
  const sorted = Object.keys(KEY_BY_PATH).sort((a, b) => b.length - a.length);
  for (const path of sorted) {
    if (pathname === path || pathname.startsWith(path + '/')) return KEY_BY_PATH[path];
  }
  return null;
}

export function pagesByModule(): Record<PageModule, PageEntry[]> {
  const map: Record<PageModule, PageEntry[]> = { estoque: [], expedicao: [], compras: [] };
  PAGE_REGISTRY.forEach((p) => map[p.module].push(p));
  return map;
}

// Taxonomia de permissões espelhando o Auge.
// Áreas = módulos/telas. Ações = verbos aplicáveis dentro das áreas.
// Admin recebe todas as áreas/ações via bypass no banco.

export type AugeArea =
  | 'estoque'
  | 'cadastros'
  | 'transferencias'
  | 'acabamentos'
  | 'necessidade'
  | 'saidas'
  | 'entradas'
  | 'auditoria'
  | 'expedicao'
  | 'compras';

export type AugeAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'sync'
  | 'export'
  | 'ai_ask'
  | 'ai_write';

export const AUGE_AREAS: { key: AugeArea; label: string; hint?: string }[] = [
  { key: 'estoque', label: 'Estoque', hint: 'Mapa 2D, posições, lotes' },
  { key: 'cadastros', label: 'Cadastros', hint: 'Itens e vínculos com Auge' },
  { key: 'transferencias', label: 'Transferências', hint: 'Rascunhos e efetivação' },
  { key: 'acabamentos', label: 'Acabamentos', hint: 'Consulta e abreviações' },
  { key: 'necessidade', label: 'Necessidade', hint: 'Sugestões e cron' },
  { key: 'saidas', label: 'Saídas', hint: 'Estoque → produção' },
  { key: 'entradas', label: 'Entradas', hint: 'Recebimento e conferência' },
  { key: 'auditoria', label: 'Auditoria', hint: 'Logs e histórico' },
  { key: 'expedicao', label: 'Expedição', hint: 'Romaneios, cargas, carrinhos' },
  { key: 'compras', label: 'Compras', hint: 'Pedidos e Starcolor' },
];

export const AUGE_ACTIONS: { key: AugeAction; label: string; hint?: string }[] = [
  { key: 'view', label: 'Visualizar' },
  { key: 'create', label: 'Criar' },
  { key: 'edit', label: 'Editar' },
  { key: 'delete', label: 'Excluir' },
  { key: 'sync', label: 'Sincronizar com Auge' },
  { key: 'export', label: 'Exportar' },
  // { key: 'ai_ask', label: 'Consultar via Fio (IA)' },
  // { key: 'ai_write', label: 'Executar ações via Fio (IA)' },
];

export function labelForArea(k: string): string {
  return AUGE_AREAS.find((a) => a.key === k)?.label ?? k;
}
export function labelForAction(k: string): string {
  return AUGE_ACTIONS.find((a) => a.key === k)?.label ?? k;
}

export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  highlights: { type: 'feature' | 'fix' | 'improvement'; text: string }[];
}

// Newest first. Bump LATEST_VERSION when adding entries to trigger "novo" badge.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.11.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: 'Fase 7 — Expedição: cancelamento de pickings (e estorno de faturados) com motivo obrigatório, liberação do carrinho e registro automático em auditoria.' },
    ],
  },
  {
    version: '3.10.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: 'Fase 6 — Expedição: Histórico de pickings (faturados/cancelados) com filtros e busca, e impressão do Romaneio com layout dedicado.' },
    ],
  },
  {
    version: '3.9.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: 'Fase 5 — Expedição: Dashboard Operacional (KPIs do dia, status, produção 7d, tempo médio) e Dashboard Logístico (top transportadoras, regiões e cidades).' },
    ],
  },
  {
    version: '3.8.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: "Fase 4 — Expedição: Romaneio hierárquico (transportadora → região → cidade → cliente) e Faturamento com liberação do carrinho." },
    ],
  },
  {
    version: '3.7.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: "Fase 3 — Expedição: associação picking↔carrinho por dupla bipagem e conferência de peças por QR com finalização." },
    ],
  },
  {
    version: '3.6.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: 'Fase 2 — Fundação do módulo Expedição: tabelas (pickings, itens, carrinhos, transportadoras) com RLS por módulo, telas reais de Painel, Carrinhos e Configurações, e dialog de novo picking.' },
    ],
  },
  {
    version: '3.5.0',
    date: '2026-06-25',
    highlights: [
      { type: 'improvement', text: 'Fase 1C: navegação interna (sidebar, nav rail, tab bar, breadcrumbs, command palette) migrada para os links canônicos /estoque/*.' },
    ],
  },
  {
    version: '3.4.0',
    date: '2026-06-25',
    highlights: [
      { type: 'improvement', text: 'Fase 1B: rotas canônicas /estoque/* com redirects 301 das URLs legadas.' },
    ],
  },
  {
    version: '3.3.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: "Fase 1A — Bifurcação de módulos (Estoque/Expedição), seletor pós-login e layout do módulo Expedição com placeholders" },
    ],
  },
  {
    version: '3.2.1',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: "Automação de bump de versão (scripts/bump-changelog.mjs) integrada ao changelog e rodapé" },
    ],
  },
  {
    version: '3.2.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: 'Trava de NF disponível também para os modos PVT e Cortina em /tecido.' },
      { type: 'improvement', text: 'Home preenche toda a largura em notebooks/desktops (sem faixa em branco à direita).' },
    ],
  },
  {
    version: '3.1.1',
    date: '2026-06-25',
    highlights: [
      { type: 'fix', text: 'Badges do detalhe expandido em /historico usam mapa de cores canônico com variantes dark para contraste AA.' },
    ],
  },
  {
    version: '3.1.0',
    date: '2026-06-25',
    highlights: [
      { type: 'feature', text: 'Incluir item múltiplas vezes em NFs agrupadas no /historico, com auditoria preservada via triggers.' },
      { type: 'improvement', text: 'Cores padronizadas por tipo (Motor/Controle/Cortina/Coulisse/Rolo/Madeira) e botões do header uniformizados.' },
    ],
  },
  {
    version: '3.0.0',
    date: '2026-06-25',
    highlights: [
      { type: 'improvement', text: 'Rodapé ultra-compacto e oculto em páginas operacionais (/conferencia, /tecido, /motor, /madeira) para liberar área útil.' },
      { type: 'fix', text: 'Botão "Nova conferência" da home agora abre /conferencia (hub) em vez de pular direto para /tecido.' },
      { type: 'feature', text: 'Versionamento dinâmico exibido no rodapé (vX.Y.Z) seguindo SemVer: patch para bugs, minor para features, major para mudanças amplas.' },
      { type: 'feature', text: 'Webhook e orientação de etiqueta separados por tipo (Tecido / Motor) — sem mexer no n8n.' },
      { type: 'improvement', text: 'Glossário de abreviações reorganizado com cabeçalho claro e busca em tempo real.' },
      { type: 'fix', text: 'Suite de testes do projeto restaurada (40/40 verdes): mock de matchMedia e colunas de registro atualizadas.' },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-06-22',
    highlights: [
      { type: 'feature', text: 'Changelog in-app acessível pelo ícone 🔔 no topo.' },
      { type: 'feature', text: 'Comparação período a período (7d/30d/90d) no Dashboard.' },
      { type: 'feature', text: 'Glossário de abreviações com busca em tempo real.' },
      { type: 'improvement', text: 'Acessibilidade: aria-labels e respeito a prefers-reduced-motion.' },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-06-21',
    highlights: [
      { type: 'feature', text: 'Multi-seleção e ações em lote em Cadastros.' },
      { type: 'feature', text: 'Paginação real (Anterior/Próximo) substituindo "Carregar mais".' },
      { type: 'feature', text: 'Página "Minha Atividade" com KPIs diários e timeline.' },
      { type: 'feature', text: 'Deep linking para itens via /cadastros?id=UUID.' },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-06-20',
    highlights: [
      { type: 'feature', text: 'Command Palette (Ctrl+K) para navegação rápida.' },
      { type: 'improvement', text: 'Confirmação destrutiva ao deletar registros com referência a Ctrl+Z.' },
      { type: 'fix', text: 'Badge "Exportar 0" não aparece mais quando não há registros.' },
      { type: 'fix', text: 'Durações curtas exibem "< 1min" em vez de "0min".' },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-06-18',
    highlights: [
      { type: 'fix', text: 'Dashboard: ocupação de tecidos calculada corretamente.' },
      { type: 'improvement', text: 'Normalização automática de texto (TRIM/INITCAP/UPPER) em todas as inserções.' },
      { type: 'feature', text: 'Error Boundary global com botão "Tentar novamente".' },
      { type: 'feature', text: 'Monitor de conexão com toast on/offline.' },
    ],
  },
];

// Prefer the build-time injected version (always reflects the deployed bundle).
// Falls back to the top changelog entry during tests/dev where __APP_VERSION__ is absent.
export const LATEST_VERSION: string =
  (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined) ??
  CHANGELOG[0]?.version ??
  '0.0.0';
export const BUILD_TIME: string =
  typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
export const CHANGELOG_STORAGE_KEY = 'pente-fino:last-seen-changelog';

# Changelog

Todas as releases seguem SemVer (MAJOR.MINOR.PATCH). Fonte única: `src/lib/changelog.ts`.

## 4.10.1 — 2026-08-27
- 🔧 Pipeline de release: versiona package.json, gera CHANGELOG.md e cria git tag por release

## 4.10.0 — 2026-08-02
- 🐞 Fio: Restaurada a conectividade do chat através da correção das rotas de proxy das Edge Functions e normalização do transporte de mensagens.
- 🔧 Resiliência: Adicionada verificação de sanidade para payloads malformados e logs de depuração no backend do assistente.

## 4.9.0 — 2026-08-02
- ✨ Fase F — Operação & Logística: Implementação do monitor de volumetria em tempo real no dashboard admin e sincronização de releases com metadados estendidos.
- 🔧 Admin: Visão geral agora exibe codinomes e notas de release integradas ao padrão SemVer do sistema.

## 4.8.0 — 2026-08-02
- ✨ Admin: unificação do sistema de releases com codinomes estáveis e numeração SemVer em todas as visualizações.
- 🔧 Fio: persistência de chat, modo thinking com rastreamento de tarefas e comandos (/ajuda, /limpar).
- ✨ ERP: Redesenho de modais de transferências, entradas e saídas seguindo padrões industriais de alta densidade.

## 3.17.0 — 2026-06-29
- ✨ Faturamento: importação de XML de NF-e, KPIs, faturamento em lote e timeline de status

## 3.16.0 — 2026-06-29
- ✨ Pente fino /historico: edição refatorada (validação, dirty-guard, NF/posição/lote final, undo pós-save, badge Editado visível, modais e tabela padronizados ao DS, animações respeitam low-perf)

## 3.15.0 — 2026-06-26
- ✨ Design system do módulo Expedição alinhado ao Estoque (PageShell, PageHeader, StatCard, StatusBadge, TabsBar) — tokens semânticos em 100% das páginas

## 3.14.0 — 2026-06-26
- ✨ Fase 10: SLA & Notificações no painel da Expedição (badges de prazo, KPIs Atenção/Atrasados, alerta no topo e toast).

## 3.13.0 — 2026-06-25
- ✨ Fase 9 — Expedição: permissões por papel. Cancelar/Faturar/Estornar e cadastros (carrinhos, transportadoras) agora exigem Supervisor+ (Estorno = Admin) tanto na UI quanto via RLS.

## 3.12.0 — 2026-06-25
- ✨ Fase 8 — Expedição: Relatórios com filtros (período, status, transportadora, busca) e exportação para Excel e PDF.

## 3.11.0 — 2026-06-25
- ✨ Fase 7 — Expedição: cancelamento de pickings (e estorno de faturados) com motivo obrigatório, liberação do carrinho e registro automático em auditoria.

## 3.10.0 — 2026-06-25
- ✨ Fase 6 — Expedição: Histórico de pickings (faturados/cancelados) com filtros e busca, e impressão do Romaneio com layout dedicado.

## 3.9.0 — 2026-06-25
- ✨ Fase 5 — Expedição: Dashboard Operacional (KPIs do dia, status, produção 7d, tempo médio) e Dashboard Logístico (top transportadoras, regiões e cidades).

## 3.8.0 — 2026-06-25
- ✨ Fase 4 — Expedição: Romaneio hierárquico (transportadora → região → cidade → cliente) e Faturamento com liberação do carrinho.

## 3.7.0 — 2026-06-25
- ✨ Fase 3 — Expedição: associação picking↔carrinho por dupla bipagem e conferência de peças por QR com finalização.

## 3.6.0 — 2026-06-25
- ✨ Fase 2 — Fundação do módulo Expedição: tabelas (pickings, itens, carrinhos, transportadoras) com RLS por módulo, telas reais de Painel, Carrinhos e Configurações, e dialog de novo picking.

## 3.5.0 — 2026-06-25
- 🔧 Fase 1C: navegação interna (sidebar, nav rail, tab bar, breadcrumbs, command palette) migrada para os links canônicos /estoque/*.

## 3.4.0 — 2026-06-25
- 🔧 Fase 1B: rotas canônicas /estoque/* com redirects 301 das URLs legadas.

## 3.3.0 — 2026-06-25
- ✨ Fase 1A — Bifurcação de módulos (Estoque/Expedição), seletor pós-login e layout do módulo Expedição com placeholders

## 3.2.1 — 2026-06-25
- ✨ Automação de bump de versão (scripts/bump-changelog.mjs) integrada ao changelog e rodapé

## 3.2.0 — 2026-06-25
- ✨ Trava de NF disponível também para os modos PVT e Cortina em /tecido.
- 🔧 Home preenche toda a largura em notebooks/desktops (sem faixa em branco à direita).

## 3.1.1 — 2026-06-25
- 🐞 Badges do detalhe expandido em /historico usam mapa de cores canônico com variantes dark para contraste AA.

## 3.1.0 — 2026-06-25
- ✨ Incluir item múltiplas vezes em NFs agrupadas no /historico, com auditoria preservada via triggers.
- 🔧 Cores padronizadas por tipo (Motor/Controle/Cortina/Coulisse/Rolo/Madeira) e botões do header uniformizados.

## 3.0.0 — 2026-06-25
- 🔧 Rodapé ultra-compacto e oculto em páginas operacionais (/conferencia, /tecido, /motor, /madeira) para liberar área útil.
- 🐞 Botão "Nova conferência" da home agora abre /conferencia (hub) em vez de pular direto para /tecido.
- ✨ Versionamento dinâmico exibido no rodapé (vX.Y.Z) seguindo SemVer: patch para bugs, minor para features, major para mudanças amplas.
- ✨ Webhook e orientação de etiqueta separados por tipo (Tecido / Motor) — sem mexer no n8n.
- 🔧 Glossário de abreviações reorganizado com cabeçalho claro e busca em tempo real.
- 🐞 Suite de testes do projeto restaurada (40/40 verdes): mock de matchMedia e colunas de registro atualizadas.

## 2.6.0 — 2026-06-22
- ✨ Changelog in-app acessível pelo ícone 🔔 no topo.
- ✨ Comparação período a período (7d/30d/90d) no Dashboard.
- ✨ Glossário de abreviações com busca em tempo real.
- 🔧 Acessibilidade: aria-labels e respeito a prefers-reduced-motion.

## 2.5.0 — 2026-06-21
- ✨ Multi-seleção e ações em lote em Cadastros.
- ✨ Paginação real (Anterior/Próximo) substituindo "Carregar mais".
- ✨ Página "Minha Atividade" com KPIs diários e timeline.
- ✨ Deep linking para itens via /cadastros?id=UUID.

## 2.4.0 — 2026-06-20
- ✨ Command Palette (Ctrl+K) para navegação rápida.
- 🔧 Confirmação destrutiva ao deletar registros com referência a Ctrl+Z.
- 🐞 Badge "Exportar 0" não aparece mais quando não há registros.
- 🐞 Durações curtas exibem "< 1min" em vez de "0min".

## 2.3.0 — 2026-06-18
- 🐞 Dashboard: ocupação de tecidos calculada corretamente.
- 🔧 Normalização automática de texto (TRIM/INITCAP/UPPER) em todas as inserções.
- ✨ Error Boundary global com botão "Tentar novamente".
- ✨ Monitor de conexão com toast on/offline.


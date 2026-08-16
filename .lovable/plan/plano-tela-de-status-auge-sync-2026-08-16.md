# Plano: Tela de Status Auge Sync

Implementação de uma tela de monitoramento em tempo real para as sincronizações do Auge ERP, utilizando os dados da tabela `auge_sync_runs`.

## Ações
1. **Nova Página**: Criar `src/pages/admin/AugeSyncStatusPage.tsx` baseada no `AugeAdminPanel.tsx`, mas com foco total no monitoramento e histórico.
2. **Componente de Histórico**: Criar `src/components/auge/AugeSyncHistory.tsx` para listar as execuções de forma detalhada, incluindo detalhes técnicos salvos no JSON.
3. **Roteamento**: Adicionar a rota `/admin/auge-sync-status` no `src/App.tsx`.
4. **Integração no Painel Admin**: Adicionar link/botão no `AdminPanelPage.tsx` e `IntegrationsTab.tsx` para facilitar o acesso.
5. **Ação de Sync**: Permitir disparar uma nova sincronização global diretamente da tela de status.

## Detalhes Técnicos
- Utilizar `supabase.from('auge_sync_runs')` com ordenação decrescente.
- Exibir `status` (success, error, running) com cores semânticas.
- Mostrar `rows_processed`, `rows_upserted` e `duration_ms` (se disponível no JSON de detalhes).
- Responsividade: Tabela colapsável para mobile ou lista de cards.
- Realtime: Opcionalmente usar Supabase Realtime para atualizar o status sem refresh (se habilitado na tabela).

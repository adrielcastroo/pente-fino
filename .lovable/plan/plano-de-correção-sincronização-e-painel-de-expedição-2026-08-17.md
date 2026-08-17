# Plano de Correção: Sincronização e Painel de Expedição

O objetivo é resolver a falta de dados na página de Painel de Expedição, garantindo que o aplicativo sincronize corretamente as informações do Auge ERP (`record-manufactured-documents`) e as exiba no dashboard.

## Problemas Identificados
1.  **Falta de Sincronização em Massa:** O endpoint do Auge `/record-manufactured-documents` no modo DataTables (listagem) não está sendo consumido de forma automática ou periódica para alimentar o Painel.
2.  **Dependência de Bipagem:** Atualmente, os dados só entram no banco local quando uma peça é bipada individualmente no módulo de conferência.
3.  **Mapeamento de KPI:** O Painel de Expedição consulta a tabela `expedicao_pickings`, mas as peças sincronizadas do Auge vivem em `expedicao_pecas_auge_sync`.

## Plano de Ação

### 1. Backend (Edge Function `auge-sync`)
*   Implementar a lógica real na ação `expedicao_sync_prontos`.
*   Essa ação deve realizar um POST para `${AUGE_BASE_URL}/record-manufactured-documents` simulando uma requisição do DataTables para obter a listagem de todas as peças em estado "PRONTO".
*   Realizar o `UPSERT` desses dados na tabela `expedicao_pecas_auge_sync`.
*   Criar ou atualizar registros na tabela `expedicao_pickings` com base nos pedidos (`auge_pedido_codigo`) encontrados nessas peças, para que apareçam no Painel.

### 2. Frontend (Painel e Sincronização)
*   Adicionar um botão de "Sincronizar Produção" no `PainelPage.tsx` para permitir a atualização manual.
*   Garantir que o dashboard de status (`AugeSyncStatusPage.tsx`) inclua a entidade `expedicao_sync_prontos` no histórico.

### 3. Automatização
*   A sincronização em massa será disparada via cron job (se configurado) ou pelo botão manual, garantindo que o painel reflita a realidade do Auge sem depender exclusivamente da bipagem manual.

## Detalhes Técnicos
*   **Endpoint Auge:** O HAR indica que a listagem de documentos fabricados usa DataTables. Vou adaptar a função `fetchListaTagsCustomizadas` ou similar para este novo contexto.
*   **Tabelas Supabase:** 
    *   `expedicao_pecas_auge_sync`: Espelho atômico das peças do Auge.
    *   `expedicao_pickings`: Agrupador de peças por pedido/cliente para o fluxo industrial do Pente Fino.

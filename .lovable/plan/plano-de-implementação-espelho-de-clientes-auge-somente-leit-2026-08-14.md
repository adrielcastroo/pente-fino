# Plano de Implementação - Espelho de Clientes Auge (Somente Leitura)

## 🏗️ Arquitetura e Segurança
O sistema funcionará como um espelho unidirecional e rigorosamente somente leitura. Toda a lógica de escrita e atualização será isolada na Edge Function `auge-sync`, enquanto o frontend e o banco de dados (via RLS) bloquearão qualquer tentativa de modificação manual.

## 🛠️ Etapas de Implementação

### 1. Banco de Dados e Segurança (Supabase)
- **Correção da Migração:** Ajustar `20260814000000_create_auge_clientes.sql` para remover grants de `INSERT/UPDATE/DELETE` para `authenticated`. Somente `service_role` (usada pela Edge Function) terá permissão de escrita.
- **RLS Rigoroso:** Garantir que a única política existente para `authenticated` seja de `SELECT`.

### 2. Backend (Edge Function `auge-sync`)
- **Implementação do Sync:** Criar a ação `sync_clientes`.
- **Discovery de Endpoints:** Utilizar o HAR fornecido (`unilux.auge.app.har`) ou probes via `runConsultaAuge` para identificar o endpoint correto (ex: `/modComercial/cadastro/ajax/getListaClientes.php`).
- **Lógica Unidirecional:** A função processará os dados do Auge, normalizará e fará o `UPSERT` na tabela `auge_clientes`. Não haverá nenhuma rota que aceite dados de edição vindos do frontend.

### 3. Frontend (Interface Somente Leitura)
- **Nova Página de Clientes:** Criar `/estoque/clientes` (ou aba em Cadastros) focada em visualização.
- **Componentes:**
  - `ClientesTable.tsx`: Listagem com filtros e busca avançada.
  - `ClienteDetailDialog.tsx`: Exibição detalhada de todos os campos mapeados, sem inputs editáveis.
  - `SyncButton`: Ação que dispara o gatilho de sincronização técnica no backend.
- **Bloqueio de UI:** Remoção proativa de qualquer botão de "Novo", "Editar" ou "Excluir".

### 4. Auditoria e Validação
- **Verificação de RLS:** Testar tentativas de `INSERT` via console do navegador para garantir o bloqueio.
- **Lint e Build:** Garantir que não existam referências a funções de escrita de clientes.

## 📋 Relatório de Impacto
- **Tabelas Novas:** `auge_clientes`.
- **Tabelas Preservadas:** `itens_cadastro`, `estoque_posicoes`, `registros`, e todas as demais tabelas de negócio do Pente Fino.
- **Segurança:** 100% isolado via RLS e service_role.

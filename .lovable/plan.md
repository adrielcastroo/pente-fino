## Objetivo

Liberar leitura pública (anon + authenticated) de todas as tabelas que alimentam as páginas do app, mantendo escrita (insert/update/delete) restrita a usuários autenticados. Isso inclui a página `/historico` (que hoje só carrega quando o usuário está logado por causa das policies em `conferences` e `registros`).

## O que será alterado

Migração única ajustando RLS + GRANTs nas tabelas de dados do app:

**Leitura liberada para anon + authenticated, escrita só authenticated:**
- `conferences` (histórico)
- `registros` (itens bipados do histórico)
- `estoque_posicoes` (mapa 2D)
- `estoque_saidas`
- `inventory`, `inventory_configs`, `inventory_tasks`, `inventory_task_items`, `inventory_daily_limits`
- `contagem_itens_bipados`, `contagens_diarias_limite`, `historico_contagens`, `tarefas_contagem`
- `itens_cadastro` (cadastros)
- `lotes_mestres`
- `madeira_quadrantes`
- `movimentacoes_endereco`
- `operation_logs`
- `reservas`, `independent_reservations`
- `configuracoes_inventario`
- `report_logs`, `report_settings`

**NÃO alteradas (continuam privadas — contêm dados pessoais/sensíveis):**
- `profiles` (dados de usuário)
- `auth_audit_logs` (logs de autenticação)
- `ai_chat_history` (conversas privadas)

## Detalhes técnicos

Para cada tabela do grupo "leitura pública":
1. `DROP` das policies de SELECT existentes que limitam a authenticated.
2. `CREATE POLICY ... FOR SELECT TO anon, authenticated USING (true)`.
3. Manter (ou recriar) policies de INSERT/UPDATE/DELETE restritas a `authenticated`.
4. `GRANT SELECT ON public.<tabela> TO anon` (necessário no Lovable Cloud — RLS sozinho não basta).
5. Manter `GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated` e `GRANT ALL TO service_role`.

## Impacto no frontend

Nenhuma mudança de código é necessária — o cliente Supabase já usa a chave anônima quando o usuário não está logado, então as queries de leitura passarão a funcionar para convidados automaticamente. As páginas continuam mostrando os mesmos dados; apenas botões de edição/exclusão devem permanecer escondidos para visitantes (a UI já trata isso via `useAuth`).

## Fora de escopo

- Nenhuma mudança em `profiles`, `auth_audit_logs`, `ai_chat_history`.
- Nenhuma mudança em código de UI/serviços.
- Nenhuma mudança nas regras de export/importação.

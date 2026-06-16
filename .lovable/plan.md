## Situação atual

Sim, seus dados estão salvos no banco — **306 itens cadastrados** em `itens_cadastro`. Exemplos dos mais recentes:

- `003.003.155.024.2` → Screen 05 Platinum (fornecedor `3005-08-250E-B2`)
- `003.003.183.001.3` → Napoles Branco (fornecedor `YM-5301`)
- `003.003.185.001.1.1` → Blackout Napoles Branco (fornecedor `YM5301`)
- … +303 outros

## Problema

Hoje as políticas de leitura de `itens_cadastro`, `reservas` e `independent_reservations` exigem usuário **autenticado**. Por isso, quem não está logado não consegue ver nada — não atende ao seu pedido de "visível para todos".

## O que vou ajustar

Tudo é mudança de permissão no banco, sem mexer na UI.

### 1. Permitir leitura pública (anon + authenticated)

Migração que, para cada uma das 3 tabelas (`itens_cadastro`, `reservas`, `independent_reservations`):

- Substitui a policy de `SELECT` por uma permissiva: `USING (true)` para `anon` e `authenticated`.
- Adiciona `GRANT SELECT ... TO anon` (necessário no Lovable Cloud — sem isso a API rejeita mesmo com policy aberta).

### 2. Manter edição restrita a usuários logados

Policies de `INSERT`/`UPDATE`/`DELETE` continuam exigindo `auth.uid() IS NOT NULL`. Ou seja:

- Visitantes deslogados: **só visualizam**.
- Usuários logados: visualizam **e** editam, com o rastro de auditoria já implementado (quem editou, qual campo, badge âmbar na célula).

### 3. Sem mudança de código de frontend

Os hooks e páginas já fazem `SELECT *` direto via Supabase client; quando a policy abrir, eles passam a retornar dados também para sessões anônimas, sem alteração.

## Tabelas afetadas

| Tabela                    | SELECT          | INSERT/UPDATE/DELETE |
| ------------------------- | --------------- | -------------------- |
| `itens_cadastro`          | público (anon+auth) | só logados        |
| `reservas`                | público (anon+auth) | só logados        |
| `independent_reservations`| público (anon+auth) | só logados        |

## Observação de segurança

Tornar essas tabelas legíveis por `anon` significa que qualquer pessoa com a chave pública do app (que já é exposta no frontend) pode ler todo o catálogo de itens e reservas. Como você pediu explicitamente que "todas as informações sejam visíveis para todos os usuários", sigo com isso — mas é bom você confirmar que está ciente.

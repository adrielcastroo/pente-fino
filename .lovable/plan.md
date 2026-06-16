## Diagnóstico

O erro `new row violates row-level security policy for table "conferences"` aparece ao finalizar uma conferência (fluxo `archiveAndClear → apiService.archiveConference → conferenceService.insertConference`).

A tabela `public.conferences` tem 4 políticas, todas restritas ao role `authenticated`:

```
INSERT  WITH CHECK true   (authenticated)
SELECT  USING true        (authenticated)
UPDATE  USING true        (authenticated)
DELETE  USING true        (authenticated)
```

Como o `WITH CHECK` é `true`, a única forma de o INSERT falhar é **a requisição chegar sem um JWT válido de usuário autenticado** — isto é, a sessão do Supabase expirou (ou nunca existiu naquele momento). Hoje o app simplesmente tenta o insert; quando a sessão caiu silenciosamente, o PostgREST devolve o erro de RLS e o usuário perde a finalização.

Acontece com mais facilidade no `/motor` porque uma sessão de bipagem de motores costuma durar bastante tempo sem nenhuma chamada autenticada à API entre as bipagens (a fila de registros é local), então o refresh automático do token pode ter falhado/expirado antes da finalização.

## Solução (resiliente em 2 camadas)

### 1. Camada de aplicação — garantir sessão antes de gravar

Em `src/services/conferenceService.ts` e/ou um helper novo `src/services/authGuard.ts`:

- Antes de qualquer mutação em `conferences`/`registros`, chamar `supabase.auth.getSession()`.
- Se `session` for `null` ou estiver próximo de expirar (`expires_at <= now + 60s`), chamar `supabase.auth.refreshSession()`.
- Se ainda assim não houver sessão, lançar `Error('SESSION_EXPIRED')` (sem perder o estado local).
- Em `useAppStore.archiveAndClear`, tratar esse erro: manter `state.registros` intactos, exibir toast "Sessão expirada — faça login novamente para finalizar" e redirecionar para `/login?redirect=<rota-atual>` (ou abrir o modal de login).

Resultado: o usuário nunca mais perde uma conferência por sessão expirada; ele faz login e clica em finalizar de novo.

### 2. Camada de banco — RLS explícito e auditável

Migration nova:

```sql
ALTER TABLE public.conferences
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- Backfill defensivo (linhas antigas ficam NULL, que continuam visíveis a authenticated)
-- Não tornar NOT NULL para não quebrar histórico legado.

DROP POLICY IF EXISTS "Authenticated users can insert conferences" ON public.conferences;
CREATE POLICY "Authenticated users can insert conferences"
  ON public.conferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));
```

`GRANT`s já existem; não alteramos SELECT/UPDATE/DELETE para preservar o comportamento atual de histórico compartilhado.

O `DEFAULT auth.uid()` faz com que mesmo sem mudar o front-end o `created_by` seja preenchido. A condição `auth.uid() IS NOT NULL` no `WITH CHECK` torna a mensagem de erro inequívoca quando a sessão estiver ausente (continua sendo RLS, mas agora é explícito que exige usuário logado).

### 3. Mensagem amigável

No `archiveAndClear` (e em qualquer catch que receba o erro), mapear:
- `error.code === '42501'` ou mensagem contendo `row-level security` → toast "Sessão expirada. Faça login para finalizar a conferência." + ação de relogin.
- Outros erros → manter mensagem atual.

## Validação

- Logar, finalizar conferência em `/motor` com 1+ motor → sucesso, sem erro de RLS.
- Forçar `supabase.auth.signOut()` no console e tentar finalizar → toast amigável, registros preservados, redirect para login; após login, finalizar novamente funciona.
- Histórico em `/historico` continua listando conferências antigas (created_by NULL permitido para SELECT).

## Arquivos afetados

- `supabase/migrations/<timestamp>_conferences_auth_guard.sql` (novo)
- `src/services/conferenceService.ts` — guard de sessão no `insertConference`
- `src/services/authGuard.ts` (novo) — helper `ensureAuthenticatedSession()`
- `src/store/useAppStore.ts` — tratamento de `SESSION_EXPIRED` em `archiveAndClear`

## Problema

Ao exportar como visitante (não logado) ou com sessão expirada:
1. `archiveAndClear` no store chama `apiService.archiveConference` → `insertConference` → `ensureAuthenticatedSession()` lança `SessionExpiredError`.
2. O `catch` em `archiveAndClear` trata o erro, mostra um toast, agenda redirect para `/login`, mas faz `return` em vez de re-lançar.
3. No `TopBar.exportExcel`, o `await archiveAndClear(...)` resolve normalmente, então o Excel é baixado e aparece o toast verde "Exportação concluída! X registros alocados…" — mesmo sem ter salvo nada.

## Correção

**1. `src/components/TopBar.tsx` — `exportExcel`**
- Antes de chamar `archiveAndClear`, validar autenticação localmente via `useAuth` (já importado). Se `isGuest` ou `!user`, abortar com toast claro: "Faça login para exportar e salvar no histórico" + botão "Entrar" que navega para `/login`.
- Depois do `await archiveAndClear(...)`, checar `useAppStore.getState().archiveError`. Se preenchido, abortar (não baixar Excel, não mostrar toast de sucesso). O toast de erro já é exibido pelo próprio store.

**2. `src/store/useAppStore.ts` — `archiveAndClear`**
- No branch `SessionExpiredError`: manter o toast/redirect, mas também garantir que `archiveError` fique preenchido (já está) e **não** limpar `registros` (já está correto). Apenas confirmar que `lastArchivedConferenceId` permanece `null` nesse caminho.
- Limpar `archiveError` no início (`set({ isArchiving: true, archiveError: null })` — já está).

**3. Botão de exportar (TopBar)**
- Desabilitar quando `isGuest || !user`, com tooltip: "Entre na sua conta para exportar e salvar no histórico".

## Fora de escopo

- Não permitir que visitantes salvem no histórico (a política definida foi: leitura pública, escrita só autenticados).
- Nenhuma mudança de schema/RLS — as policies estão corretas; o bug é puramente de fluxo no frontend.
- Nenhuma mudança em `/historico` ou em `loadHistory`.

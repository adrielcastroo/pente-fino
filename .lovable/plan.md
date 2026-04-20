
# Fix: Aba "Equipe" causa tela branca

## Diagnóstico

O componente `TeamPanel` derruba toda a aplicação porque o hook `useTeamPresence` (em `src/hooks/use-presence.ts`) tem três problemas que causam crash não tratado:

1. **Canal Realtime duplicado** – o hook cria DOIS canais Supabase (`channel` e `sharedChannel`) com o mesmo nome base `'team-presence'`. O primeiro é instanciado mas nunca subscrito, e ainda assim é removido no cleanup, gerando warning/erro do Supabase Realtime. Pior: conflita com o canal do `usePresenceTracker` (já ativo via `Index.tsx`), que usa exatamente `'team-presence'`.
2. **Cast inseguro** – `latest as PresenceMeta` quando `metas` está vazio escreve `undefined` no mapa de presença, e `latest?.user_id` em objetos malformados (presence de listeners sem `user_id`) escreve no `else if (key)` um valor `undefined`.
3. **Render sem proteção** – qualquer exceção em `TeamPanel` ou `useTeamPresence` se propaga para o `AnimatePresence`/`SettingsPage` e então para o `Suspense` raiz, colapsando o app inteiro em tela branca (não há ErrorBoundary).

## Correções

### 1. `src/hooks/use-presence.ts` – reescrever `useTeamPresence`
- Remover o `channel` extra não utilizado.
- Usar **um único canal** dedicado ao listener com nome distinto (`team-presence-readonly`) e chave única, evitando colidir com o canal de tracking.
- Subscrever-se ao canal compartilhado de tracking (`team-presence`) **somente como leitor** via `.on('presence', ...)` antes do `.subscribe()`.
- Filtrar entradas malformadas (`if (!latest || !latest.user_id) return`) antes de escrever no mapa.
- Garantir cleanup idempotente com try/catch em `removeChannel`.

### 2. `src/components/settings/TeamPanel.tsx` – defesa em profundidade
- Tratar erro da query `profiles` exibindo mensagem amigável (atualmente erros silenciam mas o estado fica em loading inconsistente).
- Garantir que `presence[p.id]` nunca cause acesso a propriedade nula (já está coberto, mas reforçar tipos).

### 3. `src/pages/SettingsPage.tsx` – ErrorBoundary local
- Envolver o conteúdo do `motion.div` (ou pelo menos o `<TeamPanel />`) em um pequeno **ErrorBoundary** que renderiza fallback ("Não foi possível carregar este painel") ao invés de derrubar o app todo. Isso protege também futuros painéis.

### 4. Novo arquivo: `src/components/SettingsErrorBoundary.tsx`
- Componente classe simples (ErrorBoundary) reutilizável, com fallback em PT-BR seguindo o design system (rounded-2xl, bg-destructive/5).

## Resultado esperado
- Clicar em "Equipe" abre o painel sem travar.
- Lista de membros carrega com status em tempo real (Online/Ausente/Offline).
- Mesmo se o Realtime falhar, o painel mostra os membros como "Offline" em vez de derrubar o app.
- Qualquer crash futuro em painéis de Configurações fica contido pelo ErrorBoundary.

## Objetivo

Hoje o botão "Exportar" bloqueia visitantes (não autenticados). Vamos permitir que qualquer pessoa exporte a conferência e que ela seja gravada em `/historico`, mantendo a regra geral: leitura pública, edição/exclusão somente para usuários logados.

## Mudanças

### 1. Banco de dados (migration)
Atualmente `conferences` e `registros` só aceitam INSERT por `authenticated`. Vamos adicionar INSERT para `anon`:

- `conferences`: nova policy `Anyone can insert conferences` (INSERT, role `anon`, `with check true`). `created_by` continua opcional (será `null` para visitantes).
- `registros`: nova policy `Anyone can insert registros` (INSERT, role `anon`, `with check true`).
- UPDATE e DELETE continuam restritos a `authenticated` (sem alteração) → garante "editável apenas para usuários logados".
- `GRANT INSERT ON public.conferences, public.registros TO anon` para liberar o acesso via PostgREST.

Observação: as policies de SELECT públicas já existem, então a página `/historico` continua visível para todos.

### 2. Backend de serviços (TypeScript)
- `src/services/conferenceService.ts > insertConference`: remover a chamada `ensureAuthenticatedSession()`. Em vez disso, ler a sessão atual sem exigir e passar `created_by: session?.user?.id ?? null`. Visitante grava com `created_by` nulo; logado mantém o vínculo.

Os demais serviços envolvidos no fluxo de export (`registroService.insertRegistros`, `estoqueService.processEstoque` etc.) já não chamam `ensureAuthenticatedSession`, então funcionarão direto assim que as policies permitirem.

### 3. UI — `src/components/TopBar.tsx`
- Remover o bloco (linhas 57–66) que aborta o export quando `isGuest || !user`.
- Manter as validações de `CONFERENTE` e `PROCESSO` (já funcionam para visitantes — o nome do convidado preenche o conferente).
- O botão "Exportar" continua usando apenas `disabled={isArchiving || isExporting}`, então visitantes podem clicar normalmente.

## O que NÃO muda
- Editar/excluir registros e conferências existentes continua bloqueado para visitantes (policies de UPDATE/DELETE inalteradas).
- Leitura pública do histórico segue como já está.
- Nenhuma alteração em telas de admin, autenticação, ou outras páginas.

## Validação
1. Logar como visitante, bipar itens, clicar Exportar → arquivo `.xlsx` baixa e a conferência aparece em `/historico` (com conferente = nome do convidado, `created_by` nulo).
2. Como visitante, tentar editar uma linha no histórico → ação continua indisponível/bloqueada.
3. Logado: fluxo permanece idêntico ao atual, com `created_by` vinculado ao usuário.

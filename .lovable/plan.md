## Objetivo

Garantir que tanto a exclusão de **itens** quanto de **conferências** na página `/historico` exija confirmação explícita do usuário (admin).

## Situação atual

- **Excluir conferência** (`ConferenceCard` em `src/components/HistoryPanel.tsx`, linhas ~635-649 e 723-739): já existe botão e já abre um `Dialog` de confirmação ("Excluir Histórico?"). Mantém como está.
- **Excluir item** (linhas ~511-525 e `handleDeleteItem` em 665-672): hoje o clique no botão `X` dispara `deleteHistoryRegistro` **imediatamente, sem confirmação**. É o que falta.

## Mudanças

Arquivo único: `src/components/HistoryPanel.tsx`

1. Adicionar estado `confirmDeleteItem: Registro | null` no `ConferenceCard`.
2. No botão `X` da linha do registro, trocar `onClick={() => handleDeleteItem(r.id)}` por `onClick={() => setConfirmDeleteItem(r)}`.
3. Adicionar um segundo `Dialog` de confirmação ao lado do atual ("Excluir Histórico?"), no mesmo estilo visual (rounded-[2rem], ícone destructive, botões Cancelar / Excluir Agora), com texto identificando o item (ex.: `"item — lote"` ou descrição curta do registro) e avisando que a ação é permanente.
4. Ao confirmar, chamar `handleDeleteItem(confirmDeleteItem.id)` e fechar o diálogo. Cancelar apenas fecha.
5. Manter o toast de sucesso/erro existente em `handleDeleteItem`.

Nenhuma alteração em store, serviços ou banco — `deleteHistoryRegistro` e `deleteConference` já existem e funcionam.

## Fora do escopo

- Permissões (continua restrito a `isAdmin`).
- Bulk delete / seleção múltipla.
- Undo após exclusão.
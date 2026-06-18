## Problema

A tabela `estoque_posicoes` tem o check constraint `posicao BETWEEN 1 AND 30` (cada célula `estrutura.coluna.nivel` comporta no máximo 30 posições — consistente com `TOTAL_SLOTS` em `app-utils.ts`, que usa `* 30`).

Porém, em `src/services/estoqueService.ts`, a busca pela próxima posição livre usa o limite **100**:

- `getNextAvailablePosition`: `while (pos <= 100 && occupiedSet.has(pos)) pos++;` → retorna `pos <= 100`
- `processEstoque`: idem `while (pos <= 100 ...)` e depois `if (pos && pos <= 100)`

Quando uma célula passa de 30 ocupações, o serviço devolve `pos` entre 31 e 100, o `upsert` em `estoque_posicoes` viola `estoque_posicoes_posicao_check` e a exportação/salvamento da conferência quebra na página `/historico`.

## Correção

Em `src/services/estoqueService.ts`, alinhar o limite ao constraint do banco (30):

1. `getNextAvailablePosition`: trocar `while (pos <= 100 …)` por `while (pos <= 30 …)` e `return pos <= 30 ? pos : null`.
2. `processEstoque`:
   - Trocar `while (pos <= 100 …)` por `while (pos <= 30 …)`.
   - Trocar `if (pos && pos <= 100)` por `if (pos && pos <= 30)`.
   - Manter o `skippedRegs.push(...)` + toast `Atenção: N itens não couberam no endereço...` (já existe) para o usuário saber que a célula encheu.

Nada mais é alterado — sem migração de schema, sem mudar layout. Só os dois limites numéricos no serviço.

## Validação

- Repetir o fluxo que originou o erro (salvar conferência cuja célula já tem 30 itens) e confirmar:
  - Nenhum erro 23514 do Postgres.
  - Toast informa quantos itens não couberam.
  - Os demais itens (que cabem) são gravados normalmente e aparecem em `/historico`.

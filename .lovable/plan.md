## Problema

Na página `/tecido` (modo **Etiq. Pronta**), ao bipar/digitar o lote final, o sistema preenche o endereço com o valor **embutido no texto do lote** (ex.: `TEC02.A.N03`) em vez do endereço **real** onde o tecido está alocado no estoque (ex.: `TEC01.D.N05`).

Isso ocorre porque a lógica em `src/components/LeftPanel.tsx` (linhas 306–377) prioriza a extração por regex sobre a consulta ao banco, e ainda dá `return` antes do lookup quando a regex casa.

Causa secundária: o lookup ao banco só roda se o campo `item` já estiver preenchido (`.eq('item', item)`), o que normalmente não é o caso quando o usuário escaneia primeiro o lote.

## Solução proposta

Inverter a prioridade do `useEffect` de Etiq. Pronta em `src/components/LeftPanel.tsx`:

### 1. Banco em primeiro lugar

- Sempre que `etiqProntaLoteFinal` tiver pelo menos ~3 caracteres, consultar primeiro `estoque_posicoes` (e como fallback `registros`) por `lote_sistema` igual ao texto digitado.
- Remover a obrigatoriedade de `item` preenchido; usar `item` apenas como filtro adicional **se** já estiver presente.
- Se houver match no banco, preencher `item`, `endereco`, `processo`, `diversosMLinear` e `posicao` com os valores **do banco** (fonte da verdade do estoque) e exibir toast "Dados carregados do estoque".

### 2. Regex apenas como fallback

- Só executar a extração por regex (endereço/proc/M linear do texto) quando **nenhum registro for encontrado** no banco.
- Mesmo no fallback, não sobrescrever o endereço se o usuário já tiver digitado um manualmente (respeitar `lockEndereco`).

### 3. Ajustes de UX

- Manter o debounce de 800ms.
- Mostrar um toast de erro discreto ("Lote não encontrado no estoque — usando dados da etiqueta") quando cair no fallback, para o usuário saber que a posição pode não refletir o estoque.
- Garantir que o campo `posicao` seja sempre preenchido a partir do banco quando houver match.

## Arquivos afetados

- `src/components/LeftPanel.tsx` — reescrever o `useEffect` "Auto-lookup for Etiq Pronta and Smart extraction" (linhas 306–377).

Nenhuma mudança de schema, RLS ou outros componentes é necessária.

## Resultado esperado

Ao bipar o lote final `TEC02.A.N03 PROC25/090976 27M`, o sistema usará o registro de endereço do lote final do ite bipado e preencherá automaticamente o endereço no sistema (e demais campos).
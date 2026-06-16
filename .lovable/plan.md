## Ajuste de layout do campo QTD na etiqueta de tecido

### Objetivo
Permitir que o campo **QTD** da etiqueta de tecido exiba valores como `30,00 M` e `30,00 M-1` (formato sequencial) sem truncar ou quebrar o texto, mantendo o tamanho atual da fonte.

### Arquivo a alterar
`src/components/labels/LabelTemplates.tsx`

### Alterações propostas

1. **Aumentar largura da coluna QTD**
   - Atual: `w-[28%]`
   - Novo: `w-[36%]` (ou equivalente que acomode `30,00 M-1` com `fs * 3.2`)

2. **Reduzir padding interno da coluna QTD**
   - Atual: `p-1`
   - Novo: `px-1 py-0.5` (ou `p-0.5`) para maximizar espaço horizontal interno

3. **Garantir exibição em uma única linha**
   - Substituir `truncate` por `whitespace-nowrap` no valor do QTD, evitando corte com `...` e garantindo que o texto completo seja visível

4. **Compensar largura na coluna do meio (RNP/DATA)**
   - A coluna do meio usa `flex-1` e deve se ajustar automaticamente
   - Reduzir a largura da coluna do QR Code de `w-[22%]` para `w-[20%]` se necessário para equilibrar o layout, ou manter se o espaço for suficiente

5. **Manter tamanhos de fonte inalterados**
   - `QTD:` label continua em `fs * 3`
   - Valor continua em `fs * 3.2`

### Exemplo de resultado esperado
O layout continua com a mesma estrutura, mas o campo QTD tem espaço suficiente para exibir `30,00 M-1` completo, sem quebras ou truncamento, mantendo a legibilidade e o tamanho da fonte atual.



## Plano: Corrigir validação M² e formatação do Endereço

### Problema 1: Mensagem "Preencha M²" mesmo com campo preenchido
A validação (linha 366) verifica `mLinear <= 0`, mas `mLinear` é calculado como `m2 / largura`. Se a largura não é extraída do item (ex: código sem padrão reconhecido), `largura = 0` → `mLinear = 0` → erro aparece mesmo com M² preenchido.

**Correção em `src/components/LeftPanel.tsx`:**
- Quando `usesM2Input` é true e `m2Num > 0` mas `largura === 0`, mostrar mensagem específica: "Largura não detectada no item. Verifique o código."
- Quando `usesM2Input` e `m2Num <= 0`, manter mensagem sobre M²
- Quando modo usa entrada direta de M Linear e valor ≤ 0, manter mensagem sobre M Linear

### Problema 2: Ponto do Endereço após 4 caracteres em vez de 5
Atualmente `formatEndereco` insere ponto após 4 chars (`TEC0.1.AN03`). O correto é após 5 chars (`TEC01.A.N03`).

**Correção em `src/components/LeftPanel.tsx`:**
- Alterar `formatEndereco`:
  - `clean.length <= 5` → retorna limpo
  - `clean.length <= 6` → `slice(0,5) + '.' + slice(5)`
  - `> 6` → `slice(0,5) + '.' + slice(5,6) + '.' + slice(6)`
- Atualizar `ENDERECO_REGEX` de `{4}` para `{5}`: `/^[A-Z0-9]{5}\.[A-Z0-9]\.[A-Z0-9]+$/`
- Atualizar mensagem de erro para refletir novo padrão: `'Padrão: TEC01.A.N03'`

### Arquivos afetados
- `src/components/LeftPanel.tsx` — formatEndereco, ENDERECO_REGEX, validação handleAdd


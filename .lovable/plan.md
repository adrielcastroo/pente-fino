

## Plano: Lote Sistema duplicatas por item, formatação M Linear, Celular M²÷3.05, melhorias de design

### 1. Sufixo serial no Lote Sistema baseado em item+endereço+proc+metragem idênticos

**`src/store/useAppStore.ts` — `generateLoteSistema`:**
- Atualmente: compara apenas `endereco + PROC/NF + mLinear` para gerar sufixo `-1`, `-2`, etc.
- Novo: adicionar parâmetro `item` à função. A comparação de duplicatas deve considerar `item + endereco + PROC/NF + mLinear`. Somente quando TODOS esses campos forem idênticos, adicionar o sufixo serial.
- Atualizar todas as chamadas de `generateLoteSistema` (em `LeftPanel.tsx`, `useAppStore.ts` — `archiveAndClear` e `updateHistoryRegistro`) para passar o `item`.

### 2. Formatação M Linear: remover ",0" (29,0M → 29M)

**`src/store/useAppStore.ts` — `fmtML`:**
- Atualmente: `v.toFixed(1).replace('.', ',') + 'M'` → gera "29,0M"
- Corrigir: se `v % 1 === 0`, já retorna inteiro. Verificar que a condição cobre corretamente valores como 29.0 (que `% 1 === 0` já cobre). A lógica atual já deveria funcionar — vou verificar se há um bug com floats tipo `29.000000001`. Usar `Math.round` para valores muito próximos de inteiros, ou simplesmente checar `parseFloat(v.toFixed(1)) % 1 === 0`.

### 3. Coulisse: melhorar chave M²/M Linear

**`src/components/LeftPanel.tsx`:**
- Substituir o botão toggle atual por dois botões lado a lado mais claros:
  - `[M² → M Linear]` e `[M Linear direto]` como segmented control (similar ao mode toggle)
- Manter a trava ao lado

### 4. Diversos — Celular/Plissada: trocar M Linear por M² ÷ 3.05

**`src/components/LeftPanel.tsx`:**
- `isCelular` atualmente usa campo M Linear direto
- Mudar para: campo M² (input), calcular `mLinear = m2 / 3.05` automaticamente
- Exibir o M Linear calculado abaixo do campo
- Atualizar `usesM2Input` para incluir `isCelular` (remover da condição de exclusão)
- Largura fixa = 3.05 para Celular (não precisa de campo)
- Atualizar validação: verificar `m2 > 0` em vez de `mLinear > 0` para Celular

**`src/lib/registroColumns.ts`:**
- Atualizar layout `celular`: trocar `'mLinear'` por `'m2', 'mLinear'` → `['item', 'processo', 'm2', 'mLinear', 'lote', 'loteSistema']`

### 5. Design: lixeira → "Limpar campos"

**`src/components/LeftPanel.tsx` (linha ~472):**
- Substituir ícone `Trash2` + tooltip por texto `Limpar campos` com ícone menor ou sem ícone

### 6. Design: botões do histórico + confirmação de exclusão

**`src/components/HistoryPanel.tsx`:**
- Melhorar botões Download e Delete no `ConferenceCard`: adicionar labels textuais ou tooltips mais visíveis, melhorar espaçamento
- Substituir `confirm()` nativo por `Dialog` do shadcn para confirmação de exclusão de pasta
- Mesmo para "Limpar tudo"

### 7. Modelo de tecido na pasta de histórico

**`src/components/HistoryPanel.tsx` — `ConferenceCard`:**
- Extrair os tipos de tecido únicos dos registros da conferência (`tipoTecido` e `modoOrigem`)
- Exibir como badges ao lado do nome da pasta (ex: "Coulisse", "Rolo", "PVT", "Celular", "IA")

### Arquivos afetados
- `src/store/useAppStore.ts` — `generateLoteSistema` (adicionar item), `fmtML` (formatação)
- `src/components/LeftPanel.tsx` — Celular M², toggle Coulisse, limpar campos
- `src/components/HistoryPanel.tsx` — confirmação dialog, botões, badges de modelo
- `src/lib/registroColumns.ts` — layout celular




## Plano: Coulisse — campo largura opcional, divisão M², chave m²/m linear

### 1. Adicionar campo "Largura" opcional ao Coulisse

**`src/components/LeftPanel.tsx`:**
- Adicionar estado `manualLargura` (string) para entrada manual de largura no Coulisse
- Exibir campo "Largura (m)" abaixo do Item no modo Coulisse (não obrigatório)
- Se `manualLargura` estiver preenchido, usar esse valor; senão, usar `extractLarguraFromItem(item)` como fallback
- Atualizar `resetForm` para limpar `manualLargura`

### 2. Chave de escolha: M² ou M Linear

**`src/components/LeftPanel.tsx`:**
- Adicionar estado `coulisseMetragem`: `'m2' | 'mlinear'` (default `'m2'`)
- Adicionar estados de trava: `lockMetragem` (boolean) para travar a escolha entre sessões de bipagem
- Renderizar toggle (similar ao lock de PROC/NF) acima do campo de metragem no Coulisse
- Quando `'m2'`: mostra campo M², calcula `mLinear = m2 / largura`
- Quando `'mlinear'`: mostra campo M Linear direto (igual PVT/Celular), sem necessidade de largura

### 3. Ajustar lógica de validação e cálculo

**`src/components/LeftPanel.tsx`:**
- `largura` no Coulisse: `manualLargura || extractLarguraFromItem(item)` (só usado quando metragem = m²)
- `mLinear` no Coulisse com m²: `m2 / largura`
- `mLinear` no Coulisse com mlinear: valor digitado direto
- Validação: se metragem = m² e largura = 0, mostrar aviso; se metragem = mlinear, validar apenas valor > 0

### 4. Layout de colunas

**`src/lib/registroColumns.ts`:**
- Adicionar `'largura'` ao layout `coulisse`: `['item', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'loteSistema']`

### Arquivos afetados
- `src/components/LeftPanel.tsx` — campo largura, toggle m²/mlinear, trava, validação
- `src/lib/registroColumns.ts` — layout coulisse


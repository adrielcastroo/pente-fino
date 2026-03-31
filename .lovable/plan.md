

## Plan: Conferente no Mobile, Layout IA e Lote Final

### 1. Conferente visível em mobile/tablet
**TopBar.tsx**: Remove `hidden sm:flex` do campo Conferente para que apareça em todos os dispositivos. Ajustar largura para caber na barra em telas menores.

### 2. Campo IA — layout exclusivo com subcampos corretos
**LeftPanel.tsx**: No modo IA, após processar a imagem, mostrar apenas 3 subcampos editáveis:
- **Item/Referência** (preenchido pela IA via `item`)
- **M Linear** (preenchido pela IA — renomear de M² para M Linear no modo IA)
- **Largura** (preenchido pela IA via `width ÷ 100`)

O `applyResult` será atualizado para preencher diretamente esses 3 campos no formulário. No modo IA, os campos Lote/Batch e M² ficam ocultos, e o formulário mostra Item + M Linear + Largura + Endereço.

### 3. Lote Final — ordem corrigida
**useAppStore.ts** (`generateLoteSistema`): Alterar a ordem de `PROC + Endereço + M Linear` para:
```
Endereço + PROC + M Linear
```
Exemplo: `TEC01.A.N03 22568/26 32M`

Mesma mudança refletida no preview do Lote Sistema no `LeftPanel.tsx`.

### 4. Excel — Lote Final na nova ordem
**TopBar.tsx** e **RightPanel.tsx**: Nenhuma mudança nas colunas do Excel (já usa `loteSistema`), apenas o valor gerado muda pela alteração no store.

### Arquivos alterados
- `src/components/TopBar.tsx` — campo Conferente visível em mobile
- `src/components/LeftPanel.tsx` — layout exclusivo do modo IA com 3 subcampos
- `src/store/useAppStore.ts` — `generateLoteSistema` com ordem Endereço + PROC + M Linear


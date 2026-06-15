## Ajustes na Etiqueta Tecido

### Objetivo
Aumentar levemente a seção "LOTE", diminuir as seções inferiores, e aplicar layout vertical no título "LOTE" com o valor abaixo e visível por completo.

### Alterações em `src/components/labels/LabelTemplates.tsx`

1. **Aumentar altura da seção LOTE**
   - Mudar `flex-[0.4]` para `flex-[0.5]` na linha 93.
   - Isso aumenta a proporção vertical dedicada ao lote, garantindo espaço para o valor aparecer completamente.

2. **Aplicar layout vertical no título LOTE**
   - Container: `flex flex-col justify-start gap-0.5` (coluna, grudado no topo).
   - Badge "LOTE": fonte reduzida para `${fs * 1.8}px`, sem `shrink-0`, com `w-fit leading-none`.
   - Valor do lote: posicionado abaixo do badge, fonte `${fs * 3.5}px`, com `whitespace-normal leading-tight` para exibir o valor completo sem corte.

3. **Diminuir seções inferiores**
   - Mudar `flex-[1.3]` para `flex-[1.2]` na linha 102.
   - Compensa o aumento da seção LOTE mantendo o total equilibrado.

Nenhuma outra alteração necessária.

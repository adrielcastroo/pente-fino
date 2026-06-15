## Ajustes na Etiqueta Tecido

### Objetivo
Reduzir a altura da seção "LOTE" e descer levemente o conteúdo da seção superior (SKU + QR SKU).

### Alterações em `src/components/labels/LabelTemplates.tsx`

1. **Reduzir altura da seção LOTE**
   - Mudar `flex-[0.6]` para `flex-[0.4]` na linha 93.
   - Isso diminui a proporção vertical dedicada ao lote, liberando espaço para as demais seções.

2. **Descer levemente SKU e QR SKU**
   - Aumentar o padding-top da coluna SKU (esquerda): `p-2` → `py-3 px-2` (linha 69).
   - Aumentar o padding-top da coluna QR SKU (direita): `p-2` → `py-3 px-2` (linha 84).
   - Ambos descem uniformemente, mantendo o alinhamento entre si.

Nenhuma outra alteração necessária.
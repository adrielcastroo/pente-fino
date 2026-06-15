## Ajuste do Layout do Título "LOTE" na Etiqueta Tecido

### Objetivo
Alterar a seção de lote da etiqueta Tecido para que o título "LOTE" fique posicionado acima do valor (ex: "NFe 148551"), com fonte menor, replicando fielmente o layout da imagem de referência.

### Alterações

**Arquivo:** `src/components/labels/LabelTemplates.tsx`

Na seção `TecidoPreview`, no bloco `{has("nfe") && (...)}`:

1. **Layout vertical**: Mudar de `flex items-center gap-2` para `flex flex-col justify-center gap-1`
2. **Título menor**: Reduzir `fontSize` do badge "LOTE" de `${fs * 4.5}px` para `${fs * 2.5}px`
3. **Valor abaixo**: O valor do lote permanece grande (`${fs * 4.5}px`) e fica posicionado abaixo do badge
4. **Ajuste de padding**: Reduzir `px-2 py-1` se necessário para manter proporção compacta

### Resultado Esperado
- Badge "LOTE" pequeno, preto com texto branco, posicionado no topo da seção
- Valor do lote (ex: "NFe 148551") abaixo, em fonte grande
- Layout 1:1 com a imagem de referência fornecida

### Fora de Escopo
- Alterações em MotorPreview
- Alterações em bordas, fontes de outros elementos, ou webhook
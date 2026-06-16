### Ajuste da fonte da descrição na etiqueta 100×60 (Tecido)

**Objetivo:** Reduzir o tamanho da fonte da descrição do item na etiqueta de tecido (100 mm × 60 mm) para que mais caracteres caibam em cada linha, evitando que o texto seja cortado pelo `line-clamp-2`.

**Mudança:**
- Arquivo: `src/components/labels/LabelTemplates.tsx`
- Linha: 76
- Alterar o multiplicador da fonte da descrição de `fs * 3.5` para `fs * 2.5`.
- O limite de 2 linhas (`line-clamp-2`) será mantido conforme solicitado.

**Resultado esperado:**
- Cada linha da descrição comportará mais caracteres.
- Textos longos terão menor chance de serem cortados ou truncados.
- A legibilidade será preservada dentro da resolução típica de impressoras térmicas (203 dpi).
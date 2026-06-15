# Ajuste: preview proporcional e fiel ao PNG da etiqueta

## Problema

Hoje o preview em `LabelLayoutPanel.tsx` usa uma escala fixa (`scale = 5.2` para motor, `3.2` para tecido) e a base `fs` (font-size) é o `labelSettings.fontSize` puro (sem relação com mm). Resultado:

- Tecido e Motor usam escalas diferentes → tamanhos relativos errados entre si.
- Os multiplicadores de fonte (`fs * 3`, `fs * 2.2`, etc.) não acompanham a dimensão real da etiqueta — uma etiqueta de 60mm fica com a mesma fonte de uma de 100mm.
- O preview não reflete o PNG real (renderizado a 8 px/mm em `labelRenderer.ts`).

## Solução

Renderizar o preview **na mesma escala do PNG final (8 px/mm)** e aplicar `transform: scale(...)` para caber no painel. Assim qualquer alteração visual ali é exatamente o que sai impresso.

### Mudanças

**1. `src/components/labels/LabelTemplates.tsx`**
- Exportar uma constante `LABEL_PX_PER_MM = 8` (mesmo valor de `TARGET_PX_PER_MM` do renderer).
- Os `Preview` continuam recebendo `wPx`/`hPx`/`fs`, sem mudança de API.

**2. `src/services/labelRenderer.ts`**
- Trocar `PREVIEW_SCALE = 5.2` por `LABEL_PX_PER_MM` importado de `LabelTemplates`.
- `wPx = w * LABEL_PX_PER_MM` (idem `hPx`) — fonte base passa a ser calculada a partir do `labelSettings.fontSize` em **mm proporcional** (ver item 3).

**3. Fonte base proporcional**
- O `labelSettings.fontSize` hoje é tratado como "px" arbitrário. Vamos interpretá-lo como **pt** (1pt ≈ 1/72in ≈ 0,353mm) e converter para px usando `LABEL_PX_PER_MM`:
  `fsPx = fontSize * (LABEL_PX_PER_MM / 2.83)` (aprox. pt→px a 8 px/mm).
- Aplicado tanto no preview quanto no renderer — garante que "12pt" tem o mesmo tamanho visual no PNG e no preview, e escala junto se mudarmos a impressora.

**4. `src/components/settings/LabelLayoutPanel.tsx`**
- Remover `scale = isMotor ? 5.2 : 3.2`.
- Calcular tamanho real em px: `wReal = w * 8`, `hReal = h * 8` (já considera orientação).
- Aplicar zoom via `transform: scale(fit)` onde `fit = min(containerW / wReal, containerH / hReal, 1)`. Usar `ResizeObserver` no container (`min-h-[420px]`) para recalcular.
- Container do preview com `overflow: hidden` e `display: flex; items-center; justify-center`.
- Label informando o zoom atual (ex: "Zoom 42% — fiel ao PNG impresso a 203dpi").

### Resultado

- Preview e PNG **idênticos** pixel-a-pixel (apenas com `scale` para caber).
- Mudar de 100×60 para 60×50 reduz o preview proporcionalmente, mantendo fontes/bordas no tamanho físico correto.
- Tecido e Motor passam a ter a mesma referência de escala — comparáveis lado a lado.

## Fora de escopo

- Não muda os multiplicadores de fonte/bordas dentro de `TecidoPreview`/`MotorPreview` (layout permanece igual).
- Não muda o fluxo de envio ao n8n nem o `printService`.
- Não mexe nas configurações salvas do usuário (`labelSettings`).

## Arquivos

- editado: `src/components/labels/LabelTemplates.tsx` (export `LABEL_PX_PER_MM`)
- editado: `src/services/labelRenderer.ts` (usa constante compartilhada + conversão pt→px)
- editado: `src/components/settings/LabelLayoutPanel.tsx` (escala 1:1 + transform scale responsivo)

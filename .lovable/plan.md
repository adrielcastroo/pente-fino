# Correção da margem esquerda da etiqueta

## Diagnóstico

A etiqueta gerada (PNG) tem largura física correta, mas na **impressora térmica** o conteúdo sai colado na borda esquerda e com ~4mm de sobra branca à direita. Isso é um *drift* mecânico/de calibração da impressora — o template em si está centralizado e ocupa 100% da largura. A correção mais segura e reversível é compensar esse offset **no PNG enviado**, sem mexer no layout interno da etiqueta.

## Solução

Adicionar um **offset horizontal de impressão** (em mm), aplicado somente no PNG final:

- O conteúdo da etiqueta é desenhado em uma área de largura `wMm - offsetMm` e deslocado para a direita por `offsetMm` (faixa branca à esquerda).
- A largura total do PNG continua sendo `wMm` (a impressora recebe o mesmo tamanho físico configurado).
- Resultado: o conteúdo "anda" para a direita exatamente o quanto a impressora cortou à esquerda, eliminando a sobra de 4mm à direita.

Valor padrão: **4 mm** (ajustável por tipo Tecido/Motor).

## Arquivos a alterar

### 1. `src/store/useAppStore.ts`
Adicionar em `LabelSettings`:
```ts
printOffsetXMm?: number;       // default 4 — Tecido
motorPrintOffsetXMm?: number;  // default 4 — Motor
```
Incluir defaults no estado inicial de `labelSettings`.

### 2. `src/services/labelRenderer.ts`
Em `renderTecidoLabel` e `renderMotorLabel`:
- Ler `offsetMm` (`printOffsetXMm` ou `motorPrintOffsetXMm`, fallback 4).
- Calcular `offsetPx = offsetMm * LABEL_PX_PER_MM` e `innerWpx = wPx - offsetPx`.
- Em `mountOffscreen`, renderizar:
  ```tsx
  <div style={{ width: wPx, height: hPx, background: '#fff', display: 'flex' }}>
    <div style={{ width: offsetPx, flexShrink: 0, background: '#fff' }} />
    <TecidoPreview wPx={innerWpx} hPx={hPx} ... />
  </div>
  ```
- `renderToPng` continua usando `basePx: { w: wPx, h: hPx }` — o PNG mantém o tamanho físico total.

### 3. `src/components/settings/LabelLayoutPanel.tsx`
- Adicionar campo numérico **"Offset de impressão (mm)"** no card "Dimensões", separado por Tecido/Motor (usa o estado já condicional via `isMotor`).
- Texto auxiliar curto: *"Compensa o deslocamento da impressora. Padrão: 4 mm."*
- Refletir o offset no **preview** da mesma forma (faixa branca à esquerda + etiqueta com largura reduzida), para que o preview continue 1:1 com o PNG.
- O cálculo de `fit` (ResizeObserver) não muda — o bloco externo continua tendo `wPx × hPx`.

## Fora de escopo
- Mudanças no template/fonte/bordas da etiqueta.
- Alteração no fluxo do n8n ou no `printService`.
- Calibração no driver da impressora (continua possível, mas a app já compensa por padrão).

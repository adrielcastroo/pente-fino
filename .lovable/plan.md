# Impressão direta no navegador (remover n8n)

## Objetivo
Substituir o envio da etiqueta (PNG via webhook `http://localhost:5678/...` do n8n) por impressão direta no navegador, mantendo **exatamente o mesmo layout** atual (templates `TecidoPreview` / `MotorPreview` em `LabelTemplates.tsx`).

## Como vai funcionar

O `labelRenderer.ts` já gera um PNG em alta resolução (8 px/mm, com fonte IBM Plex Mono embutida) com a dimensão real em mm da etiqueta. Vamos reaproveitar esse PNG e mandar para a impressora pelo diálogo nativo do navegador.

Fluxo:
1. Usuário conclui um registro (Tecido ou Motor/Controle).
2. `printTecidoLabel` / `printMotorLabel` renderizam o PNG (igual hoje).
3. Em vez de `fetch` para o n8n, abrimos uma janela oculta (`iframe` invisível no `document`) contendo apenas:
   - `@page { size: <w>mm <h>mm; margin: 0 }`
   - `<img>` com o PNG ocupando 100% da página.
4. Disparamos `iframe.contentWindow.print()`.
5. Diálogo de impressão do navegador abre já com o tamanho certo — usuário escolhe a impressora térmica (uma vez, depois pode ativar "imprimir sem prévia" no Chrome via `--kiosk-printing` se quiser silencioso).
6. Após `afterprint` (ou timeout), removemos o iframe.

## Arquivos alterados

### `src/services/printService.ts`
- Remover `sendToWebhook()` e a constante `PRINT_WEBHOOK_URL`.
- Remover o `fetch` para o n8n em `printTecidoLabel` e `printMotorLabel`.
- Criar helper `printImageInBrowser(dataUrl, widthMm, heightMm, filename)`:
  - Cria `<iframe>` invisível (`position:fixed; left:-9999px; width:0; height:0; border:0`).
  - Escreve HTML com `@page` no tamanho exato em mm, margens 0, e `<img src="data:..." style="width:100%;height:100%;display:block">`.
  - Aguarda `img.onload` → `iframe.contentWindow.focus()` + `print()`.
  - Remove o iframe em `afterprint` (com fallback `setTimeout` ~60s).
- Mensagens de toast atualizadas: "Enviando para impressora..." / "Etiqueta enviada para impressão" / em caso de erro, "Falha ao abrir diálogo de impressão".
- Manter `autoPrint` como gate (se desligado, não imprime — comportamento atual).
- Manter `resolverItem()` e toda a lógica de resolução de código de fornecedor.
- Manter assinatura pública (`PrintConfig`, `TecidoPrintInput`, `MotorPrintInput`) para não quebrar chamadores. Campo `webhookUrl` em `PrintConfig` vira opcional/ignorado (mantido por compatibilidade — não removo do tipo neste passo).

### `src/services/labelRenderer.ts`
- Sem mudanças. Continua gerando o PNG igual.

### `src/components/labels/LabelTemplates.tsx`
- Sem mudanças. Layout preservado.

### Configurações (`useAppStore` / painel de Label)
- Sem mudanças funcionais. Se houver UI mostrando a URL do webhook, deixo a flag `autoPrint` significar agora "imprimir automaticamente no navegador". (Posso esconder o campo "webhook" em um passo seguinte se você quiser — não incluído neste plano para manter o escopo enxuto.)

## Detalhes técnicos

HTML injetado no iframe:

```text
<!doctype html>
<html><head><style>
  @page { size: {W}mm {H}mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  img { width: {W}mm; height: {H}mm; display: block; }
</style></head>
<body><img src="{dataUrl}"></body></html>
```

- `size: Wmm Hmm` força o navegador a usar exatamente o tamanho da etiqueta (60×50, 100×60, etc., respeitando `orientation`).
- `pixelRatio` do PNG já é calculado para ~8 px/mm → impressão térmica 203 dpi fica nítida.
- A primeira impressão exigirá que o usuário escolha a impressora térmica no diálogo do Chrome; para silenciar, basta marcar a impressora como padrão e ativar "Print preview disabled" (ou rodar Chrome com `--kiosk-printing`).

## Validação
1. Conferir uma etiqueta de Tecido → diálogo de impressão abre com tamanho correto e PNG idêntico ao preview.
2. Conferir uma etiqueta de Motor 60×50 → "SERIE" e demais textos íntegros (fonte embutida).
3. Desligar `autoPrint` → nada acontece (igual hoje).
4. Verificar console: nenhum `fetch` para `localhost:5678`.

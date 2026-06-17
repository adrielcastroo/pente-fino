# Corrigir etiqueta de motor (60×50 mm)

## O que vou mudar

A imagem mostra que o layout atual já está praticamente correto — o único bug visível é o badge **"SERIE"** que está sendo impresso como caracteres aleatórios (parecem Devanagari) por causa de fallback de fonte. Tamanho fica em **60×50 mm** (default já é esse).

### 1. Corrigir o "SERIE" corrompido (causa raiz: fonte)

Os templates usam `font-mono` do Tailwind, que resolve para `ui-monospace, SFMono-Regular, Menlo, ...` — todas fontes do sistema. Quando `html-to-image` serializa o DOM para PNG, o navegador headless cai num fallback que renderiza glifos errados para o texto pequeno do badge.

Solução:
- Em `src/components/labels/LabelTemplates.tsx`: trocar `font-mono` por `font-['IBM_Plex_Mono',_ui-monospace,_monospace]` em `MotorPreview` e `TecidoPreview` (IBM Plex Mono já é a fonte do projeto).
- Em `src/services/labelRenderer.ts`: passar `fontEmbedCSS` para o `toPng()` chamando `getFontEmbedCSS(node)` do `html-to-image` antes do render, garantindo que a fonte seja embutida no PNG final (não depende mais do que a impressora/SO tem instalado).
- Confirmar que `index.html` já carrega IBM Plex Mono via Google Fonts; se não, adicionar o `<link>`.

### 2. Pequenos refinamentos de proporção (mantendo o desenho)

Mantendo exatamente os 3 blocos da imagem:
- Aumentar levemente o badge "SERIE" para `fs * 0.95` (hoje `0.8`) + padding maior, para garantir legibilidade mesmo em 60×50.
- Garantir que SKU (`fs * 1.7`), CX/NF (`fs * 1.3`), NT (`fs * 1.2`), RNP/DATA (`fs * 0.9` / `1.05`) — mantidos como na imagem.

### 3. QA

Após as mudanças:
- Abrir **Configurações → Layout de Etiqueta**, alternar para Motor e tirar screenshot do preview.
- Verificar que "SERIE" aparece corretamente em Latin e que o restante bate com a foto.

## Arquivos tocados

- `src/components/labels/LabelTemplates.tsx` — swap de fonte + ajuste do badge "SERIE".
- `src/services/labelRenderer.ts` — adicionar `fontEmbedCSS` no `toPng`.
- `index.html` — adicionar `<link>` IBM Plex Mono apenas se ainda não existir.

## Fora de escopo

- Mudar dimensões (continua 60×50 mm).
- Mudar conteúdo dos campos.
- Mudar o layout estrutural (segue exatamente o desenho da imagem).

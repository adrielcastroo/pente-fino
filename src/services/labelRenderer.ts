import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { toPng, getFontEmbedCSS } from 'html-to-image';
import {
  TecidoPreview,
  MotorPreview,
  LABEL_PX_PER_MM,
  type TecidoLabelData,
  type MotorLabelData,
  type LabelHas,
} from '@/components/labels/LabelTemplates';
import { ZPLPreview } from '@/components/etiquetas/ZPLPreview';
import type { LabelSettings } from '@/store/useAppStore';

const TECIDO_DEFAULT_FIELDS = ['sku', 'descricao', 'nfe', 'qtd', 'rnp', 'data', 'qr_sku', 'qr_lote'];
const MOTOR_DEFAULT_FIELDS = ['sku', 'descricao', 'serie', 'cx', 'nf', 'nt', 'rnp', 'data', 'qr_lote_sku'];

// 203 dpi (impressoras térmicas comuns) ≈ 8 px/mm. Limitamos para evitar canvas gigante.
const TARGET_PX_PER_MM = LABEL_PX_PER_MM;
const PREVIEW_SCALE = LABEL_PX_PER_MM; // mesma escala usada no LabelLayoutPanel (1:1 com o PNG)

export interface RenderedLabel {
  dataUrl: string;       // "data:image/png;base64,..."
  imageBase64: string;   // sem prefixo
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
}

// Cache do CSS com @font-face embutido: `getFontEmbedCSS` baixa e serializa as
// fontes (IBM Plex Mono) em base64 — operação lenta (centenas de ms a
// segundos). Sem cache, cada etiqueta do lote refazia esse trabalho e a tela
// "Preparando…" ficava travada. Aqui embutimos uma vez por sessão.
let _fontEmbedCSSPromise: Promise<string> | null = null;
async function getCachedFontEmbedCSS(node: HTMLElement): Promise<string> {
  if (_fontEmbedCSSPromise) return _fontEmbedCSSPromise;
  _fontEmbedCSSPromise = getFontEmbedCSS(node).catch((e) => {
    console.warn('Falha ao embutir fontes na etiqueta:', e);
    // Guarda promise falha só pra não ficar tentando de novo no mesmo batch;
    // reseta em 30s pra permitir nova tentativa em batches futuros.
    setTimeout(() => { _fontEmbedCSSPromise = null; }, 30_000);
    return '';
  });
  return _fontEmbedCSSPromise;
}

async function renderToPng(opts: {
  node: HTMLElement;
  widthMm: number;
  heightMm: number;
  basePx: { w: number; h: number };
}): Promise<RenderedLabel> {
  const { node, widthMm, heightMm, basePx } = opts;
  const targetPxW = widthMm * TARGET_PX_PER_MM;
  const pixelRatio = Math.max(2, Math.min(4, targetPxW / basePx.w));

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const fontEmbedCSS = await getCachedFontEmbedCSS(node);

  const dataUrl = await toPng(node, {
    pixelRatio,
    // cacheBust desligado: reimpressões em lote reaproveitam recursos já
    // baixados (QR/fontes/ícones), acelerando muito o preparo do batch.
    cacheBust: false,
    backgroundColor: '#ffffff',
    width: basePx.w,
    height: basePx.h,
    fontEmbedCSS,
  });

  const imageBase64 = dataUrl.split(',')[1] ?? '';
  return {
    dataUrl,
    imageBase64,
    widthMm,
    heightMm,
    widthPx: Math.round(basePx.w * pixelRatio),
    heightPx: Math.round(basePx.h * pixelRatio),
  };
}


function mountOffscreen(): { container: HTMLDivElement; root: ReturnType<typeof createRoot>; cleanup: () => void } {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.pointerEvents = 'none';
  container.style.background = '#ffffff';
  document.body.appendChild(container);
  const root = createRoot(container);
  return {
    container,
    root,
    cleanup: () => {
      try { root.unmount(); } catch { /* noop */ }
      container.remove();
    },
  };
}

export async function renderTecidoLabel(
  data: TecidoLabelData,
  labelSettings: LabelSettings,
  options: { applyPrintOffset?: boolean } = {},
): Promise<RenderedLabel> {
  const { applyPrintOffset = true } = options;
  const fields = labelSettings.fields?.length ? labelSettings.fields : TECIDO_DEFAULT_FIELDS;
  const has: LabelHas = (id) => fields.includes(id);
  const w = labelSettings.width ?? 100;
  const h = labelSettings.height ?? 60;
  const orientation = labelSettings.orientation ?? 'landscape';
  const wPx = (orientation === 'landscape' ? w : h) * PREVIEW_SCALE;
  const hPx = (orientation === 'landscape' ? h : w) * PREVIEW_SCALE;
  const offsetXPx = applyPrintOffset ? (labelSettings.printOffsetXMm ?? 0) * LABEL_PX_PER_MM : 0;
  const offsetYPx = applyPrintOffset ? (labelSettings.printOffsetYMm ?? 0) * LABEL_PX_PER_MM : 0;

  const appearance = {
    borderWidth: labelSettings.borderWidth ?? 4,
    borderStyle: labelSettings.borderStyle ?? 'solid',
    borderRadius: labelSettings.borderRadius ?? 0,
    padding: labelSettings.padding ?? 0,
    margin: labelSettings.margin ?? 0,
    marginY: labelSettings.marginY ?? 0,
  };

  const { container, root, cleanup } = mountOffscreen();
  try {
    root.render(
      createElement('div', {
        style: {
          position: 'relative',
          width: `${wPx}px`,
          height: `${hPx}px`,
          background: '#fff',
          overflow: 'hidden',
        },
      },
        createElement('div', {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate(${offsetXPx}px, ${offsetYPx}px)`,
          },
        },
          createElement(TecidoPreview, { wPx, hPx, fs: labelSettings.fontSize, has, data, ...appearance }),
        ),
      ),
    );
    await new Promise((r) => setTimeout(r, 50));
    const node = container.firstElementChild as HTMLElement | null;
    if (!node) throw new Error('Falha ao renderizar etiqueta de tecido');
    return await renderToPng({ node, widthMm: w, heightMm: h, basePx: { w: wPx, h: hPx } });
  } finally {
    cleanup();
  }
}

export async function renderMotorLabel(
  data: MotorLabelData,
  labelSettings: LabelSettings,
  options: { applyPrintOffset?: boolean } = {},
): Promise<RenderedLabel> {
  const { applyPrintOffset = true } = options;
  const fields = labelSettings.motorFields?.length ? labelSettings.motorFields : MOTOR_DEFAULT_FIELDS;
  const has: LabelHas = (id) => fields.includes(id);
  const w = labelSettings.motorWidth ?? 60;
  const h = labelSettings.motorHeight ?? 50;
  const orientation = labelSettings.motorOrientation ?? labelSettings.orientation ?? 'landscape';
  const wPx = (orientation === 'landscape' ? w : h) * PREVIEW_SCALE;
  const hPx = (orientation === 'landscape' ? h : w) * PREVIEW_SCALE;
  const offsetXPx = applyPrintOffset ? (labelSettings.motorPrintOffsetXMm ?? 0) * LABEL_PX_PER_MM : 0;
  const offsetYPx = applyPrintOffset ? (labelSettings.motorPrintOffsetYMm ?? 0) * LABEL_PX_PER_MM : 0;

  const appearance = {
    borderWidth: labelSettings.motorBorderWidth ?? 2,
    borderStyle: labelSettings.motorBorderStyle ?? 'solid',
    borderRadius: labelSettings.motorBorderRadius ?? 0,
    padding: labelSettings.motorPadding ?? 0,
    margin: labelSettings.motorMargin ?? 0,
    marginY: labelSettings.motorMarginY ?? 0,
  };

  const { container, root, cleanup } = mountOffscreen();
  try {
    root.render(
      createElement('div', {
        style: {
          position: 'relative',
          width: `${wPx}px`,
          height: `${hPx}px`,
          background: '#fff',
          overflow: 'hidden',
        },
      },
        createElement('div', {
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate(${offsetXPx}px, ${offsetYPx}px)`,
          },
        },
          createElement(MotorPreview, { wPx, hPx, fs: labelSettings.fontSize, has, data, ...appearance }),
        ),
      ),
    );
    await new Promise((r) => setTimeout(r, 50));
    const node = container.firstElementChild as HTMLElement | null;
    if (!node) throw new Error('Falha ao renderizar etiqueta de motor');
    return await renderToPng({ node, widthMm: w, heightMm: h, basePx: { w: wPx, h: hPx } });
  } finally {
    cleanup();
  }
}

/**
 * Renderiza uma etiqueta ZPL (expedição) como PNG usando o mesmo pipeline
 * offscreen do estoque (html-to-image + fontes embutidas). O ZPLPreview é
 * renderizado dentro de um box com dimensão física em pixels (widthMm ×
 * LABEL_PX_PER_MM) e os ajustes finos (offset X/Y, borda, padding) do
 * LabelSettings são aplicados antes da captura.
 */
export async function renderZplLabel(
  zpl: string,
  variaveis: Record<string, string>,
  dimensoes: { largura: number; altura: number },
  labelSettings: LabelSettings,
  options: { applyPrintOffset?: boolean; logoUrl?: string } = {},
): Promise<RenderedLabel> {
  const { applyPrintOffset = true, logoUrl } = options;
  const w = dimensoes.largura;
  const h = dimensoes.altura;
  const wPx = w * PREVIEW_SCALE;
  const hPx = h * PREVIEW_SCALE;
  const offsetXPx = applyPrintOffset ? (labelSettings.expedicaoPrintOffsetXMm ?? 0) * LABEL_PX_PER_MM : 0;
  const offsetYPx = applyPrintOffset ? (labelSettings.expedicaoPrintOffsetYMm ?? 0) * LABEL_PX_PER_MM : 0;
  const borderWidth = labelSettings.expedicaoBorderWidth ?? 0;
  const borderStyle = labelSettings.expedicaoBorderStyle ?? 'none';
  const borderRadius = labelSettings.expedicaoBorderRadius ?? 0;
  const padding = labelSettings.expedicaoPadding ?? 0;
  const borderCss = borderStyle === 'none' || borderWidth <= 0
    ? 'none'
    : `${borderWidth}px ${borderStyle} #000`;

  const { container, root, cleanup } = mountOffscreen();
  try {
    root.render(
      createElement('div', {
        style: {
          position: 'relative',
          width: `${wPx}px`,
          height: `${hPx}px`,
          background: '#fff',
          overflow: 'hidden',
          boxSizing: 'border-box',
          border: borderCss,
          borderRadius: `${borderRadius}px`,
          padding: `${padding}px`,
        },
      },
        createElement('div', {
          style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            transform: `translate(${offsetXPx}px, ${offsetYPx}px)`,
            background: '#fff',
          },
        },
          createElement(ZPLPreview, { zpl, variaveis, dimensoes, logoUrl }),
        ),
      ),
    );
    await new Promise((r) => setTimeout(r, 80));
    const node = container.firstElementChild as HTMLElement | null;
    if (!node) throw new Error('Falha ao renderizar etiqueta ZPL');
    return await renderToPng({ node, widthMm: w, heightMm: h, basePx: { w: wPx, h: hPx } });
  } finally {
    cleanup();
  }
}



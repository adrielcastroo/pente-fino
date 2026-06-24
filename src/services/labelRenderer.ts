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

async function renderToPng(opts: {
  node: HTMLElement;
  widthMm: number;
  heightMm: number;
  basePx: { w: number; h: number };
}): Promise<RenderedLabel> {
  const { node, widthMm, heightMm, basePx } = opts;
  const targetPxW = widthMm * TARGET_PX_PER_MM;
  // Força pixelRatio >= 2 para melhorar nitidez de fontes pequenas no PNG.
  const pixelRatio = Math.max(2, Math.min(4, targetPxW / basePx.w));

  // Aguarda layout + QR codes (qrcode.react é síncrono, mas damos um tick para o React commitar)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Embute @font-face (IBM Plex Mono) no PNG para evitar fallback do SO/impressora
  // que renderiza glifos errados (ex.: "SERIE" virando caracteres aleatórios).
  let fontEmbedCSS = '';
  try {
    fontEmbedCSS = await getFontEmbedCSS(node);
  } catch (e) {
    console.warn('Falha ao embutir fontes na etiqueta:', e);
  }

  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
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
): Promise<RenderedLabel> {
  const fields = labelSettings.fields?.length ? labelSettings.fields : TECIDO_DEFAULT_FIELDS;
  const has: LabelHas = (id) => fields.includes(id);
  const w = labelSettings.width ?? 100;
  const h = labelSettings.height ?? 60;
  const orientation = labelSettings.orientation ?? 'landscape';
  const wPx = (orientation === 'landscape' ? w : h) * PREVIEW_SCALE;
  const hPx = (orientation === 'landscape' ? h : w) * PREVIEW_SCALE;
  const offsetMm = labelSettings.printOffsetXMm ?? 0;
  const maxOffsetPx = wPx - 1;
  const offsetPx = Math.max(-maxOffsetPx, Math.min(offsetMm * LABEL_PX_PER_MM, maxOffsetPx));
  const innerWpx = wPx - Math.abs(offsetPx);
  const leftPx = offsetPx > 0 ? offsetPx : 0;
  const rightPx = offsetPx < 0 ? -offsetPx : 0;

  const { container, root, cleanup } = mountOffscreen();
  try {
    root.render(
      createElement('div', { style: { display: 'flex', width: `${wPx}px`, height: `${hPx}px`, background: '#fff' } },
        createElement('div', { style: { width: `${leftPx}px`, height: `${hPx}px`, flexShrink: 0, background: '#fff' } }),
        createElement(TecidoPreview, { wPx: innerWpx, hPx, fs: labelSettings.fontSize, has, data }),
        createElement('div', { style: { width: `${rightPx}px`, height: `${hPx}px`, flexShrink: 0, background: '#fff' } }),
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
): Promise<RenderedLabel> {
  const fields = labelSettings.motorFields?.length ? labelSettings.motorFields : MOTOR_DEFAULT_FIELDS;
  const has: LabelHas = (id) => fields.includes(id);
  const w = labelSettings.motorWidth ?? 60;
  const h = labelSettings.motorHeight ?? 50;
  const orientation = labelSettings.orientation ?? 'landscape';
  const wPx = (orientation === 'landscape' ? w : h) * PREVIEW_SCALE;
  const hPx = (orientation === 'landscape' ? h : w) * PREVIEW_SCALE;
  const offsetMm = labelSettings.motorPrintOffsetXMm ?? 0;
  const maxOffsetPx = wPx - 1;
  const offsetPx = Math.max(-maxOffsetPx, Math.min(offsetMm * LABEL_PX_PER_MM, maxOffsetPx));
  const innerWpx = wPx - Math.abs(offsetPx);
  const leftPx = offsetPx > 0 ? offsetPx : 0;
  const rightPx = offsetPx < 0 ? -offsetPx : 0;

  const { container, root, cleanup } = mountOffscreen();
  try {
    root.render(
      createElement('div', { style: { display: 'flex', width: `${wPx}px`, height: `${hPx}px`, background: '#fff' } },
        createElement('div', { style: { width: `${leftPx}px`, height: `${hPx}px`, flexShrink: 0, background: '#fff' } }),
        createElement(MotorPreview, { wPx: innerWpx, hPx, fs: labelSettings.fontSize, has, data }),
        createElement('div', { style: { width: `${rightPx}px`, height: `${hPx}px`, flexShrink: 0, background: '#fff' } }),
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

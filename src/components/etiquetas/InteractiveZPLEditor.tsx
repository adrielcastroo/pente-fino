/**
 * InteractiveZPLEditor — preview interativo do ZPL.
 * - Clique seleciona (foco). Arraste move (^FO x,y).
 * - 8 alças (4 cantos + 4 laterais) redimensionam. Alça inferior gira 90°.
 * - Duplo-clique abre o dialog.
 * - Snap-to-grid com guias.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ElementEditDialog, type ElementEditValues } from './ElementEditDialog';
import { LABEL_PX_PER_MM } from '@/components/labels/LabelTemplates';

export type ShapeStyle = 'solid' | 'dashed' | 'dotted';
export type TextAlign = 'L' | 'C' | 'R';
export type Rotation = 'N' | 'R' | 'I' | 'B'; // 0/90/180/270 (ZPL)
export type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface ParsedBlock {
  index: number;
  sourceStart: number;
  sourceEnd: number;
  raw: string;
  x: number;
  y: number;
  size: number;
  reverse: boolean;
  fd: string;
  tipo: 'text' | 'barcode' | 'qr' | 'box' | 'line';
  width?: number;
  height?: number;
  thickness?: number;
  style?: ShapeStyle;
  qrMag?: number;
  align?: TextAlign;
  fbWidth?: number;
  fbMaxLines?: number;
  fbSpacing?: number;
  rotation?: Rotation;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/** Marker embutido no bloco (via ^FX-TF:...-) para preservar formatação textual. */
export function parseTextFormat(raw: string): { bold: boolean; italic: boolean; underline: boolean } {
  const m = raw.match(/\^FX-TF:([BIU+]*)-/);
  if (!m) return { bold: false, italic: false, underline: false };
  const flags = m[1];
  return { bold: flags.includes('B'), italic: flags.includes('I'), underline: flags.includes('U') };
}

function writeTextFormat(raw: string, bold: boolean, italic: boolean, underline: boolean): string {
  const cleaned = raw.replace(/\^FX-TF:[BIU+]*-/g, '');
  if (!bold && !italic && !underline) return cleaned;
  const flags = [bold ? 'B' : '', italic ? 'I' : '', underline ? 'U' : ''].filter(Boolean).join('+');
  return cleaned.replace(/\^FS$/, `^FX-TF:${flags}-^FS`);
}

function parseZplSize(zpl: string, fallback: { largura: number; altura: number }): { w: number; h: number } {
  const pw = zpl.match(/\^PW(\d+)/);
  const ll = zpl.match(/\^LL(\d+)/);
  return {
    w: pw ? parseInt(pw[1], 10) : fallback.largura * LABEL_PX_PER_MM,
    h: ll ? parseInt(ll[1], 10) : fallback.altura * LABEL_PX_PER_MM,
  };
}

const BLOCK_RE = /\^FO(\d+),(\d+)([\s\S]*?)\^FS/g;
const SNAP_THRESHOLD = 6; // dots
const ROT_DEG: Record<Rotation, number> = { N: 0, R: 90, I: 180, B: 270 };
const ROT_NEXT: Record<Rotation, Rotation> = { N: 'R', R: 'I', I: 'B', B: 'N' };

export function parseBlocks(zpl: string): ParsedBlock[] {
  const out: ParsedBlock[] = [];
  BLOCK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = BLOCK_RE.exec(zpl)) !== null) {
    const raw = m[0];
    const start = m.index;
    const end = start + raw.length;
    const x = parseInt(m[1], 10);
    const y = parseInt(m[2], 10);
    const inner = m[3];
    const a0 = inner.match(/\^A0([NRIB]),(\d+),(\d+)/);
    const size = a0 ? parseInt(a0[2], 10) : 24;
    const rotationText: Rotation = (a0 ? (a0[1] as Rotation) : 'N');
    const reverse = /\^FR(?![A-Z])/.test(inner);
    const fdMatch = inner.match(/\^FD([\s\S]*?)$/);
    const fd = fdMatch ? fdMatch[1] : '';
    const styleMatch = inner.match(/\^FX-S:(\w+)-/);
    const style = (styleMatch ? styleMatch[1] : 'solid') as ShapeStyle;
    const fbMatch = inner.match(/\^FB(\d+),(\d+),(-?\d+),([LCRJ])/);
    const align: TextAlign = fbMatch ? (fbMatch[4] === 'J' ? 'L' : (fbMatch[4] as TextAlign)) : 'L';
    const fbWidth = fbMatch ? parseInt(fbMatch[1], 10) : undefined;
    const fbMaxLines = fbMatch ? parseInt(fbMatch[2], 10) : undefined;
    const fbSpacing = fbMatch ? parseInt(fbMatch[3], 10) : undefined;
    let tipo: ParsedBlock['tipo'] = 'text';
    let width: number | undefined;
    let height: number | undefined;
    let thickness: number | undefined;
    let qrMag: number | undefined;
    let rotation: Rotation = rotationText;
    if (/\^BC/.test(inner)) tipo = 'barcode';
    else if (/\^BQ/.test(inner)) {
      tipo = 'qr';
      const bq = inner.match(/\^BQ([NRIB]),\d+,(\d+)/);
      if (bq) { rotation = bq[1] as Rotation; qrMag = parseInt(bq[2], 10); }
      else qrMag = 4;
    } else if (/\^GB/.test(inner)) {
      const gb = inner.match(/\^GB(\d+),(\d+),(\d+)/);
      if (gb) {
        width = parseInt(gb[1], 10);
        height = parseInt(gb[2], 10);
        thickness = parseInt(gb[3], 10);
      }
      tipo = (width === 1 || height === 1) ? 'line' : 'box';
      rotation = 'N';
    }
    out.push({ index: i++, sourceStart: start, sourceEnd: end, raw, x, y, size, reverse, fd, tipo, width, height, thickness, style, qrMag, align, fbWidth, fbMaxLines, fbSpacing, rotation });
  }
  return out;
}

function replaceBlock(zpl: string, block: ParsedBlock, newRaw: string): string {
  return zpl.slice(0, block.sourceStart) + newRaw + zpl.slice(block.sourceEnd);
}

function rewriteBlockCoords(block: ParsedBlock, nx: number, ny: number): string {
  return block.raw.replace(/^\^FO\d+,\d+/, `^FO${Math.max(0, Math.round(nx))},${Math.max(0, Math.round(ny))}`);
}

function updateA0(raw: string, size: number, rot: Rotation): string {
  if (/\^A0[NRIB],\d+,\d+/.test(raw)) return raw.replace(/\^A0[NRIB],\d+,\d+/, `^A0${rot},${size},${size}`);
  return raw.replace(/\^FD/, `^A0${rot},${size},${size}^FD`);
}

function updateGBDims(raw: string, w: number, h: number): string {
  return raw.replace(/\^GB\d+,\d+,(\d+)/, `^GB${Math.max(1, Math.round(w))},${Math.max(1, Math.round(h))},$1`);
}

function updateBQMag(raw: string, rot: Rotation, mag: number): string {
  return raw.replace(/\^BQ[NRIB],(\d+),\d+/, `^BQ${rot},$1,${Math.max(1, Math.min(10, Math.round(mag)))}`);
}

function updateFBWidth(raw: string, width: number, block: ParsedBlock): string {
  const w = Math.max(20, Math.round(width));
  if (/\^FB\d+,\d+,-?\d+,[LCRJ]/.test(raw)) {
    return raw.replace(/\^FB(\d+),(\d+),(-?\d+),([LCRJ])/, `^FB${w},$2,$3,$4`);
  }
  const maxLines = block.fbMaxLines ?? 1;
  const spacing = block.fbSpacing ?? 0;
  const align = block.align ?? 'L';
  return raw.replace(/\^FD/, `^FB${w},${maxLines},${spacing},${align}^FD`);
}

function applyEditToBlock(block: ParsedBlock, edit: ElementEditValues, viewW: number): string {
  let raw = block.raw;
  if (edit.x !== undefined || edit.y !== undefined) {
    const nx = Math.max(0, Math.round(edit.x ?? block.x));
    const ny = Math.max(0, Math.round(edit.y ?? block.y));
    raw = raw.replace(/^\^FO\d+,\d+/, `^FO${nx},${ny}`);
  }
  if (block.tipo === 'box' || block.tipo === 'line') {
    const w = Math.max(1, edit.width ?? block.width ?? 100);
    const h = Math.max(1, edit.height ?? block.height ?? 100);
    const t = Math.max(1, edit.thickness ?? block.thickness ?? 2);
    raw = raw.replace(/\^GB\d+,\d+,\d+/, `^GB${w},${h},${t}`);
    raw = raw.replace(/\^FX-S:\w+-/, '');
    raw = raw.replace(/\^FS$/, `^FX-S:${edit.style ?? 'solid'}-^FS`);
    return raw;
  }
  if (block.tipo === 'qr') {
    raw = raw.replace(/\^FD[\s\S]*?\^FS$/, `^FD${edit.fd}^FS`);
    return raw;
  }
  if (block.tipo === 'text') {
    raw = updateA0(raw, edit.size, block.rotation ?? 'N');
    const align: TextAlign = edit.align ?? 'L';
    const maxLines = Math.max(1, edit.fbMaxLines ?? block.fbMaxLines ?? 1);
    const wantsFB = align !== 'L' || maxLines > 1 || (edit.fbWidth ?? block.fbWidth) !== undefined;
    raw = raw.replace(/\^FB\d+,\d+,-?\d+,[LCRJ]/, '');
    if (wantsFB) {
      const fbW = Math.max(20, edit.fbWidth ?? block.fbWidth ?? Math.max(40, viewW - block.x));
      const spacing = block.fbSpacing ?? 0;
      raw = raw.replace(/\^FD/, `^FB${fbW},${maxLines},${spacing},${align}^FD`);
    }
  }
  const hasFR = /\^FR(?![A-Z])/.test(raw);
  if (edit.reverse && !hasFR) raw = raw.replace(/\^FD/, '^FR^FD');
  else if (!edit.reverse && hasFR) raw = raw.replace(/\^FR(?![A-Z])/, '');
  raw = raw.replace(/\^FD[\s\S]*?\^FS$/, `^FD${edit.fd}^FS`);
  return raw;
}

function isLogoBlock(b: ParsedBlock): boolean {
  return b.tipo === 'text' && /\{\{\s*logo\s*\}\}/i.test(b.fd);
}

function logoDims(b: ParsedBlock): { w: number; h: number } {
  const h = b.size * 1.6;
  const w = h * 2.5;
  return { w, h };
}

/** Bounding box efetivo do elemento em dots. Base sem rotação. */
function elementBounds(b: ParsedBlock, logoUrl?: string): { w: number; h: number } {
  if (b.tipo === 'qr') {
    const side = Math.max(60, (b.qrMag ?? 4) * 32);
    return { w: side, h: side };
  }
  if (b.tipo === 'barcode') return { w: 240, h: 100 };
  if (b.tipo === 'box' || b.tipo === 'line') return { w: b.width ?? 40, h: b.height ?? 40 };
  if (isLogoBlock(b) && logoUrl) return logoDims(b);
  const charW = b.size * 0.55;
  const chars = Math.max(1, b.fd.length);
  const w = b.fbWidth ?? Math.max(20, chars * charW);
  const h = b.size + 4;
  return { w, h };
}

function strokeDashFor(style?: ShapeStyle): string | undefined {
  if (style === 'dashed') return '8 4';
  if (style === 'dotted') return '2 3';
  return undefined;
}

const CURSOR_FOR: Record<HandleDir, string> = {
  nw: 'nwse-resize', se: 'nwse-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
};

const TIPO_LABEL: Record<ParsedBlock['tipo'], string> = {
  text: 'Texto', barcode: 'Barcode', qr: 'QR Code', box: 'Retângulo', line: 'Linha',
};

interface Props {
  zpl: string;
  onChange: (zpl: string) => void;
  valores: Record<string, string>;
  dimensoes: { largura: number; altura: number };
  variaveis: { chave: string; label: string }[];
  logoUrl?: string;
  lineThickness?: number;
  lineStyle?: ShapeStyle;
  lineColor?: string;
  fontFamily?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderRadius?: number;
  padding?: number;
  offsetX?: number;
  offsetY?: number;
}

export const InteractiveZPLEditor = memo(function InteractiveZPLEditor({
  zpl, onChange, valores, dimensoes, variaveis, logoUrl,
  lineThickness = 2,
  lineStyle = 'solid',
  lineColor = '#111111',
  fontFamily = 'monospace',
  borderWidth = 0,
  borderStyle = 'none',
  borderRadius = 0,
  padding = 0,
  offsetX = 0,
  offsetY = 0,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<null | { idx: number; offX: number; offY: number }>(null);
  const [resizing, setResizing] = useState<null | {
    idx: number; dir: HandleDir;
    startX: number; startY: number; startW: number; startH: number;
    startPx: number; startPy: number;
  }>(null);
  const [guides, setGuides] = useState<{ vx?: number; vy?: number; hx?: number; hy?: number }>({});
  const [editing, setEditing] = useState<ParsedBlock | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const blocks = useMemo(() => parseBlocks(zpl), [zpl]);
  const zplSize = useMemo(() => parseZplSize(zpl, dimensoes), [zpl, dimensoes]);
  const viewW = zplSize.w;
  const viewH = zplSize.h;
  const contentX = padding + offsetX;
  const contentY = padding + offsetY;
  const contentW = Math.max(1, viewW - padding * 2);
  const contentH = Math.max(1, viewH - padding * 2);
  const effectiveBorderWidth = borderStyle === 'none' ? 0 : Math.max(0, borderWidth);
  const borderDashArray =
    borderStyle === 'dashed' ? `${Math.max(4, effectiveBorderWidth * 3)} ${Math.max(3, effectiveBorderWidth * 2)}`
    : borderStyle === 'dotted' ? `${Math.max(1, effectiveBorderWidth)} ${Math.max(2, effectiveBorderWidth * 1.5)}`
    : undefined;
  const contentClipId = useMemo(() => `interactive-content-${Math.random().toString(36).slice(2, 9)}`, []);

  const renderBorder = () => {
    if (effectiveBorderWidth <= 0) return null;
    const inset = effectiveBorderWidth / 2;
    const outer = {
      x: inset,
      y: inset,
      width: Math.max(1, viewW - effectiveBorderWidth),
      height: Math.max(1, viewH - effectiveBorderWidth),
      rx: borderRadius,
      ry: borderRadius,
      fill: 'none',
      stroke: '#000',
      strokeWidth: effectiveBorderWidth,
      strokeDasharray: borderDashArray,
    };
    if (borderStyle !== 'double') return <rect {...outer} pointerEvents="none" />;
    const gap = Math.max(2, effectiveBorderWidth * 1.5);
    return (
      <>
        <rect {...outer} strokeWidth={Math.max(1, effectiveBorderWidth * 0.55)} pointerEvents="none" />
        <rect
          x={inset + gap}
          y={inset + gap}
          width={Math.max(1, viewW - effectiveBorderWidth - gap * 2)}
          height={Math.max(1, viewH - effectiveBorderWidth - gap * 2)}
          rx={Math.max(0, borderRadius - gap)}
          ry={Math.max(0, borderRadius - gap)}
          fill="none"
          stroke="#000"
          strokeWidth={Math.max(1, effectiveBorderWidth * 0.55)}
          pointerEvents="none"
        />
      </>
    );
  };

  // Detecta elementos que extrapolam a área imprimível — na impressão real
  // qualquer parte fora do ^PW/^LL é descartada pelo firmware da impressora.
  const overflows = useMemo(() => {
    return blocks
      .map((b) => {
        const { w, h } = elementBounds(b, logoUrl);
        const overRight = Math.max(0, b.x + w - contentW);
        const overBottom = Math.max(0, b.y + h - contentH);
        const overLeft = Math.max(0, -b.x);
        const overTop = Math.max(0, -b.y);
        if (!overRight && !overBottom && !overLeft && !overTop) return null;
        const label =
          b.tipo === 'text' ? (b.fd || 'texto').slice(0, 24) :
          b.tipo === 'barcode' ? 'código de barras' :
          b.tipo === 'qr' ? 'QR' :
          b.tipo === 'box' ? 'caixa' :
          b.tipo === 'line' ? 'linha' : 'elemento';
        return { block: b, w, h, label };
      })
      .filter(Boolean) as Array<{ block: ParsedBlock; w: number; h: number; label: string }>;
  }, [blocks, contentW, contentH, logoUrl]);


  const interpolate = useCallback((s: string) => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    return s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => (k === 'hoje' || k === 'data' ? hoje : valores[k] ?? `{{${k}}}`));
  }, [valores]);

  const svgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const onPointerDown = (e: React.PointerEvent, b: ParsedBlock) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelectedIdx(b.index);
    const p = svgPoint(e.clientX, e.clientY);
    setDragging({ idx: b.index, offX: p.x - contentX - b.x, offY: p.y - contentY - b.y });
  };

  const onResizeDown = (e: React.PointerEvent, b: ParsedBlock, dir: HandleDir) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = svgPoint(e.clientX, e.clientY);
    const { w, h } = elementBounds(b, logoUrl);
    setResizing({ idx: b.index, dir, startX: b.x, startY: b.y, startW: w, startH: h, startPx: p.x, startPy: p.y });
  };

  const onRotate = (b: ParsedBlock) => {
    if (b.tipo === 'box' || b.tipo === 'line' || b.tipo === 'barcode') return;
    const next = ROT_NEXT[b.rotation ?? 'N'];
    let raw = b.raw;
    if (b.tipo === 'text') raw = updateA0(raw, b.size, next);
    else if (b.tipo === 'qr') raw = updateBQMag(raw, next, b.qrMag ?? 4);
    onChange(replaceBlock(zpl, b, raw));
  };

  const computeSnap = (b: ParsedBlock, nx: number, ny: number) => {
    const { w, h } = elementBounds(b, logoUrl);
    const cx = nx + w / 2;
    const cy = ny + h / 2;
    let snapX = nx;
    let snapY = ny;
    const g: typeof guides = {};

    if (Math.abs(cx - contentW / 2) < SNAP_THRESHOLD) { snapX = contentW / 2 - w / 2; g.vx = contentW / 2; }
    if (Math.abs(cy - contentH / 2) < SNAP_THRESHOLD) { snapY = contentH / 2 - h / 2; g.hy = contentH / 2; }
    for (const other of blocks) {
      if (other.index === b.index) continue;
      const ob = elementBounds(other, logoUrl);
      const ocx = other.x + ob.w / 2;
      const ocy = other.y + ob.h / 2;
      if (Math.abs(nx - other.x) < SNAP_THRESHOLD) { snapX = other.x; g.vx = other.x; }
      else if (Math.abs(cx - ocx) < SNAP_THRESHOLD) { snapX = ocx - w / 2; g.vx = ocx; }
      if (Math.abs(ny - other.y) < SNAP_THRESHOLD) { snapY = other.y; g.hy = other.y; }
      else if (Math.abs(cy - ocy) < SNAP_THRESHOLD) { snapY = ocy - h / 2; g.hy = ocy; }
    }
    return { snapX, snapY, g };
  };

  const applyResize = (b: ParsedBlock, newX: number, newY: number, newW: number, newH: number) => {
    if (b.tipo === 'line') {
      // Preserva o eixo fino da linha (1-2 dots) para não virar retângulo.
      const origW = b.width ?? 1;
      const origH = b.height ?? 1;
      const isHorizontal = origH <= 2;
      if (isHorizontal) { newW = Math.max(4, newW); newH = origH; }
      else { newH = Math.max(4, newH); newW = origW; }
    } else {
      newW = Math.max(4, newW);
      newH = Math.max(4, newH);
    }
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    let raw = b.raw;
    // Move ^FO
    raw = raw.replace(/^\^FO\d+,\d+/, `^FO${Math.round(newX)},${Math.round(newY)}`);
    if (b.tipo === 'box' || b.tipo === 'line') {
      raw = updateGBDims(raw, newW, newH);
    } else if (b.tipo === 'qr') {
      const mag = Math.max(1, Math.round(Math.min(newW, newH) / 32));
      raw = updateBQMag(raw, b.rotation ?? 'N', mag);
    } else if (isLogoBlock(b)) {
      const newSize = Math.max(8, Math.round(newH / 1.6));
      raw = updateA0(raw, newSize, b.rotation ?? 'N');
    } else if (b.tipo === 'text') {
      // Se ajustou lateralmente, muda fbWidth; caso contrário, muda font size pela altura.
      const dw = Math.abs(newW - (elementBounds(b, logoUrl).w));
      const dh = Math.abs(newH - (elementBounds(b, logoUrl).h));
      if (dw > dh) raw = updateFBWidth(raw, newW, b);
      else {
        const newSize = Math.max(8, Math.round(newH - 4));
        raw = updateA0(raw, newSize, b.rotation ?? 'N');
      }
    }
    onChange(replaceBlock(zpl, b, raw));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = svgPoint(e.clientX, e.clientY);
    if (resizing) {
      const b = blocks[resizing.idx];
      if (!b) return;
      const dx = p.x - resizing.startPx;
      const dy = p.y - resizing.startPy;
      let nx = resizing.startX;
      let ny = resizing.startY;
      let nw = resizing.startW;
      let nh = resizing.startH;
      const d = resizing.dir;
      if (d.includes('e')) nw = resizing.startW + dx;
      if (d.includes('s')) nh = resizing.startH + dy;
      if (d.includes('w')) { nx = resizing.startX + dx; nw = resizing.startW - dx; }
      if (d.includes('n')) { ny = resizing.startY + dy; nh = resizing.startH - dy; }
      applyResize(b, nx, ny, nw, nh);
      return;
    }
    if (!dragging) return;
    const b = blocks[dragging.idx];
    if (!b) return;
    const rawX = p.x - contentX - dragging.offX;
    const rawY = p.y - contentY - dragging.offY;
    const { snapX, snapY, g } = computeSnap(b, rawX, rawY);
    setGuides(g);
    if (Math.round(snapX) === b.x && Math.round(snapY) === b.y) return;
    onChange(replaceBlock(zpl, b, rewriteBlockCoords(b, snapX, snapY)));
  };

  const onPointerUp = () => {
    setDragging(null);
    setResizing(null);
    setGuides({});
  };

  const onDoubleClickBlock = (b: ParsedBlock) => setEditing(b);

  const applyEdit = (edit: ElementEditValues) => {
    if (!editing) return;
    const current = parseBlocks(zpl).find((x) => x.sourceStart === editing.sourceStart) ?? editing;
    onChange(replaceBlock(zpl, current, applyEditToBlock(current, edit, viewW)));
    setEditing(null);
  };

  const deleteEditing = () => {
    if (!editing) return;
    const current = parseBlocks(zpl).find((x) => x.sourceStart === editing.sourceStart) ?? editing;
    const before = zpl.slice(0, current.sourceStart).replace(/\n\s*$/, '\n');
    const after = zpl.slice(current.sourceEnd).replace(/^\s*\n/, '\n');
    onChange(before + after);
    setEditing(null);
    setSelectedIdx(null);
  };

  const selectedBlock = selectedIdx != null ? blocks[selectedIdx] : null;

  // Atalhos de teclado: Delete remove · setas movem (Shift = passo maior).
  // Ctrl+Z/Y ficam a cargo do componente pai (histórico do ZPL completo).
  useEffect(() => {
    if (selectedIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;
      const current = parseBlocks(zpl)[selectedIdx];
      if (!current) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const before = zpl.slice(0, current.sourceStart).replace(/\n\s*$/, '\n');
        const after = zpl.slice(current.sourceEnd).replace(/^\s*\n/, '\n');
        onChange(before + after);
        setSelectedIdx(null);
        return;
      }

      if (e.key.startsWith('Arrow')) {
        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;
        else if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;
        else return;
        e.preventDefault();
        const nx = Math.max(0, current.x + dx);
        const ny = Math.max(0, current.y + dy);
        if (nx === current.x && ny === current.y) return;
        onChange(replaceBlock(zpl, current, rewriteBlockCoords(current, nx, ny)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIdx, zpl, onChange]);


  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="none"
        className="w-full h-full bg-white select-none touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerDown={() => setSelectedIdx(null)}
        role="img"
        aria-label="Preview interativo da etiqueta"
      >
        <rect x={0} y={0} width={viewW} height={viewH} fill="#fff" />
        <line x1={viewW / 2} y1={0} x2={viewW / 2} y2={viewH} stroke="#e5e7eb" strokeDasharray="2 6" strokeWidth={1} />
        <line x1={0} y1={viewH / 2} x2={viewW} y2={viewH / 2} stroke="#e5e7eb" strokeDasharray="2 6" strokeWidth={1} />

        {/* Grupo de conteúdo: SEM clipPath no editor — elementos fora dos limites
            precisam continuar visíveis/arrastáveis para o usuário reposicioná-los. */}
        <g transform={`translate(${contentX}, ${contentY})`}>
        {blocks.map((b) => {
          const commonHandlers = {
            onPointerDown: (e: React.PointerEvent) => onPointerDown(e, b),
            onDoubleClick: () => onDoubleClickBlock(b),
            style: { cursor: 'grab' as const },
          };
          const { w: eW, h: eH } = elementBounds(b, logoUrl);
          const rotDeg = ROT_DEG[b.rotation ?? 'N'];
          const rotTransform = rotDeg ? `rotate(${rotDeg} ${b.x + eW / 2} ${b.y + eH / 2})` : undefined;

          if (isLogoBlock(b)) {
            const { w, h } = logoDims(b);
            return (
              <g key={b.index} transform={rotTransform}>
                <g {...commonHandlers}>
                  {logoUrl ? (
                    <image href={logoUrl} x={b.x} y={b.y} height={h} width={w} preserveAspectRatio="xMidYMid meet" />
                  ) : (
                    <>
                      <rect x={b.x} y={b.y} width={w} height={h} fill="#f3f4f6" stroke="#d1d5db" strokeDasharray="4 3" />
                      <text x={b.x + w / 2} y={b.y + h / 2 + 4} fontSize={12} fontFamily={fontFamily} fill="#6b7280" textAnchor="middle" pointerEvents="none">LOGO</text>
                    </>
                  )}
                  <rect x={b.x} y={b.y} width={w} height={h} fill="transparent" className="hover:stroke-primary/40" stroke="transparent" strokeWidth={1} />
                </g>
              </g>
            );
          }

          if (b.tipo === 'text') {
            const raw = interpolate(b.fd);
            let lines = raw.split(/\\&/g);
            const charW = b.size * 0.55;
            if (b.fbWidth) {
              const maxChars = Math.max(1, Math.floor(b.fbWidth / charW));
              const wrapped: string[] = [];
              for (const ln of lines) {
                if (ln.length <= maxChars) { wrapped.push(ln); continue; }
                const words = ln.split(/\s+/);
                let cur = '';
                for (const w of words) {
                  if (!cur) { cur = w; continue; }
                  if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
                  else { wrapped.push(cur); cur = w; }
                }
                if (cur) wrapped.push(cur);
              }
              lines = wrapped.slice(0, Math.max(1, b.fbMaxLines ?? 1));
            }
            const align = b.align ?? 'L';
            const lineH = b.size + (b.fbSpacing ?? 0);
            const naturalW = Math.max(20, lines.reduce((a, l) => Math.max(a, l.length), 1) * charW);
            const maxAvail = Math.max(20, contentW - b.x);
            const boxW = Math.min(maxAvail, b.fbWidth ?? naturalW);
            const boxH = lines.length * lineH;
            let anchorX = b.x;
            let textAnchor: 'start' | 'middle' | 'end' = 'start';
            if (b.fbWidth) {
              if (align === 'C') { anchorX = b.x + b.fbWidth / 2; textAnchor = 'middle'; }
              else if (align === 'R') { anchorX = b.x + b.fbWidth; textAnchor = 'end'; }
            }
            return (
              <g key={b.index} transform={rotTransform} {...commonHandlers}>
                {b.reverse && <rect x={b.x} y={b.y} width={boxW} height={boxH} fill={lineColor} />}
                <rect x={b.x} y={b.y} width={boxW} height={boxH} fill="transparent" stroke="transparent" strokeWidth={1} className="hover:stroke-primary/40" />
                {lines.map((ln, k) => (
                  <text key={k} x={anchorX} y={b.y + b.size * 0.85 + k * lineH} fontSize={b.size} fontFamily={fontFamily} fill={b.reverse ? '#fff' : lineColor} textAnchor={textAnchor} pointerEvents="none">
                    {ln}
                  </text>
                ))}
              </g>
            );
          }
          if (b.tipo === 'barcode') {
            const text = interpolate(b.fd);
            return (
              <g key={b.index} {...commonHandlers}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <rect key={i} x={b.x + i * 6} y={b.y} width={i % 3 === 0 ? 4 : 2} height={80} fill={lineColor} />
                ))}
                <text x={b.x} y={b.y + 100} fontSize={18} fontFamily={fontFamily} fill={lineColor} pointerEvents="none">{text}</text>
                <rect x={b.x} y={b.y} width={240} height={100} fill="transparent" stroke="transparent" strokeWidth={1} className="hover:stroke-primary/40" />
              </g>
            );
          }
          if (b.tipo === 'qr') {
            const text = interpolate(b.fd);
            const side = Math.max(60, (b.qrMag ?? 4) * 32);
            const payload = text.replace(/^LA,/, '') || 'QR';
            return (
              <g key={b.index} transform={rotTransform} {...commonHandlers}>
                <foreignObject x={b.x} y={b.y} width={side} height={side}>
                  <div style={{ width: side, height: side, background: '#fff' }}>
                    <QRCodeSVG value={payload} size={side} level="M" includeMargin={false} />
                  </div>
                </foreignObject>
                <rect x={b.x} y={b.y} width={side} height={side} fill="transparent" stroke="transparent" strokeWidth={1} className="hover:stroke-primary/40" />
              </g>
            );
          }
          if (b.tipo === 'box' || b.tipo === 'line') {
            const w = b.width ?? 0;
            const h = b.height ?? 0;
            const t = lineThickness > 0 ? Math.max(1, lineThickness) : 0;
            const dash = strokeDashFor(lineStyle);
            const isHorizontalLine = h <= 2 && w > h;
            const isVerticalLine = w <= 2 && h >= w;
            const isLine = isHorizontalLine || isVerticalLine;
            const renderedW = isVerticalLine && t > 0 ? t : Math.max(1, w);
            const renderedH = isHorizontalLine && t > 0 ? t : Math.max(1, h);
            return (
              <g key={b.index} {...commonHandlers}>
                <rect x={b.x} y={b.y} width={renderedW} height={renderedH} fill={isLine ? lineColor : 'none'} stroke={isLine || t <= 0 ? 'none' : lineColor} strokeWidth={t} strokeDasharray={dash} />
                <rect x={b.x} y={b.y} width={Math.max(1, w)} height={Math.max(1, h)} fill="transparent" stroke="transparent" strokeWidth={1} className="hover:stroke-primary/40" />
              </g>
            );
          }
          return null;
        })}
        </g>

        {/* SELECTION FRAME — desenhado por cima */}
        <g transform={`translate(${contentX}, ${contentY})`}>
        {selectedBlock && (() => {
          const b = selectedBlock;
          const { w, h } = elementBounds(b, logoUrl);
          const rotDeg = ROT_DEG[b.rotation ?? 'N'];
          const cx = b.x + w / 2;
          const cy = b.y + h / 2;
          const frameTransform = rotDeg ? `rotate(${rotDeg} ${cx} ${cy})` : undefined;
          const canRotate = b.tipo === 'text' || b.tipo === 'qr';
          const canResize = b.tipo !== 'barcode';

          const handles: { dir: HandleDir; hx: number; hy: number; shape: 'dot' | 'barH' | 'barV' }[] = [
            { dir: 'nw', hx: b.x,       hy: b.y,       shape: 'dot' },
            { dir: 'ne', hx: b.x + w,   hy: b.y,       shape: 'dot' },
            { dir: 'sw', hx: b.x,       hy: b.y + h,   shape: 'dot' },
            { dir: 'se', hx: b.x + w,   hy: b.y + h,   shape: 'dot' },
            { dir: 'n',  hx: b.x + w/2, hy: b.y,       shape: 'barH' },
            { dir: 's',  hx: b.x + w/2, hy: b.y + h,   shape: 'barH' },
            { dir: 'w',  hx: b.x,       hy: b.y + h/2, shape: 'barV' },
            { dir: 'e',  hx: b.x + w,   hy: b.y + h/2, shape: 'barV' },
          ];

          const rotHx = cx;
          const rotHy = b.y + h + 22;

          return (
            <g transform={frameTransform} pointerEvents="visiblePainted">
              {/* Outline principal */}
              <rect
                x={b.x - 0.5} y={b.y - 0.5} width={w + 1} height={h + 1}
                fill="none" stroke="hsl(var(--primary))" strokeWidth={1.2}
                style={{ filter: 'drop-shadow(0 0 2px hsl(var(--primary) / 0.35))' }}
              />

              {/* Badge de tipo + coords */}
              <g transform={`translate(${b.x}, ${b.y - 18})`}>
                <rect x={0} y={0} width={Math.max(70, TIPO_LABEL[b.tipo].length * 6 + 42)} height={14} rx={3}
                  fill="hsl(var(--primary))" />
                <text x={5} y={10} fontSize={10} fontFamily="monospace" fill="hsl(var(--primary-foreground))" pointerEvents="none">
                  {TIPO_LABEL[b.tipo]} · {b.x},{b.y}
                </text>
              </g>

              {/* Handles de resize */}
              {canResize && handles.map((hd) => {
                if (hd.shape === 'dot') {
                  return (
                    <circle key={hd.dir}
                      cx={hd.hx} cy={hd.hy} r={5}
                      fill="#fff" stroke="hsl(var(--primary))" strokeWidth={1.5}
                      style={{ cursor: CURSOR_FOR[hd.dir], filter: 'drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.25))' }}
                      onPointerDown={(e) => onResizeDown(e, b, hd.dir)}
                    />
                  );
                }
                const isH = hd.shape === 'barH';
                const bw = isH ? 14 : 5;
                const bh = isH ? 5 : 14;
                return (
                  <rect key={hd.dir}
                    x={hd.hx - bw / 2} y={hd.hy - bh / 2} width={bw} height={bh} rx={1.5}
                    fill="#fff" stroke="hsl(var(--primary))" strokeWidth={1.5}
                    style={{ cursor: CURSOR_FOR[hd.dir], filter: 'drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.25))' }}
                    onPointerDown={(e) => onResizeDown(e, b, hd.dir)}
                  />
                );
              })}

              {/* Alça de rotação */}
              {canRotate && (
                <g>
                  <line x1={cx} y1={b.y + h} x2={rotHx} y2={rotHy - 7} stroke="hsl(var(--primary))" strokeWidth={1} />
                  <circle
                    cx={rotHx} cy={rotHy} r={8}
                    fill="#fff" stroke="hsl(var(--primary))" strokeWidth={1.5}
                    style={{ cursor: 'grab', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.25))' }}
                    onPointerDown={(e) => { e.stopPropagation(); onRotate(b); }}
                  >
                    <title>Girar 90°</title>
                  </circle>
                  {/* ícone rotate (setas circulares simplificadas) */}
                  <path
                    d={`M ${rotHx - 3.5} ${rotHy - 1} A 3.5 3.5 0 1 1 ${rotHx + 3.5} ${rotHy - 1}`}
                    fill="none" stroke="hsl(var(--primary))" strokeWidth={1.2} strokeLinecap="round"
                    pointerEvents="none"
                  />
                  <path d={`M ${rotHx + 3.5} ${rotHy - 2.5} l 1.5 -0.5 l -0.5 2 z`} fill="hsl(var(--primary))" pointerEvents="none" />
                </g>
              )}
            </g>
          );
        })()}
        </g>

        {(dragging || resizing) && guides.vx !== undefined && (
          <line x1={contentX + guides.vx} y1={contentY} x2={contentX + guides.vx} y2={contentY + contentH} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
        {(dragging || resizing) && guides.hy !== undefined && (
          <line x1={contentX} y1={contentY + guides.hy} x2={contentX + contentW} y2={contentY + guides.hy} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 3" />
        )}

        {renderBorder()}

      </svg>


      <ElementEditDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        block={editing}
        variaveis={variaveis}
        onSubmit={applyEdit}
        onDelete={deleteEditing}
      />
    </>

  );
});

/** Utilitário: adiciona um novo bloco ZPL antes do ^XZ final. */
export function appendZplBlock(zpl: string, block: string): string {
  const idx = zpl.lastIndexOf('^XZ');
  if (idx === -1) return zpl + '\n' + block;
  return zpl.slice(0, idx) + block + '\n' + zpl.slice(idx);
}

export type NewBlockKind = 'text' | 'qr' | 'barcode' | 'logo' | 'line-h' | 'line-v' | 'rect' | 'box-filled';

/** Cria um novo bloco de acordo com o tipo — inserido próximo do centro da etiqueta. */
export function createNewBlock(tipo: NewBlockKind, dims: { largura: number; altura: number }): string {
  const cx = Math.round((dims.largura * 8) / 2);
  const cy = Math.round((dims.altura * 8) / 2);
  if (tipo === 'text') return `^FO${cx - 40},${cy}^A0N,28,28^FDNovo texto^FS`;
  if (tipo === 'qr') return `^FO${cx - 60},${cy - 60}^BQN,2,4^FDLA,QR^FS`;
  if (tipo === 'barcode') return `^FO${cx - 100},${cy}^BCN,80,Y,N,N^FD123456^FS`;
  if (tipo === 'logo') return `^FO${cx - 60},${cy - 20}^A0N,36,36^FD{{logo}}^FS`;
  if (tipo === 'line-h') return `^FO${cx - 100},${cy}^GB200,1,2^FS`;
  if (tipo === 'line-v') return `^FO${cx},${cy - 60}^GB1,120,2^FS`;
  if (tipo === 'rect') return `^FO${cx - 60},${cy - 40}^GB120,80,2^FS`;
  return `^FO${cx - 60},${cy - 40}^GB120,80,80^FS`;
}
InteractiveZPLEditor.displayName = 'InteractiveZPLEditor';

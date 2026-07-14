/**
 * InteractiveZPLEditor — preview interativo do ZPL.
 * - Arraste elementos: reescreve ^FO x,y no ZPL.
 * - Redimensione LOGO e SHAPES (retângulo/linha/box) pelo handle no canto.
 * - Duplo-clique: abre o dialog. Para shapes, permite ajustar w/h/thickness/estilo.
 * - Estilo do shape (solid/dashed/dotted) é codificado como comentário `^FX-S:xxx-`
 *   dentro do bloco (não afeta impressão — ZPL trata como comentário).
 * - Snap-to-grid com guias de alinhamento.
 * - QR real via qrcode.react.
 */
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ElementEditDialog, type ElementEditValues } from './ElementEditDialog';

export type ShapeStyle = 'solid' | 'dashed' | 'dotted';
export type TextAlign = 'L' | 'C' | 'R';

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
}

const BLOCK_RE = /\^FO(\d+),(\d+)([\s\S]*?)\^FS/g;
const SNAP_THRESHOLD = 6; // dots

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
    const a0 = inner.match(/\^A0N,(\d+),(\d+)/);
    const size = a0 ? parseInt(a0[1], 10) : 24;
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
    if (/\^BC/.test(inner)) tipo = 'barcode';
    else if (/\^BQ/.test(inner)) {
      tipo = 'qr';
      const bq = inner.match(/\^BQN,\d+,(\d+)/);
      qrMag = bq ? parseInt(bq[1], 10) : 4;
    } else if (/\^GB/.test(inner)) {
      const gb = inner.match(/\^GB(\d+),(\d+),(\d+)/);
      if (gb) {
        width = parseInt(gb[1], 10);
        height = parseInt(gb[2], 10);
        thickness = parseInt(gb[3], 10);
      }
      tipo = (width === 1 || height === 1) ? 'line' : 'box';
    }
    out.push({ index: i++, sourceStart: start, sourceEnd: end, raw, x, y, size, reverse, fd, tipo, width, height, thickness, style, qrMag, align, fbWidth, fbMaxLines, fbSpacing });
  }
  return out;
}

function replaceBlock(zpl: string, block: ParsedBlock, newRaw: string): string {
  return zpl.slice(0, block.sourceStart) + newRaw + zpl.slice(block.sourceEnd);
}

function rewriteBlockCoords(block: ParsedBlock, nx: number, ny: number): string {
  return block.raw.replace(/^\^FO\d+,\d+/, `^FO${Math.max(0, Math.round(nx))},${Math.max(0, Math.round(ny))}`);
}

function applyEditToBlock(block: ParsedBlock, edit: ElementEditValues, viewW: number): string {
  let raw = block.raw;

  // Reposição fina (X/Y) — aplica antes de qualquer outro ajuste
  if (edit.x !== undefined || edit.y !== undefined) {
    const nx = Math.max(0, Math.round(edit.x ?? block.x));
    const ny = Math.max(0, Math.round(edit.y ?? block.y));
    raw = raw.replace(/^\^FO\d+,\d+/, `^FO${nx},${ny}`);
  }

  // SHAPE (box/line)
  if (block.tipo === 'box' || block.tipo === 'line') {
    const w = Math.max(1, edit.width ?? block.width ?? 100);
    const h = Math.max(1, edit.height ?? block.height ?? 100);
    const t = Math.max(1, edit.thickness ?? block.thickness ?? 2);
    raw = raw.replace(/\^GB\d+,\d+,\d+/, `^GB${w},${h},${t}`);
    raw = raw.replace(/\^FX-S:\w+-/, '');
    raw = raw.replace(/\^FS$/, `^FX-S:${edit.style ?? 'solid'}-^FS`);
    return raw;
  }

  // QR: apenas atualiza payload (^FD)
  if (block.tipo === 'qr') {
    raw = raw.replace(/\^FD[\s\S]*?\^FS$/, `^FD${edit.fd}^FS`);
    return raw;
  }

  // TEXT (inclui logo)
  if (block.tipo === 'text') {
    if (/\^A0N,\d+,\d+/.test(raw)) {
      raw = raw.replace(/\^A0N,\d+,\d+/, `^A0N,${edit.size},${edit.size}`);
    } else {
      raw = raw.replace(/\^FD/, `^A0N,${edit.size},${edit.size}^FD`);
    }

    // Alinhamento e quebra de linha via ^FB{w},{maxLines},{spacing},{align}
    const align: TextAlign = edit.align ?? 'L';
    const maxLines = Math.max(1, edit.fbMaxLines ?? block.fbMaxLines ?? 1);
    const wantsFB = align !== 'L' || maxLines > 1 || (edit.fbWidth ?? block.fbWidth) !== undefined;
    // remove qualquer ^FB existente
    raw = raw.replace(/\^FB\d+,\d+,-?\d+,[LCRJ]/, '');
    if (wantsFB) {
      const fbW = Math.max(20, edit.fbWidth ?? block.fbWidth ?? Math.max(40, viewW - block.x));
      const spacing = block.fbSpacing ?? 0;
      raw = raw.replace(/\^FD/, `^FB${fbW},${maxLines},${spacing},${align}^FD`);
    }
  }
  const hasFR = /\^FR(?![A-Z])/.test(raw);
  if (edit.reverse && !hasFR) {
    raw = raw.replace(/\^FD/, '^FR^FD');
  } else if (!edit.reverse && hasFR) {
    raw = raw.replace(/\^FR(?![A-Z])/, '');
  }
  raw = raw.replace(/\^FD[\s\S]*?\^FS$/, `^FD${edit.fd}^FS`);
  return raw;
}

/** True if a text block should be rendered as the uploaded logo image. */
function isLogoBlock(b: ParsedBlock): boolean {
  return b.tipo === 'text' && /\{\{\s*logo\s*\}\}/i.test(b.fd);
}

function logoDims(b: ParsedBlock): { w: number; h: number } {
  const h = b.size * 1.6;
  const w = h * 2.5;
  return { w, h };
}

/** Estimated element bounding box in dots (para snap contra outros elementos). */
function bbox(b: ParsedBlock, logoUrl?: string): { w: number; h: number } {
  if (b.tipo === 'qr') {
    const s = (b.qrMag ?? 4) * 8;
    const side = Math.max(60, s * 4);
    return { w: side, h: side };
  }
  if (b.tipo === 'barcode') return { w: 240, h: 100 };
  if (b.tipo === 'box' || b.tipo === 'line') return { w: b.width ?? 40, h: b.height ?? 40 };
  if (isLogoBlock(b) && logoUrl) return logoDims(b);
  const chars = Math.max(1, b.fd.length);
  return { w: Math.max(20, chars * b.size * 0.55), h: b.size + 6 };
}

function updateA0Size(raw: string, size: number): string {
  if (/\^A0N,\d+,\d+/.test(raw)) return raw.replace(/\^A0N,\d+,\d+/, `^A0N,${size},${size}`);
  return raw.replace(/\^FD/, `^A0N,${size},${size}^FD`);
}

function updateGBDims(raw: string, w: number, h: number): string {
  return raw.replace(/\^GB\d+,\d+,(\d+)/, `^GB${Math.max(1, Math.round(w))},${Math.max(1, Math.round(h))},$1`);
}

function strokeDashFor(style?: ShapeStyle): string | undefined {
  if (style === 'dashed') return '8 4';
  if (style === 'dotted') return '2 3';
  return undefined;
}

interface Props {
  zpl: string;
  onChange: (zpl: string) => void;
  valores: Record<string, string>;
  dimensoes: { largura: number; altura: number };
  variaveis: { chave: string; label: string }[];
  logoUrl?: string;
}

export const InteractiveZPLEditor = memo(function InteractiveZPLEditor({
  zpl, onChange, valores, dimensoes, variaveis, logoUrl,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<null | { idx: number; offX: number; offY: number }>(null);
  const [resizing, setResizing] = useState<null | { idx: number }>(null);
  const [guides, setGuides] = useState<{ vx?: number; vy?: number; hx?: number; hy?: number }>({});
  const [editing, setEditing] = useState<ParsedBlock | null>(null);

  const blocks = useMemo(() => parseBlocks(zpl), [zpl]);
  const viewW = dimensoes.largura * 8;
  const viewH = dimensoes.altura * 8;

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
    const p = svgPoint(e.clientX, e.clientY);
    setDragging({ idx: b.index, offX: p.x - b.x, offY: p.y - b.y });
  };

  const onResizeDown = (e: React.PointerEvent, b: ParsedBlock) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setResizing({ idx: b.index });
  };

  const computeSnap = (b: ParsedBlock, nx: number, ny: number) => {
    const { w, h } = bbox(b, logoUrl);
    const cx = nx + w / 2;
    const cy = ny + h / 2;
    let snapX = nx;
    let snapY = ny;
    const g: typeof guides = {};

    if (Math.abs(cx - viewW / 2) < SNAP_THRESHOLD) { snapX = viewW / 2 - w / 2; g.vx = viewW / 2; }
    if (Math.abs(cy - viewH / 2) < SNAP_THRESHOLD) { snapY = viewH / 2 - h / 2; g.hy = viewH / 2; }
    for (const other of blocks) {
      if (other.index === b.index) continue;
      const ob = bbox(other, logoUrl);
      const ocx = other.x + ob.w / 2;
      const ocy = other.y + ob.h / 2;
      if (Math.abs(nx - other.x) < SNAP_THRESHOLD) { snapX = other.x; g.vx = other.x; }
      else if (Math.abs(cx - ocx) < SNAP_THRESHOLD) { snapX = ocx - w / 2; g.vx = ocx; }
      if (Math.abs(ny - other.y) < SNAP_THRESHOLD) { snapY = other.y; g.hy = other.y; }
      else if (Math.abs(cy - ocy) < SNAP_THRESHOLD) { snapY = ocy - h / 2; g.hy = ocy; }
    }
    return { snapX, snapY, g };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = svgPoint(e.clientX, e.clientY);
    if (resizing) {
      const b = blocks[resizing.idx];
      if (!b) return;
      if (isLogoBlock(b)) {
        // altura visual = size*1.6 → resize por Y
        const newH = Math.max(12, p.y - b.y);
        const newSize = Math.max(8, Math.round(newH / 1.6));
        onChange(replaceBlock(zpl, b, updateA0Size(b.raw, newSize)));
        return;
      }
      if (b.tipo === 'box' || b.tipo === 'line') {
        const newW = Math.max(1, p.x - b.x);
        const newH = Math.max(1, p.y - b.y);
        onChange(replaceBlock(zpl, b, updateGBDims(b.raw, newW, newH)));
        return;
      }
      return;
    }
    if (!dragging) return;
    const b = blocks[dragging.idx];
    if (!b) return;
    const rawX = p.x - dragging.offX;
    const rawY = p.y - dragging.offY;
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

  const onDoubleClickBlock = (b: ParsedBlock) => {
    setEditing(b);
  };

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
  };

  const renderResizeHandle = (x: number, y: number, b: ParsedBlock) => (
    <rect
      x={x - 5} y={y - 5} width={10} height={10}
      fill="#3B82F6" stroke="#fff" strokeWidth={1.5}
      style={{ cursor: 'nwse-resize' }}
      onPointerDown={(e) => onResizeDown(e, b)}
    />
  );

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full bg-white select-none touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="img"
        aria-label="Preview interativo da etiqueta"
      >
        <rect x={0} y={0} width={viewW} height={viewH} fill="#fff" />

        <line x1={viewW / 2} y1={0} x2={viewW / 2} y2={viewH} stroke="#e5e7eb" strokeDasharray="2 6" strokeWidth={1} />
        <line x1={0} y1={viewH / 2} x2={viewW} y2={viewH / 2} stroke="#e5e7eb" strokeDasharray="2 6" strokeWidth={1} />

        {blocks.map((b) => {
          const isDragging = dragging?.idx === b.index;
          const commonHandlers = {
            onPointerDown: (e: React.PointerEvent) => onPointerDown(e, b),
            onDoubleClick: () => onDoubleClickBlock(b),
            style: { cursor: 'grab' as const },
          };

          if (isLogoBlock(b)) {
            const { w, h } = logoDims(b);
            return (
              <g key={b.index}>
                <g {...commonHandlers}>
                  {logoUrl ? (
                    <image href={logoUrl} x={b.x} y={b.y} height={h} width={w} preserveAspectRatio="xMidYMid meet" />
                  ) : (
                    <>
                      <rect x={b.x} y={b.y} width={w} height={h} fill="#f3f4f6" stroke="#d1d5db" strokeDasharray="4 3" />
                      <text x={b.x + w / 2} y={b.y + h / 2 + 4} fontSize={12} fontFamily="monospace" fill="#6b7280" textAnchor="middle" pointerEvents="none">
                        LOGO
                      </text>
                    </>
                  )}
                  <rect x={b.x - 2} y={b.y - 2} width={w + 4} height={h + 4}
                    fill="transparent" stroke={isDragging ? '#3B82F6' : 'transparent'}
                    strokeDasharray="4 3" strokeWidth={2}
                    className="hover:stroke-primary/50" />
                </g>
                {renderResizeHandle(b.x + w, b.y + h, b)}
              </g>
            );
          }

          if (b.tipo === 'text') {
            const raw = interpolate(b.fd);
            // quebras explícitas via "\&" + word-wrap por ^FB
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
            const maxAvail = Math.max(20, viewW - b.x);
            const boxW = Math.min(maxAvail, b.fbWidth ?? naturalW);
            const boxH = lines.length * lineH + 6;
            let anchorX = b.x;
            let textAnchor: 'start' | 'middle' | 'end' = 'start';
            if (b.fbWidth) {
              if (align === 'C') { anchorX = b.x + b.fbWidth / 2; textAnchor = 'middle'; }
              else if (align === 'R') { anchorX = b.x + b.fbWidth; textAnchor = 'end'; }
            }
            return (
              <g key={b.index} {...commonHandlers}>
                {b.reverse && <rect x={b.x - 2} y={b.y - 2} width={boxW + 4} height={boxH} fill="#111" />}
                <rect x={b.x - 2} y={b.y - 2} width={boxW + 4} height={boxH}
                  fill="transparent" stroke={isDragging ? '#3B82F6' : 'transparent'}
                  strokeDasharray="4 3" strokeWidth={2}
                  className="hover:stroke-primary/50" />
                {lines.map((ln, k) => (
                  <text
                    key={k}
                    x={anchorX} y={b.y + b.size + k * lineH}
                    fontSize={b.size} fontFamily="monospace"
                    fill={b.reverse ? '#fff' : '#111'}
                    textAnchor={textAnchor}
                    pointerEvents="none"
                  >
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
                  <rect key={i} x={b.x + i * 6} y={b.y} width={i % 3 === 0 ? 4 : 2} height={80} fill="#111" />
                ))}
                <text x={b.x} y={b.y + 100} fontSize={18} fontFamily="monospace" fill="#111" pointerEvents="none">{text}</text>
                <rect x={b.x - 2} y={b.y - 2} width={244} height={108}
                  fill="transparent" stroke={isDragging ? '#3B82F6' : 'transparent'}
                  strokeDasharray="4 3" strokeWidth={2}
                  className="hover:stroke-primary/50" />
              </g>
            );
          }
          if (b.tipo === 'qr') {
            const text = interpolate(b.fd);
            const side = Math.max(60, (b.qrMag ?? 4) * 32);
            const payload = text.replace(/^LA,/, '') || 'QR';
            return (
              <g key={b.index} {...commonHandlers}>
                <foreignObject x={b.x} y={b.y} width={side} height={side}>
                  <div style={{ width: side, height: side, background: '#fff' }}>
                    <QRCodeSVG value={payload} size={side} level="M" includeMargin={false} />
                  </div>
                </foreignObject>
                <rect x={b.x - 2} y={b.y - 2} width={side + 4} height={side + 4}
                  fill="transparent" stroke={isDragging ? '#3B82F6' : 'transparent'}
                  strokeDasharray="4 3" strokeWidth={2}
                  className="hover:stroke-primary/50" />
              </g>
            );
          }
          if (b.tipo === 'box' || b.tipo === 'line') {
            const w = b.width ?? 0;
            const h = b.height ?? 0;
            const t = Math.max(1, b.thickness ?? 2);
            const dash = strokeDashFor(b.style);
            return (
              <g key={b.index}>
                <g {...commonHandlers}>
                  <rect
                    x={b.x} y={b.y} width={w} height={h}
                    fill="none" stroke="#111" strokeWidth={t}
                    strokeDasharray={dash}
                  />
                  <rect x={b.x - 2} y={b.y - 2} width={w + 4} height={h + 4}
                    fill="transparent" stroke={isDragging ? '#3B82F6' : 'transparent'}
                    strokeDasharray="4 3" strokeWidth={2}
                    className="hover:stroke-primary/50" />
                </g>
                {renderResizeHandle(b.x + w, b.y + h, b)}
              </g>
            );
          }
          return null;
        })}

        {(dragging || resizing) && guides.vx !== undefined && (
          <line x1={guides.vx} y1={0} x2={guides.vx} y2={viewH} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
        {(dragging || resizing) && guides.hy !== undefined && (
          <line x1={0} y1={guides.hy} x2={viewW} y2={guides.hy} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
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
  return `^FO${cx - 60},${cy - 40}^GB120,80,80^FS`; // box-filled: thickness == height
}
InteractiveZPLEditor.displayName = 'InteractiveZPLEditor';

/**
 * InteractiveZPLEditor — preview interativo do ZPL.
 * - Arraste elementos: reescreve ^FO x,y no ZPL fonte.
 * - Snap-to-grid: guias de alinhamento (centro horizontal/vertical do label
 *   e alinhamento com outros elementos) — travam ao passar próximo.
 * - Duplo-clique em texto/QR/código: abre dialog para editar conteúdo,
 *   atribuir variável, mudar tamanho e negativo (^FR).
 * - QR real via qrcode.react.
 * - Suporte a logo: quando o bloco de texto tem `fd = {{logo}}` (ou contém apenas
 *   o marcador logo) e um `logoUrl` é fornecido, renderiza como <image>.
 */
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ElementEditDialog, type ElementEditValues } from './ElementEditDialog';

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
  tipo: 'text' | 'barcode' | 'qr' | 'box';
  width?: number;
  height?: number;
  /** Magnificação do QR (^BQN,2,N). */
  qrMag?: number;
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
    let tipo: ParsedBlock['tipo'] = 'text';
    let width: number | undefined;
    let height: number | undefined;
    let qrMag: number | undefined;
    if (/\^BC/.test(inner)) tipo = 'barcode';
    else if (/\^BQ/.test(inner)) {
      tipo = 'qr';
      const bq = inner.match(/\^BQN,\d+,(\d+)/);
      qrMag = bq ? parseInt(bq[1], 10) : 4;
    } else if (/\^GB/.test(inner)) {
      tipo = 'box';
      const gb = inner.match(/\^GB(\d+),(\d+),(\d+)/);
      if (gb) { width = parseInt(gb[1], 10); height = parseInt(gb[2], 10); }
    }
    out.push({ index: i++, sourceStart: start, sourceEnd: end, raw, x, y, size, reverse, fd, tipo, width, height, qrMag });
  }
  return out;
}

function replaceBlock(zpl: string, block: ParsedBlock, newRaw: string): string {
  return zpl.slice(0, block.sourceStart) + newRaw + zpl.slice(block.sourceEnd);
}

function rewriteBlockCoords(block: ParsedBlock, nx: number, ny: number): string {
  return block.raw.replace(/^\^FO\d+,\d+/, `^FO${Math.max(0, Math.round(nx))},${Math.max(0, Math.round(ny))}`);
}

function applyEditToBlock(block: ParsedBlock, edit: ElementEditValues): string {
  let raw = block.raw;
  if (block.tipo === 'text') {
    if (/\^A0N,\d+,\d+/.test(raw)) {
      raw = raw.replace(/\^A0N,\d+,\d+/, `^A0N,${edit.size},${edit.size}`);
    } else {
      raw = raw.replace(/\^FD/, `^A0N,${edit.size},${edit.size}^FD`);
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

/** Estimated element bounding box in dots (para snap contra outros elementos). */
function bbox(b: ParsedBlock, logoUrl?: string): { w: number; h: number } {
  if (b.tipo === 'qr') {
    const s = (b.qrMag ?? 4) * 8; // approx module count × mag
    const side = Math.max(60, s * 4);
    return { w: side, h: side };
  }
  if (b.tipo === 'barcode') return { w: 240, h: 100 };
  if (b.tipo === 'box') return { w: b.width ?? 40, h: b.height ?? 40 };
  if (isLogoBlock(b) && logoUrl) return { w: b.size * 3, h: b.size * 1.6 };
  const chars = Math.max(1, b.fd.length);
  return { w: Math.max(20, chars * b.size * 0.55), h: b.size + 6 };
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

  const computeSnap = (b: ParsedBlock, nx: number, ny: number) => {
    const { w, h } = bbox(b, logoUrl);
    const cx = nx + w / 2;
    const cy = ny + h / 2;
    let snapX = nx;
    let snapY = ny;
    const g: typeof guides = {};

    // Snap horizontal ao centro do label
    if (Math.abs(cx - viewW / 2) < SNAP_THRESHOLD) {
      snapX = viewW / 2 - w / 2;
      g.vx = viewW / 2;
    }
    // Snap vertical ao centro do label
    if (Math.abs(cy - viewH / 2) < SNAP_THRESHOLD) {
      snapY = viewH / 2 - h / 2;
      g.hy = viewH / 2;
    }
    // Alinhamento com outros blocos (x, centro-x, y, centro-y)
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
    if (!dragging) return;
    const b = blocks[dragging.idx];
    if (!b) return;
    const p = svgPoint(e.clientX, e.clientY);
    const rawX = p.x - dragging.offX;
    const rawY = p.y - dragging.offY;
    const { snapX, snapY, g } = computeSnap(b, rawX, rawY);
    setGuides(g);
    if (Math.round(snapX) === b.x && Math.round(snapY) === b.y) return;
    const newRaw = rewriteBlockCoords(b, snapX, snapY);
    onChange(replaceBlock(zpl, b, newRaw));
  };

  const onPointerUp = () => {
    setDragging(null);
    setGuides({});
  };

  const onDoubleClickBlock = (b: ParsedBlock) => {
    if (b.tipo === 'box') return;
    setEditing(b);
  };

  const applyEdit = (edit: ElementEditValues) => {
    if (!editing) return;
    const current = parseBlocks(zpl).find((x) => x.sourceStart === editing.sourceStart) ?? editing;
    const newRaw = applyEditToBlock(current, edit);
    onChange(replaceBlock(zpl, current, newRaw));
    setEditing(null);
  };

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

        {/* Guias de centro (sempre visíveis, sutis) */}
        <line x1={viewW / 2} y1={0} x2={viewW / 2} y2={viewH} stroke="#e5e7eb" strokeDasharray="2 6" strokeWidth={1} />
        <line x1={0} y1={viewH / 2} x2={viewW} y2={viewH / 2} stroke="#e5e7eb" strokeDasharray="2 6" strokeWidth={1} />

        {blocks.map((b) => {
          const isDragging = dragging?.idx === b.index;
          const commonHandlers = {
            onPointerDown: (e: React.PointerEvent) => onPointerDown(e, b),
            onDoubleClick: () => onDoubleClickBlock(b),
            style: { cursor: 'grab' as const },
          };

          // LOGO: bloco de texto contendo {{logo}} vira imagem quando logoUrl existe
          if (isLogoBlock(b)) {
            const h = b.size * 1.6;
            const w = h * 2.5;
            return (
              <g key={b.index} {...commonHandlers}>
                {logoUrl ? (
                  <image href={logoUrl} x={b.x} y={b.y} height={h} preserveAspectRatio="xMidYMid meet" />
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
            );
          }

          if (b.tipo === 'text') {
            const text = interpolate(b.fd);
            const w = Math.max(20, text.length * b.size * 0.55);
            const h = b.size + 6;
            return (
              <g key={b.index} {...commonHandlers}>
                {b.reverse && <rect x={b.x - 2} y={b.y - 2} width={w + 4} height={h} fill="#111" />}
                <rect x={b.x - 2} y={b.y - 2} width={w + 4} height={h}
                  fill="transparent" stroke={isDragging ? '#3B82F6' : 'transparent'}
                  strokeDasharray="4 3" strokeWidth={2}
                  className="hover:stroke-primary/50" />
                <text
                  x={b.x} y={b.y + b.size} fontSize={b.size} fontFamily="monospace"
                  fill={b.reverse ? '#fff' : '#111'}
                  pointerEvents="none"
                >
                  {text}
                </text>
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
          if (b.tipo === 'box') {
            return (
              <g key={b.index} {...commonHandlers}>
                <rect x={b.x} y={b.y} width={b.width ?? 0} height={b.height ?? 0}
                  fill="none" stroke="#111" strokeWidth={2} />
              </g>
            );
          }
          return null;
        })}

        {/* Guias de snap ativas — cyan enquanto arrastando */}
        {dragging && guides.vx !== undefined && (
          <line x1={guides.vx} y1={0} x2={guides.vx} y2={viewH} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
        {dragging && guides.hy !== undefined && (
          <line x1={0} y1={guides.hy} x2={viewW} y2={guides.hy} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 3" />
        )}
      </svg>

      <ElementEditDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        block={editing}
        variaveis={variaveis}
        onSubmit={applyEdit}
      />
    </>
  );
});
InteractiveZPLEditor.displayName = 'InteractiveZPLEditor';

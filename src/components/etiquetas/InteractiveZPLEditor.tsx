/**
 * InteractiveZPLEditor — preview interativo do ZPL.
 * - Arraste elementos: reescreve ^FO x,y no ZPL fonte.
 * - Duplo-clique em texto/código: abre dialog para editar conteúdo,
 *   atribuir variável, mudar tamanho da fonte e ligar/desligar "negativo" (^FR).
 * Mantém o ZPL como fonte da verdade — toda edição visual é uma reescrita local do bloco.
 */
import { memo, useCallback, useMemo, useRef, useState } from 'react';
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
}

const BLOCK_RE = /\^FO(\d+),(\d+)([\s\S]*?)\^FS/g;

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
    if (/\^BC/.test(inner)) tipo = 'barcode';
    else if (/\^BQ/.test(inner)) tipo = 'qr';
    else if (/\^GB/.test(inner)) {
      tipo = 'box';
      const gb = inner.match(/\^GB(\d+),(\d+),(\d+)/);
      if (gb) { width = parseInt(gb[1], 10); height = parseInt(gb[2], 10); }
    }
    out.push({ index: i++, sourceStart: start, sourceEnd: end, raw, x, y, size, reverse, fd, tipo, width, height });
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
  // Ajusta ^A0N,H,W (apenas para texto)
  if (block.tipo === 'text') {
    if (/\^A0N,\d+,\d+/.test(raw)) {
      raw = raw.replace(/\^A0N,\d+,\d+/, `^A0N,${edit.size},${edit.size}`);
    } else {
      // insere antes de ^FD
      raw = raw.replace(/\^FD/, `^A0N,${edit.size},${edit.size}^FD`);
    }
  }
  // Toggle ^FR (negativo)
  const hasFR = /\^FR(?![A-Z])/.test(raw);
  if (edit.reverse && !hasFR) {
    raw = raw.replace(/\^FD/, '^FR^FD');
  } else if (!edit.reverse && hasFR) {
    raw = raw.replace(/\^FR(?![A-Z])/, '');
  }
  // Substitui conteúdo do ^FD...^FS
  raw = raw.replace(/\^FD[\s\S]*?\^FS$/, `^FD${edit.fd}^FS`);
  return raw;
}

interface Props {
  zpl: string;
  onChange: (zpl: string) => void;
  valores: Record<string, string>;
  dimensoes: { largura: number; altura: number };
  variaveis: { chave: string; label: string }[];
}

export const InteractiveZPLEditor = memo(function InteractiveZPLEditor({
  zpl, onChange, valores, dimensoes, variaveis,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<null | { idx: number; offX: number; offY: number }>(null);
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

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const b = blocks[dragging.idx];
    if (!b) return;
    const p = svgPoint(e.clientX, e.clientY);
    const nx = p.x - dragging.offX;
    const ny = p.y - dragging.offY;
    if (Math.round(nx) === b.x && Math.round(ny) === b.y) return;
    const newRaw = rewriteBlockCoords(b, nx, ny);
    onChange(replaceBlock(zpl, b, newRaw));
  };

  const onPointerUp = () => setDragging(null);

  const onDoubleClickBlock = (b: ParsedBlock) => {
    if (b.tipo === 'box') return;
    setEditing(b);
  };

  const applyEdit = (edit: ElementEditValues) => {
    if (!editing) return;
    // Re-parse pela posição no ZPL atual — bloco pode ter mudado
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

        {blocks.map((b) => {
          const text = interpolate(b.fd);
          const isDragging = dragging?.idx === b.index;
          const commonHandlers = {
            onPointerDown: (e: React.PointerEvent) => onPointerDown(e, b),
            onDoubleClick: () => onDoubleClickBlock(b),
            style: { cursor: 'grab' as const },
          };

          if (b.tipo === 'text') {
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
            return (
              <g key={b.index} {...commonHandlers}>
                <rect x={b.x} y={b.y} width={120} height={120} fill="#111" />
                <rect x={b.x + 12} y={b.y + 12} width={96} height={96} fill="#fff" pointerEvents="none" />
                <rect x={b.x + 30} y={b.y + 30} width={60} height={60} fill="#111" pointerEvents="none" />
                <rect x={b.x - 2} y={b.y - 2} width={124} height={124}
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

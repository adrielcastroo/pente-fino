/**
 * ZPLPreview — renderização visual aproximada do ZPL (SVG).
 * Suporta: ^FO x,y ^A0N,h,w ^FD texto ^FS ; ^BCN barcode ; ^BQN qr ; ^GB box.
 */
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Elemento {
  tipo: 'text' | 'barcode' | 'qr' | 'box';
  x: number;
  y: number;
  size: number;
  text: string;
  width?: number;
  height?: number;
}

function parseZpl(zpl: string): Elemento[] {
  const out: Elemento[] = [];
  const blocos = zpl.split('^FS');
  for (const bloco of blocos) {
    const fo = bloco.match(/\^FO(\d+),(\d+)/);
    if (!fo) continue;
    const x = parseInt(fo[1], 10);
    const y = parseInt(fo[2], 10);
    const fd = bloco.match(/\^FD([^^]+)/);
    const text = fd ? fd[1] : '';
    if (/\^BC/.test(bloco)) {
      out.push({ tipo: 'barcode', x, y, size: 100, text });
    } else if (/\^BQ/.test(bloco)) {
      out.push({ tipo: 'qr', x, y, size: 100, text });
    } else if (/\^GB/.test(bloco)) {
      const gb = bloco.match(/\^GB(\d+),(\d+),(\d+)/);
      if (gb) out.push({ tipo: 'box', x, y, size: 0, text: '', width: parseInt(gb[1], 10), height: parseInt(gb[2], 10) });
    } else {
      const a0 = bloco.match(/\^A0N,(\d+),(\d+)/);
      const size = a0 ? parseInt(a0[1], 10) : 24;
      if (text) out.push({ tipo: 'text', x, y, size, text });
    }
  }
  return out;
}

interface ZPLPreviewProps {
  zpl: string;
  variaveis?: Record<string, string>;
  className?: string;
  /** largura/altura em mm da etiqueta */
  dimensoes?: { largura: number; altura: number };
}

/** ZPL px → SVG unit (203dpi ~ 8dots/mm). Preview assume ~200dots ~= 25mm. */
export const ZPLPreview = memo(function ZPLPreview({ zpl, variaveis, className, dimensoes }: ZPLPreviewProps) {
  const zplRender = useMemo(() => {
    if (!variaveis) return zpl;
    const hoje = new Date().toLocaleDateString('pt-BR');
    return zpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => (k === 'hoje' ? hoje : variaveis[k] ?? ''));
  }, [zpl, variaveis]);

  const elementos = useMemo(() => parseZpl(zplRender), [zplRender]);
  const larguraMm = dimensoes?.largura ?? 100;
  const alturaMm = dimensoes?.altura ?? 150;
  const viewW = larguraMm * 8; // dots
  const viewH = alturaMm * 8;

  return (
    <div className={cn('bg-white text-black relative w-full h-full overflow-hidden', className)}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <rect x={0} y={0} width={viewW} height={viewH} fill="#fff" />
        {elementos.map((el, i) => {
          if (el.tipo === 'text') {
            return (
              <text key={i} x={el.x} y={el.y + el.size} fontSize={el.size} fontFamily="monospace" fill="#111">
                {el.text}
              </text>
            );
          }
          if (el.tipo === 'barcode') {
            return (
              <g key={i}>
                {Array.from({ length: 40 }).map((_, b) => (
                  <rect key={b} x={el.x + b * 6} y={el.y} width={b % 3 === 0 ? 4 : 2} height={80} fill="#111" />
                ))}
                <text x={el.x} y={el.y + 100} fontSize={18} fontFamily="monospace" fill="#111">
                  {el.text}
                </text>
              </g>
            );
          }
          if (el.tipo === 'qr') {
            return (
              <g key={i}>
                <rect x={el.x} y={el.y} width={120} height={120} fill="#111" />
                <rect x={el.x + 12} y={el.y + 12} width={96} height={96} fill="#fff" />
                <rect x={el.x + 30} y={el.y + 30} width={60} height={60} fill="#111" />
              </g>
            );
          }
          if (el.tipo === 'box') {
            return <rect key={i} x={el.x} y={el.y} width={el.width ?? 0} height={el.height ?? 0} fill="none" stroke="#111" strokeWidth={2} />;
          }
          return null;
        })}
      </svg>
    </div>
  );
});
ZPLPreview.displayName = 'ZPLPreview';

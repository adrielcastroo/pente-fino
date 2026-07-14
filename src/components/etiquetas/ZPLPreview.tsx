/**
 * ZPLPreview — renderização visual aproximada do ZPL (SVG).
 * Suporta: ^FO x,y ^A0N,h,w ^FD texto ^FS ; ^BCN barcode ; ^BQN qr ; ^GB box.
 * QR renderizado via qrcode.react. Logo (fd = {{logo}}) renderizado como imagem.
 */
import { memo, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface Elemento {
  tipo: 'text' | 'barcode' | 'qr' | 'box' | 'logo';
  x: number;
  y: number;
  size: number;
  text: string;
  width?: number;
  height?: number;
  qrMag?: number;
}

function parseZpl(zpl: string, rawFd: (fd: string) => string): Elemento[] {
  const out: Elemento[] = [];
  const blocos = zpl.split('^FS');
  for (const bloco of blocos) {
    const fo = bloco.match(/\^FO(\d+),(\d+)/);
    if (!fo) continue;
    const x = parseInt(fo[1], 10);
    const y = parseInt(fo[2], 10);
    const fd = bloco.match(/\^FD([^^]+)/);
    const rawText = fd ? fd[1] : '';
    const text = rawFd(rawText);
    if (/\^BC/.test(bloco)) {
      out.push({ tipo: 'barcode', x, y, size: 100, text });
    } else if (/\^BQ/.test(bloco)) {
      const bq = bloco.match(/\^BQN,\d+,(\d+)/);
      const mag = bq ? parseInt(bq[1], 10) : 4;
      out.push({ tipo: 'qr', x, y, size: 100, text, qrMag: mag });
    } else if (/\^GB/.test(bloco)) {
      const gb = bloco.match(/\^GB(\d+),(\d+),(\d+)/);
      if (gb) out.push({ tipo: 'box', x, y, size: 0, text: '', width: parseInt(gb[1], 10), height: parseInt(gb[2], 10) });
    } else if (/\{\{\s*logo\s*\}\}/i.test(rawText)) {
      const a0 = bloco.match(/\^A0N,(\d+),(\d+)/);
      const size = a0 ? parseInt(a0[1], 10) : 36;
      out.push({ tipo: 'logo', x, y, size, text: '' });
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
  logoUrl?: string;
}

export const ZPLPreview = memo(function ZPLPreview({ zpl, variaveis, className, dimensoes, logoUrl }: ZPLPreviewProps) {
  const elementos = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const interp = (s: string) =>
      s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => (k === 'hoje' || k === 'data' ? hoje : (variaveis?.[k] ?? '')));
    return parseZpl(zpl, interp);
  }, [zpl, variaveis]);

  const larguraMm = dimensoes?.largura ?? 100;
  const alturaMm = dimensoes?.altura ?? 150;
  const viewW = larguraMm * 8;
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
          if (el.tipo === 'logo') {
            const h = el.size * 1.6;
            const w = h * 2.5;
            return logoUrl ? (
              <image key={i} href={logoUrl} x={el.x} y={el.y} height={h} preserveAspectRatio="xMidYMid meet" />
            ) : (
              <g key={i}>
                <rect x={el.x} y={el.y} width={w} height={h} fill="#f3f4f6" stroke="#d1d5db" strokeDasharray="4 3" />
                <text x={el.x + w / 2} y={el.y + h / 2 + 4} fontSize={12} fontFamily="monospace" fill="#6b7280" textAnchor="middle">LOGO</text>
              </g>
            );
          }
          if (el.tipo === 'barcode') {
            return (
              <g key={i}>
                {Array.from({ length: 40 }).map((_, b) => (
                  <rect key={b} x={el.x + b * 6} y={el.y} width={b % 3 === 0 ? 4 : 2} height={80} fill="#111" />
                ))}
                <text x={el.x} y={el.y + 100} fontSize={18} fontFamily="monospace" fill="#111">{el.text}</text>
              </g>
            );
          }
          if (el.tipo === 'qr') {
            const side = Math.max(60, (el.qrMag ?? 4) * 32);
            const payload = (el.text || 'QR').replace(/^LA,/, '');
            return (
              <foreignObject key={i} x={el.x} y={el.y} width={side} height={side}>
                <div style={{ width: side, height: side, background: '#fff' }}>
                  <QRCodeSVG value={payload} size={side} level="M" includeMargin={false} />
                </div>
              </foreignObject>
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

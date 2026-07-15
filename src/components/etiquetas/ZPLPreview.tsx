/**
 * ZPLPreview — renderização visual fiel ao que será impresso fisicamente.
 * Usa as dimensões físicas em DOTS declaradas no próprio ZPL (^PW / ^LL).
 * Suporta: ^FO x,y | ^A0N,h,w | ^FD texto | ^FS | ^BCN | ^BQN | ^GB |
 *          ^FB w,lines,spacing,align com quebra de linha via "\&".
 * QR renderizado via qrcode.react. Logo (fd = {{logo}}) renderizado como imagem.
 */
import { memo, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface FbConfig {
  width: number;
  maxLines: number;
  spacing: number;
  align: 'L' | 'C' | 'R' | 'J';
}

interface Elemento {
  tipo: 'text' | 'barcode' | 'qr' | 'box' | 'logo';
  x: number;
  y: number;
  size: number;
  text: string;
  lines?: string[];
  fb?: FbConfig;
  width?: number;
  height?: number;
  qrMag?: number;
}

function parseZpl(zpl: string, rawFd: (fd: string) => string): { elementos: Elemento[]; pw: number; ll: number } {
  const pwMatch = zpl.match(/\^PW(\d+)/);
  const llMatch = zpl.match(/\^LL(\d+)/);
  const pw = pwMatch ? parseInt(pwMatch[1], 10) : 480;
  const ll = llMatch ? parseInt(llMatch[1], 10) : 400;

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
      continue;
    }
    if (/\^BQ/.test(bloco)) {
      const bq = bloco.match(/\^BQN,\d+,(\d+)/);
      const mag = bq ? parseInt(bq[1], 10) : 4;
      out.push({ tipo: 'qr', x, y, size: 100, text, qrMag: mag });
      continue;
    }
    if (/\^GB/.test(bloco)) {
      const gb = bloco.match(/\^GB(\d+),(\d+),(\d+)/);
      if (gb) out.push({ tipo: 'box', x, y, size: 0, text: '', width: parseInt(gb[1], 10), height: parseInt(gb[2], 10) });
      continue;
    }

    // Logo (variável {{logo}})
    if (/\{\{\s*logo\s*\}\}/i.test(rawText)) {
      const a0 = bloco.match(/\^A0N,(\d+),(\d+)/);
      const size = a0 ? parseInt(a0[1], 10) : 36;
      out.push({ tipo: 'logo', x, y, size, text: '' });
      continue;
    }

    // Texto — respeita ^FB (largura, nº de linhas, espaçamento, alinhamento) e quebras "\&".
    const a0 = bloco.match(/\^A0N,(\d+),(\d+)/);
    const size = a0 ? parseInt(a0[1], 10) : 24;
    const fbMatch = bloco.match(/\^FB(\d+),(\d+),(-?\d+),([LCRJ])/);
    let fb: FbConfig | undefined;
    if (fbMatch) {
      fb = {
        width: parseInt(fbMatch[1], 10),
        maxLines: parseInt(fbMatch[2], 10),
        spacing: parseInt(fbMatch[3], 10),
        align: fbMatch[4] as FbConfig['align'],
      };
    }

    if (!text) continue;

    // Quebras de linha explícitas ZPL: "\&"
    let lines = text.split(/\\&/g).map((s) => s.trim());

    // Word-wrap simples respeitando fb.width (aprox: char ~ size*0.55)
    if (fb) {
      const charW = size * 0.55;
      const maxChars = Math.max(1, Math.floor(fb.width / charW));
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
      lines = wrapped.slice(0, fb.maxLines);
    }

    out.push({ tipo: 'text', x, y, size, text, lines, fb });
  }
  return { elementos: out, pw, ll };
}

interface ZPLPreviewProps {
  zpl: string;
  variaveis?: Record<string, string>;
  className?: string;
  /** largura/altura em mm da etiqueta (usado como fallback quando o ZPL não define ^PW/^LL). */
  dimensoes?: { largura: number; altura: number };
  logoUrl?: string;
}

export const ZPLPreview = memo(function ZPLPreview({ zpl, variaveis, className, dimensoes, logoUrl }: ZPLPreviewProps) {
  const parsed = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const resolveVar = (key: string): string => {
      if (key === 'hoje' || key === 'data') return hoje;
      const direct = variaveis?.[key];
      if (direct !== undefined) return direct;
      const matchedKey = Object.keys(variaveis ?? {}).find((k) => k.toLowerCase() === key.toLowerCase());
      return matchedKey ? (variaveis?.[matchedKey] ?? '') : '';
    };
    const interp = (s: string) =>
      s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => resolveVar(k));
    return parseZpl(zpl, interp);
  }, [zpl, variaveis]);

  // Preferir dimensões físicas declaradas no ZPL (em dots @ 203dpi).
  const viewW = parsed.pw || (dimensoes?.largura ?? 100) * 8;
  const viewH = parsed.ll || (dimensoes?.altura ?? 150) * 8;

  return (
    <div className={cn('bg-white text-black relative w-full h-full overflow-hidden', className)}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <rect x={0} y={0} width={viewW} height={viewH} fill="#fff" />
        {parsed.elementos.map((el, i) => {
          if (el.tipo === 'text') {
            const lines = el.lines && el.lines.length > 0 ? el.lines : [el.text];
            const lineH = el.size + (el.fb?.spacing ?? 0);
            const align = el.fb?.align ?? 'L';
            let anchorX = el.x;
            let textAnchor: 'start' | 'middle' | 'end' = 'start';
            if (el.fb) {
              if (align === 'C') { anchorX = el.x + el.fb.width / 2; textAnchor = 'middle'; }
              else if (align === 'R') { anchorX = el.x + el.fb.width; textAnchor = 'end'; }
            }
            return (
              <g key={i}>
                {lines.map((ln, k) => (
                  <text
                    key={k}
                    x={anchorX}
                    y={el.y + el.size + k * lineH}
                    fontSize={el.size}
                    fontFamily="monospace"
                    fill="#111"
                    textAnchor={textAnchor}
                  >
                    {ln}
                  </text>
                ))}
              </g>
            );
          }
          if (el.tipo === 'logo') {
            const h = el.size * 1.6;
            const w = h * 2.5;
            return logoUrl ? (
              <image key={i} href={logoUrl} x={el.x} y={el.y} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
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
            const side = Math.max(60, (el.qrMag ?? 4) * 24);
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
            const w = el.width ?? 0;
            const h = el.height ?? 0;
            // Linhas finas (w=1 ou h=1) desenhadas como retângulo sólido preto.
            const isLine = w <= 2 || h <= 2;
            return (
              <rect
                key={i}
                x={el.x}
                y={el.y}
                width={Math.max(1, w)}
                height={Math.max(1, h)}
                fill={isLine ? '#111' : 'none'}
                stroke={isLine ? 'none' : '#111'}
                strokeWidth={2}
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
});
ZPLPreview.displayName = 'ZPLPreview';

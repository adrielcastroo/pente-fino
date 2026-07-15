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
import { LABEL_PX_PER_MM } from '@/components/labels/LabelTemplates';

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
  reverse?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
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

    const reverse = /\^FR(?![A-Z])/.test(bloco);

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

    out.push({ tipo: 'text', x, y, size, text, lines, fb, reverse });
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
  /** Espessura das linhas/caixas (stroke) desenhadas via ^GB. Default 2. */
  lineThickness?: number;
  /** Estilo das linhas. Default 'solid'. */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Cor das linhas e preenchimento. Default '#111'. */
  lineColor?: string;
  /** Família de fonte aplicada aos textos SVG. Default 'monospace'. */
  fontFamily?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderRadius?: number;
  padding?: number;
  offsetX?: number;
  offsetY?: number;
}

export const ZPLPreview = memo(function ZPLPreview({
  zpl, variaveis, className, dimensoes, logoUrl,
  lineThickness = 2,
  lineStyle = 'solid',
  lineColor = '#111',
  fontFamily = 'monospace',
  borderWidth = 0,
  borderStyle = 'none',
  borderRadius = 0,
  padding = 0,
  offsetX = 0,
  offsetY = 0,
}: ZPLPreviewProps) {
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
      s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => resolveVar(k));
    return parseZpl(zpl, interp);
  }, [zpl, variaveis]);

  // Sistema lógico de coordenadas: usa ^PW/^LL do ZPL quando existirem.
  // O SVG é esticado para o tamanho físico da etiqueta pelo container externo,
  // exatamente como o PNG final é impresso em @page mm. Isso evita letterbox e
  // faz linhas em x=0/width=^PW tangenciarem a borda física.
  const viewW = parsed.pw || (dimensoes?.largura ?? 100) * LABEL_PX_PER_MM;
  const viewH = parsed.ll || (dimensoes?.altura ?? 150) * LABEL_PX_PER_MM;
  const clipId = useMemo(() => `zpl-clip-${Math.random().toString(36).slice(2, 9)}`, []);
  const contentClipId = useMemo(() => `zpl-content-clip-${Math.random().toString(36).slice(2, 9)}`, []);
  const effectiveBorderWidth = borderStyle === 'none' ? 0 : Math.max(0, borderWidth);
  const contentX = padding + offsetX;
  const contentY = padding + offsetY;
  const contentW = Math.max(1, viewW - padding * 2);
  const contentH = Math.max(1, viewH - padding * 2);
  const borderDashArray =
    borderStyle === 'dashed' ? `${Math.max(4, effectiveBorderWidth * 3)} ${Math.max(3, effectiveBorderWidth * 2)}`
    : borderStyle === 'dotted' ? `${Math.max(1, effectiveBorderWidth)} ${Math.max(2, effectiveBorderWidth * 1.5)}`
    : undefined;

  const renderBorder = () => {
    if (effectiveBorderWidth <= 0) return null;
    const inset = effectiveBorderWidth / 2;
    const rectProps = {
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
    if (borderStyle !== 'double') return <rect {...rectProps} />;
    const gap = Math.max(2, effectiveBorderWidth * 1.5);
    return (
      <>
        <rect {...rectProps} strokeWidth={Math.max(1, effectiveBorderWidth * 0.55)} />
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
        />
      </>
    );
  };

  return (
    <div className={cn('bg-white text-black relative w-full h-full overflow-hidden', className)}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="none" className="block w-full h-full">
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={viewW} height={viewH} />
          </clipPath>
          <clipPath id={contentClipId}>
            <rect x={0} y={0} width={contentW} height={contentH} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={viewW} height={viewH} fill="#fff" />
        <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${contentX}, ${contentY})`} clipPath={`url(#${contentClipId})`}>
        {parsed.elementos.map((el, i) => {
          if (el.tipo === 'text') {
            const lines = el.lines && el.lines.length > 0 ? el.lines : [el.text];
            const lineH = el.size + (el.fb?.spacing ?? 0);
            const align = el.fb?.align ?? 'L';
            const fb = el.fb;
            let anchorX = el.x;
            let textAnchor: 'start' | 'middle' | 'end' = 'start';
            if (fb) {
              if (align === 'C') { anchorX = el.x + fb.width / 2; textAnchor = 'middle'; }
              else if (align === 'R') { anchorX = el.x + fb.width; textAnchor = 'end'; }
            }
            const fillColor = el.reverse ? '#fff' : lineColor;
            let bgRect: JSX.Element | null = null;
            if (el.reverse) {
              const padX = Math.max(2, el.size * 0.15);
              const padY = Math.max(1, el.size * 0.1);
              const totalH = lines.length * lineH + padY * 2;
              if (fb) {
                bgRect = <rect x={el.x - padX} y={el.y - padY} width={fb.width + padX * 2} height={totalH} fill={lineColor} />;
              } else {
                const charW = el.size * 0.6;
                const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
                const w = longest * charW + padX * 2;
                bgRect = <rect x={el.x - padX} y={el.y - padY} width={w} height={totalH} fill={lineColor} />;
              }
            }
            return (
              <g key={i}>
                {bgRect}
                {lines.map((ln, k) => (
                  <text
                    key={k}
                    x={anchorX}
                    y={el.y + el.size * 0.85 + k * lineH}
                    fontSize={el.size}
                    fontFamily={fontFamily}
                    fill={fillColor}
                    textAnchor={textAnchor}
                  >
                    {ln}
                  </text>
                ))}
              </g>
            );
          }
          if (el.tipo === 'logo') {
            // Aspect padrão 2.5:1. Se extrapolar, o clipPath corta como a área imprimível real.
            const desiredH = el.size * 1.6;
            const w = desiredH * 2.5;
            const h = desiredH;
            return logoUrl ? (
              <image key={i} href={logoUrl} x={el.x} y={el.y} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
            ) : (
              <g key={i}>
                <rect x={el.x} y={el.y} width={w} height={h} fill="#f3f4f6" stroke="#d1d5db" strokeDasharray="4 3" />
                <text x={el.x + w / 2} y={el.y + h / 2 + 4} fontSize={12} fontFamily={fontFamily} fill="#6b7280" textAnchor="middle">LOGO</text>
              </g>
            );
          }
          if (el.tipo === 'barcode') {
            return (
              <g key={i}>
                {Array.from({ length: 40 }).map((_, b) => (
                  <rect key={b} x={el.x + b * 6} y={el.y} width={b % 3 === 0 ? 4 : 2} height={80} fill={lineColor} />
                ))}
                <text x={el.x} y={el.y + 100} fontSize={18} fontFamily={fontFamily} fill={lineColor}>{el.text}</text>
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
            const w = el.width ?? 0;
            const h = el.height ?? 0;
            const isHorizontalLine = h <= 2 && w > h;
            const isVerticalLine = w <= 2 && h >= w;
            const isLine = isHorizontalLine || isVerticalLine;
            const effectiveLineThickness = lineThickness > 0 ? Math.max(1, lineThickness) : 0;
            const renderedW = isVerticalLine && effectiveLineThickness > 0 ? effectiveLineThickness : Math.max(1, w);
            const renderedH = isHorizontalLine && effectiveLineThickness > 0 ? effectiveLineThickness : Math.max(1, h);
            const dashArray =
              lineStyle === 'dashed' ? `${Math.max(4, lineThickness * 3)} ${Math.max(3, lineThickness * 2)}`
              : lineStyle === 'dotted' ? `${lineThickness} ${Math.max(2, lineThickness * 1.5)}`
              : undefined;
            return (
              <rect
                key={i}
                x={el.x}
                y={el.y}
                width={renderedW}
                height={renderedH}
                fill={isLine ? lineColor : 'none'}
                stroke={isLine || effectiveLineThickness <= 0 ? 'none' : lineColor}
                strokeWidth={effectiveLineThickness}
                strokeDasharray={dashArray}
              />
            );
          }
          return null;
        })}
        </g>
        {renderBorder()}
        </g>
      </svg>
    </div>
  );
});
ZPLPreview.displayName = 'ZPLPreview';

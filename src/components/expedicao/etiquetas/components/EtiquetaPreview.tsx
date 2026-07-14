// ============================================================================
// EtiquetaPreview — preview fiel usando o mesmo engine que a impressão.
// Suporta modo "browser" (LabelSheet HTML/CSS) e "zpl" (raw ZPL preview).
// ============================================================================
import { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { interpolate } from '../utils/etiquetaInterpolation';
import { validatePayload } from '../utils/etiquetaValidation';
import { templateToZpl } from '../utils/etiquetaZpl';
import type { Template, Vars } from '../types/etiqueta';

interface Props {
  template: Template;
  vars: Vars;
  mode?: 'browser' | 'zpl';
  className?: string;
}

const MM_TO_PX = 3.7795;

export function EtiquetaPreview({ template, vars, mode = 'browser', className }: Props) {
  const validation = useMemo(() => validatePayload(template), [template]);
  const t = template;

  if (mode === 'zpl') {
    const zpl = useMemo(() => templateToZpl(t, vars), [t, vars]);
    return (
      <div className={cn('flex flex-col items-center gap-3 w-full h-full overflow-auto p-4 bg-muted/30', className)}>
        <Badge variant="outline" className="font-mono text-[10px]">
          ZPL · {t.widthMm}×{t.heightMm}mm · 203 dpi
        </Badge>
        <pre className="font-mono text-xs bg-card border border-border rounded-md p-3 w-full max-w-full overflow-auto whitespace-pre-wrap break-all">
          {zpl}
        </pre>
      </div>
    );
  }

  const copies = Array.from({ length: Math.max(1, t.copies || 1) });

  return (
    <div className={cn('exp-preview-box flex flex-col items-center justify-start gap-4 p-4 sm:p-6 w-full h-full overflow-auto bg-[var(--preview-bg,#fafafa)]', className)}>
      {!validation.ok && (
        <div className="print:hidden flex items-center gap-2 text-xs text-warning-foreground bg-warning/10 border border-warning/40 rounded-md px-3 py-2">
          <AlertTriangle className="size-4 text-warning" />
          <span>Payload inválido: {validation.msg}</span>
        </div>
      )}
      <div className="exp-preview-stack flex flex-col gap-3 print:gap-0">
        {copies.map((_, i) => (
          <LabelSheet key={i} template={t} vars={vars} />
        ))}
      </div>
      <PrintStyles widthMm={t.widthMm} heightMm={t.heightMm} customCss={t.customCss} />
    </div>
  );
}

function LabelSheet({ template: t, vars }: { template: Template; vars: Vars }) {
  const titulo = interpolate(t.titulo, vars);
  const subtitulo = interpolate(t.subtitulo, vars);
  const codigo = interpolate(t.codigo, vars);
  const destino = interpolate(t.destino, vars);
  const observacoes = interpolate(t.observacoes, vars);
  const payload = interpolate(t.payload || t.codigo, vars);

  const style: React.CSSProperties = {
    width: `${t.widthMm * MM_TO_PX}px`,
    height: `${t.heightMm * MM_TO_PX}px`,
    padding: `${t.padding}mm`,
    border: t.borderStyle === 'none' ? 'none' : `1px ${t.borderStyle} #000`,
    background: '#fff',
    color: '#000',
    textAlign: t.align,
    fontFamily: 'system-ui, sans-serif',
  };

  if (t.bartenderEnabled && t.bartenderImageSrc) {
    return (
      <div className="label-sheet rounded-md border border-border/60 shadow-sm bg-white overflow-hidden" style={style}>
        <img src={t.bartenderImageSrc} alt="BarTender" className="w-full h-full object-contain" />
      </div>
    );
  }

  return (
    <div className="label-sheet rounded-md border border-border/60 shadow-sm bg-white overflow-hidden flex flex-col gap-1" style={style}>
      {titulo && <div className="font-bold leading-tight" style={{ fontSize: `${t.titleSize}pt` }}>{titulo}</div>}
      {subtitulo && <div className="opacity-80 leading-tight" style={{ fontSize: `${Math.max(9, t.titleSize - 8)}pt` }}>{subtitulo}</div>}
      {codigo && <div className="font-mono leading-tight" style={{ fontSize: `${t.codeSize}pt` }}>{codigo}</div>}

      {(t.showBarcode || t.showQr) && payload && (
        <div className="flex items-center justify-center gap-3 py-2 flex-1 min-h-0">
          {t.showBarcode && <BarcodeBlock value={payload} fmt={t.barcodeFmt} />}
          {t.showQr && <QRCodeCanvas value={payload} size={Math.min(120, t.widthMm * 1.6)} />}
        </div>
      )}

      {destino && <div className="text-left leading-snug" style={{ fontSize: `${Math.max(8, t.titleSize - 12)}pt` }}>Destino: {destino}</div>}
      {observacoes && <div className="text-left leading-snug opacity-80" style={{ fontSize: `${Math.max(7, t.titleSize - 14)}pt` }}>{observacoes}</div>}
      {t.customFields.map((f, i) => f.value ? (
        <div key={i} className="text-left leading-snug" style={{ fontSize: `${Math.max(8, t.titleSize - 12)}pt` }}>
          <b>{f.label}:</b> {interpolate(f.value, vars)}
        </div>
      ) : null)}
    </div>
  );
}

function BarcodeBlock({ value, fmt }: { value: string; fmt: Template['barcodeFmt'] }) {
  // Render simplificado (canvas via jsbarcode em runtime seria ideal; usamos SVG fake para preview leve).
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex gap-[1px] h-16 items-end">
        {value.slice(0, 30).split('').map((ch, i) => (
          <div key={i} className="bg-black" style={{ width: (ch.charCodeAt(0) % 3) + 1, height: '100%' }} />
        ))}
      </div>
      <div className="font-mono text-[8pt]">{fmt} · {value}</div>
    </div>
  );
}

function PrintStyles({ widthMm, heightMm, customCss }: { widthMm: number; heightMm: number; customCss?: string }) {
  return (
    <style>{`
      @media print {
        @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
        body * { visibility: hidden !important; }
        .label-sheet, .label-sheet * { visibility: visible !important; }
        .exp-preview-box { padding: 0 !important; background: none !important; }
        .exp-preview-stack { transform: none !important; gap: 0 !important; display: block !important; }
        .label-sheet {
          position: relative; page-break-after: always;
          border: 0 !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important;
        }
        .label-sheet:last-child { page-break-after: auto; }
        ${customCss ?? ''}
      }
    `}</style>
  );
}

export default EtiquetaPreview;

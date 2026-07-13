// ============================================================================
// Etiquetas de Expedição — versão simplificada.
// Fluxo essencial: importar XML da NF-e → preview visual → imprimir (browser/ZPL).
// Sem múltiplos templates, sem editor livre, sem BarTender, sem presets.
// ============================================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Printer, Tag, FileText, Usb, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  generateZpl, sendZplViaUsb, sendZplViaSerial,
  isWebUsbSupported, isWebSerialSupported,
  type BarcodeFmt,
} from './etiqueta-helpers';
import EtiquetaXmlDialog, { type LabelSizeKey } from './EtiquetaXmlDialog';
import type { EtiquetaXmlPatch } from './etiqueta-xml';

// ============================================================================
// Model — apenas os campos usados pela etiqueta simplificada.
// ============================================================================

type PageSize = '100x150' | '100x100' | '100x50';

interface LabelData {
  titulo: string;
  subtitulo: string;
  codigo: string;
  destino: string;
  transportadora: string;
  nfNumero: string;
  volumeAtual: string;
  volumeTotal: string;
  codePayload: string;
  showQr: boolean;
  showBarcode: boolean;
  barcodeFmt: BarcodeFmt;
  pageSize: PageSize;
  copias: number;
}

const PAGE_DIMS: Record<PageSize, { w: number; h: number; label: string }> = {
  '100x150': { w: 100, h: 150, label: '100 × 150 mm (padrão)' },
  '100x100': { w: 100, h: 100, label: '100 × 100 mm (quadrada)' },
  '100x50':  { w: 100, h: 50,  label: '100 × 50 mm (compacta)' },
};

const STORAGE_KEY = 'exp_label_simple_v1';

const DEFAULT_DATA: LabelData = {
  titulo: 'EXPEDIÇÃO',
  subtitulo: '',
  codigo: '',
  destino: '',
  transportadora: '',
  nfNumero: '',
  volumeAtual: '1',
  volumeTotal: '1',
  codePayload: '',
  showQr: true,
  showBarcode: false,
  barcodeFmt: 'CODE128',
  pageSize: '100x150',
  copias: 1,
};

function loadData(): LabelData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
  } catch { return { ...DEFAULT_DATA }; }
}

// ============================================================================
// Page
// ============================================================================

export default function ExpedicaoEtiquetasPage() {
  useDocumentTitle('Etiquetas · Expedição');

  const [data, setData] = useState<LabelData>(() => loadData());
  const [xmlOpen, setXmlOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), 250);
    return () => clearTimeout(id);
  }, [data]);

  function patch(p: Partial<LabelData>) {
    setData((d) => ({ ...d, ...p }));
  }

  function applyXmlPatch(input: EtiquetaXmlPatch & { pageSize: LabelSizeKey; copies: number }) {
    patch({
      titulo: input.titulo,
      subtitulo: input.subtitulo,
      codigo: input.codigo,
      destino: input.destino,
      transportadora: input.transportadora,
      nfNumero: input.nfNumero,
      volumeAtual: input.volumeAtual,
      volumeTotal: input.volumeTotal,
      codePayload: input.codePayload,
      showBarcode: input.showBarcode,
      showQr: input.showQr,
      barcodeFmt: input.barcodeFmt,
      pageSize: input.pageSize,
      copias: Math.max(1, input.copies),
    });
    toast.success('Etiqueta gerada a partir do XML.');
  }

  function reset() {
    setData({ ...DEFAULT_DATA });
    toast.success('Etiqueta reiniciada.');
  }

  function handleBrowserPrint() {
    if (!data.titulo.trim() && !data.codigo.trim() && !data.nfNumero.trim()) {
      return toast.error('Importe um XML ou preencha os campos antes de imprimir.');
    }
    window.print();
  }

  async function handleZplPrint(transport: 'usb' | 'serial') {
    const dims = PAGE_DIMS[data.pageSize];
    const payload = (data.codePayload || data.codigo || data.nfNumero || data.titulo || '').slice(0, 700);
    const zpl = generateZpl({
      widthMm: dims.w, heightMm: dims.h,
      titulo: data.titulo, subtitulo: data.subtitulo,
      codigo: data.codigo, destino: data.destino,
      observacoes: '',
      customFields: [],
      showQr: data.showQr, showBarcode: data.showBarcode,
      barcodeFmt: data.barcodeFmt,
      payload, copies: data.copias,
    });
    const result = transport === 'usb' ? await sendZplViaUsb(zpl) : await sendZplViaSerial(zpl);
    if (result.ok === true) {
      toast.success(`Enviado para impressora via ${transport.toUpperCase()}`);
      return;
    }
    toast.error(result.error);
  }

  const dims = PAGE_DIMS[data.pageSize];
  const usbOk = isWebUsbSupported();
  const serialOk = isWebSerialSupported();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
            <Tag className="size-5 text-primary" /> Etiquetas de Expedição
            <Badge variant="secondary" className="font-mono text-[11px]">
              {dims.w}×{dims.h} mm
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            Importe o XML da NF-e para gerar a etiqueta automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" className="gap-1.5" onClick={() => setXmlOpen(true)}>
            <FileText className="size-4" /> Do XML
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reset} title="Limpar etiqueta">
            <RotateCcw className="size-4" />
          </Button>
          {(usbOk || serialOk) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => handleZplPrint(usbOk ? 'usb' : 'serial')}
              title={usbOk ? 'Envia ZPL via WebUSB' : 'Envia ZPL via Web Serial'}
            >
              <Usb className="size-4" /> ZPL
            </Button>
          )}
          <Button onClick={handleBrowserPrint} size="sm" className="gap-1.5">
            <Printer className="size-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-6 print:block min-w-0">
        {/* Controles mínimos */}
        <Card className="print:hidden">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tamanho</Label>
              <Select value={data.pageSize} onValueChange={(v) => patch({ pageSize: v as PageSize })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PAGE_DIMS) as [PageSize, typeof PAGE_DIMS[PageSize]][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Cópias</Label>
                <span className="text-xs font-mono">{data.copias}</span>
              </div>
              <Slider
                value={[data.copias]}
                min={1} max={50} step={1}
                onValueChange={(v) => patch({ copias: v[0] })}
              />
            </div>

            {/* Resumo da etiqueta atual */}
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px]">Transportadora</span>
                <span className="font-semibold text-right truncate">{data.transportadora || '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px]">NF-e</span>
                <span className="font-mono text-right truncate">{data.nfNumero || '—'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px]">Volume</span>
                <span className="font-mono text-right">{data.volumeAtual || '?'} / {data.volumeTotal || '?'}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px]">Destino</span>
                <span className="font-semibold text-right truncate max-w-[180px]">{data.destino || '—'}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Use o botão <strong>Do XML</strong> para preencher automaticamente a partir de uma NF-e importada
              ou de um arquivo XML avulso.
            </p>
          </CardContent>
        </Card>

        {/* Preview */}
        <PreviewWorkbench dims={dims} copias={data.copias}>
          {Array.from({ length: data.copias }).map((_, i) => (
            <LabelSheet key={i} data={data} />
          ))}
        </PreviewWorkbench>
      </div>

      <EtiquetaXmlDialog open={xmlOpen} onOpenChange={setXmlOpen} onApply={applyXmlPatch} />
      <PrintStyles wMm={dims.w} hMm={dims.h} />
    </div>
  );
}

// ============================================================================
// Preview workbench (mesmo padrão do módulo Estoque)
// ============================================================================
const MM_TO_PX = 3.7795;

function PreviewWorkbench({
  dims, copias, children,
}: { dims: { w: number; h: number }; copias: number; children: React.ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  const gapPx = 16;
  const naturalW = dims.w * MM_TO_PX;
  const naturalH = dims.h * MM_TO_PX * Math.max(1, copias) + gapPx * Math.max(0, copias - 1);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const recalc = () => {
      const pad = 48;
      const availW = Math.max(0, el.clientWidth - pad);
      const availH = Math.max(0, el.clientHeight - pad);
      if (availW <= 0 || availH <= 0) return;
      const next = Math.min(availW / naturalW, availH / naturalH, 1.2);
      setFit(next > 0 ? next : 1);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    window.addEventListener('resize', recalc);
    return () => { ro.disconnect(); window.removeEventListener('resize', recalc); };
  }, [naturalW, naturalH]);

  return (
    <div className="space-y-3 exp-preview-workbench">
      <div className="flex items-baseline justify-between shrink-0 print:hidden">
        <Label className="text-xs font-semibold uppercase tracking-widest opacity-60">
          Pré-visualização · Expedição
        </Label>
        <span className="text-[10px] font-mono opacity-60">
          {dims.w}×{dims.h}mm · zoom {Math.round(fit * 100)}% · {copias} cópia(s)
        </span>
      </div>
      <div
        ref={boxRef}
        className="exp-preview-box relative flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-border/50 min-h-[380px] lg:min-h-[560px] overflow-hidden shadow-inner"
        style={{
          backgroundColor: 'hsl(var(--muted) / 0.55)',
          backgroundImage:
            'linear-gradient(45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }}
      >
        <div
          className="exp-preview-stack"
          style={{
            transform: `scale(${fit})`,
            transformOrigin: 'center center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: `${gapPx}px`,
          }}
        >
          {children}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/40 text-[9px] font-mono opacity-80 print:hidden">
          <span className="inline-block w-3 h-[2px] bg-foreground/70" />
          {Math.round(10 * MM_TO_PX * fit)}px ≈ 10mm
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Label sheet (render físico da etiqueta)
// ============================================================================

function LabelSheet({ data }: { data: LabelData }) {
  const dims = PAGE_DIMS[data.pageSize];
  const codeValue = (data.codePayload || data.codigo || data.nfNumero || data.titulo || '').slice(0, 700);
  const titleSize = 12;

  return (
    <div
      className="label-sheet bg-white text-black border border-border rounded-md mx-auto mb-4 overflow-hidden"
      style={{ width: `${dims.w}mm`, height: `${dims.h}mm`, padding: '4mm' }}
    >
      <div className="h-full w-full flex flex-col text-center" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div className="border-b-2 border-black pb-1.5">
          <p className="font-bold uppercase tracking-widest leading-tight" style={{ fontSize: `${titleSize}pt` }}>
            {data.titulo || 'EXPEDIÇÃO'}
          </p>
          {data.subtitulo && (
            <p style={{ fontSize: `${Math.max(7, titleSize - 4)}pt` }} className="mt-0.5">
              {data.subtitulo}
            </p>
          )}
        </div>

        {/* Carga: transportadora, NF-e, volumes */}
        {(data.transportadora || data.nfNumero || data.volumeAtual || data.volumeTotal) && (
          <div className="border-b-2 border-black py-2 flex flex-col items-center gap-1">
            {data.transportadora && (
              <p className="font-extrabold uppercase leading-tight break-words"
                style={{ fontSize: `${titleSize + 4}pt` }}>
                {data.transportadora}
              </p>
            )}
            {data.nfNumero && (
              <p className="font-bold leading-tight" style={{ fontSize: `${titleSize + 2}pt` }}>
                NF <span className="font-mono">{data.nfNumero}</span>
              </p>
            )}
            {(data.volumeAtual || data.volumeTotal) && (
              <div className="mt-1 inline-flex items-baseline gap-1 border-2 border-black rounded px-3 py-1">
                <span className="text-[8pt] uppercase tracking-wider font-semibold">Vol.</span>
                <span className="font-mono font-extrabold leading-none" style={{ fontSize: `${titleSize + 10}pt` }}>
                  {data.volumeAtual || '?'}
                </span>
                <span className="font-mono font-bold" style={{ fontSize: `${titleSize + 4}pt` }}>/</span>
                <span className="font-mono font-extrabold leading-none" style={{ fontSize: `${titleSize + 10}pt` }}>
                  {data.volumeTotal || '?'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Código + QR/Barcode */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-2">
          {data.codigo && (
            <p className="font-mono font-extrabold leading-none break-all"
              style={{ fontSize: `${data.codigo.length > 14 ? 20 : 26}pt` }}>
              {data.codigo}
            </p>
          )}
          {data.showQr && codeValue && (
            <QRCodeCanvas value={codeValue} size={160} level="M" includeMargin={false} />
          )}
          {data.showBarcode && codeValue && (
            <Barcode value={codeValue} format={data.barcodeFmt} width={240} />
          )}
        </div>

        {/* Destino */}
        {data.destino && (
          <div className="border-t border-black pt-1.5 mt-1 text-left">
            <p className="text-[7pt] uppercase tracking-wider text-black/60">Destino</p>
            <p style={{ fontSize: `${Math.max(8, titleSize - 2)}pt` }} className="font-semibold leading-tight">
              {data.destino}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Barcode({ value, format, width }: { value: string; format: BarcodeFmt; width: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format, displayValue: true, fontSize: 12, height: 60,
        margin: 0, width: 1.6,
      });
    } catch { /* formato incompatível — silencioso */ }
  }, [value, format]);
  return <svg ref={ref} style={{ maxWidth: `${width}px`, width: '100%', height: 'auto' }} />;
}

function PrintStyles({ wMm, hMm }: { wMm: number; hMm: number }) {
  return (
    <style>{`
      @media print {
        @page { size: ${wMm}mm ${hMm}mm; margin: 0; }
        body * { visibility: hidden !important; }
        .label-sheet, .label-sheet * { visibility: visible !important; }
        .exp-preview-box {
          padding: 0 !important; border: 0 !important; box-shadow: none !important;
          background: none !important; min-height: 0 !important; overflow: visible !important;
        }
        .exp-preview-stack {
          transform: none !important; gap: 0 !important; display: block !important;
        }
        .label-sheet {
          position: relative;
          page-break-after: always;
          border: 0 !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }
        .label-sheet:last-child { page-break-after: auto; }
      }
    `}</style>
  );
}

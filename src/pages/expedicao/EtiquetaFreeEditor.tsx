// ============================================================================
// Editor livre estilo BarTender — drag-and-drop de elementos numa etiqueta.
// MVP: texto, código de barras, QR, retângulo. Arraste para mover, alça para
// redimensionar, painel de propriedades à direita, exporta ZPL.
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Type, QrCode, Barcode, Square, Trash2, Copy, Printer, Usb, ZoomIn, ZoomOut, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  sendZplViaUsb, sendZplViaSerial, isWebUsbSupported, isWebSerialSupported,
  type BarcodeFmt,
} from './etiqueta-helpers';

type Tool = 'text' | 'barcode' | 'qr' | 'rect';
type SizeKey = '100x150' | '100x100' | '100x50';

interface BaseEl { id: string; type: Tool; x: number; y: number; w: number; h: number }
interface TextEl extends BaseEl { type: 'text'; text: string; fontSize: number; bold: boolean; align: 'left' | 'center' | 'right' }
interface BarcodeEl extends BaseEl { type: 'barcode'; value: string; fmt: BarcodeFmt }
interface QrEl extends BaseEl { type: 'qr'; value: string }
interface RectEl extends BaseEl { type: 'rect'; borderWidth: number; filled: boolean }
type El = TextEl | BarcodeEl | QrEl | RectEl;

const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  '100x150': { w: 100, h: 150, label: '100 × 150 mm' },
  '100x100': { w: 100, h: 100, label: '100 × 100 mm' },
  '100x50': { w: 100, h: 50, label: '100 × 50 mm' },
};

const STORAGE_KEY = 'exp_label_free_editor_v1';

function newId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export default function EtiquetaFreeEditor({ open, onOpenChange }: Props) {
  const [size, setSize] = useState<SizeKey>('100x150');
  const [scale, setScale] = useState(4); // px por mm
  const [elements, setElements] = useState<El[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<El[][]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dims = SIZES[size];
  const selected = elements.find((e) => e.id === selectedId) ?? null;

  // Persistência
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.size) setSize(parsed.size);
        if (Array.isArray(parsed?.elements)) setElements(parsed.elements);
      }
    } catch { /* noop */ }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ size, elements }));
  }, [size, elements, open]);

  const pushHistory = useCallback((prev: El[]) => {
    setHistory((h) => [...h.slice(-30), prev]);
  }, []);

  const mutate = useCallback((fn: (prev: El[]) => El[]) => {
    setElements((prev) => { pushHistory(prev); return fn(prev); });
  }, [pushHistory]);

  function undo() {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setElements(last);
      return h.slice(0, -1);
    });
  }

  function addTool(tool: Tool) {
    const base = { id: newId(), x: 5, y: 5, w: tool === 'qr' ? 25 : 60, h: tool === 'text' ? 8 : tool === 'qr' ? 25 : 15 };
    let el: El;
    if (tool === 'text') el = { ...base, type: 'text', text: 'Texto', fontSize: 4, bold: false, align: 'left' };
    else if (tool === 'barcode') el = { ...base, type: 'barcode', value: '123456789', fmt: 'CODE128' };
    else if (tool === 'qr') el = { ...base, type: 'qr', value: 'https://exemplo.com' };
    else el = { ...base, type: 'rect', borderWidth: 0.4, filled: false };
    mutate((prev) => [...prev, el]);
    setSelectedId(el.id);
  }

  function updateEl(id: string, patch: Partial<El>) {
    mutate((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } as El : e)));
  }
  function removeEl(id: string) {
    mutate((prev) => prev.filter((e) => e.id !== id));
    setSelectedId(null);
  }
  function duplicateEl(id: string) {
    const e = elements.find((x) => x.id === id);
    if (!e) return;
    const copy = { ...e, id: newId(), x: Math.min(dims.w - 5, e.x + 3), y: Math.min(dims.h - 5, e.y + 3) };
    mutate((prev) => [...prev, copy as El]);
    setSelectedId(copy.id);
  }

  // Drag & resize handling
  const dragRef = useRef<{ id: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: El } | null>(null);
  function onPointerDownEl(e: React.PointerEvent, el: El, mode: 'move' | 'resize') {
    e.stopPropagation();
    setSelectedId(el.id);
    dragRef.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, orig: el };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    if (d.mode === 'move') {
      const nx = Math.max(0, Math.min(dims.w - d.orig.w, d.orig.x + dx));
      const ny = Math.max(0, Math.min(dims.h - d.orig.h, d.orig.y + dy));
      setElements((prev) => prev.map((e2) => (e2.id === d.id ? { ...e2, x: nx, y: ny } : e2)));
    } else {
      const nw = Math.max(4, Math.min(dims.w - d.orig.x, d.orig.w + dx));
      const nh = Math.max(4, Math.min(dims.h - d.orig.y, d.orig.h + dy));
      setElements((prev) => prev.map((e2) => (e2.id === d.id ? { ...e2, w: nw, h: nh } : e2)));
    }
  }
  function onPointerUp() {
    if (dragRef.current) pushHistory(elements);
    dragRef.current = null;
  }

  // Print / ZPL
  const zpl = useMemo(() => generateZplFromElements(elements, dims.w, dims.h), [elements, dims.w, dims.h]);

  async function printZpl() {
    if (!elements.length) return toast.error('Adicione elementos antes de imprimir.');
    const usbOk = isWebUsbSupported();
    const serialOk = isWebSerialSupported();
    if (!usbOk && !serialOk) return toast.error('Este navegador não suporta WebUSB nem Web Serial.');
    const r = usbOk ? await sendZplViaUsb(zpl) : await sendZplViaSerial(zpl);
    if (r.ok === true) toast.success('Etiqueta enviada para impressora.');
    else toast.error(r.error);
  }

  function copyZpl() {
    navigator.clipboard.writeText(zpl).then(() => toast.success('ZPL copiado.'));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Square className="size-4 text-primary" /> Editor livre — crie sua etiqueta do zero
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1">
            <ToolBtn icon={<Type className="size-4" />} label="Texto" onClick={() => addTool('text')} />
            <ToolBtn icon={<Barcode className="size-4" />} label="Cód. barras" onClick={() => addTool('barcode')} />
            <ToolBtn icon={<QrCode className="size-4" />} label="QR" onClick={() => addTool('qr')} />
            <ToolBtn icon={<Square className="size-4" />} label="Retângulo" onClick={() => addTool('rect')} />
          </div>
          <div className="h-6 w-px bg-border" />
          <Select value={size} onValueChange={(v) => setSize(v as SizeKey)}>
            <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SIZES) as SizeKey[]).map((k) => (
                <SelectItem key={k} value={k}>{SIZES[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-6 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={() => setScale((s) => Math.max(2, s - 1))}><ZoomOut className="size-4" /></Button>
          <span className="text-xs font-mono w-10 text-center">{scale}×</span>
          <Button size="sm" variant="ghost" onClick={() => setScale((s) => Math.min(10, s + 1))}><ZoomIn className="size-4" /></Button>
          <Button size="sm" variant="ghost" onClick={undo} disabled={!history.length} className="gap-1.5">
            <Undo2 className="size-4" /> Desfazer
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={copyZpl} className="gap-1.5">
              <Copy className="size-4" /> Copiar ZPL
            </Button>
            <Button size="sm" onClick={printZpl} className="gap-1.5">
              <Usb className="size-4" /> <Printer className="size-4" /> Imprimir ZPL
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_320px] overflow-hidden">
          {/* Canvas */}
          <div className="overflow-auto bg-muted/40 flex items-start justify-center p-6"
            onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            <div
              ref={canvasRef}
              className="relative bg-white shadow-md border border-border"
              style={{ width: dims.w * scale, height: dims.h * scale }}
              onClick={() => setSelectedId(null)}
            >
              {/* réguas simples */}
              <div className="absolute -top-4 left-0 right-0 text-[9px] text-muted-foreground text-center font-mono">
                {dims.w} mm
              </div>
              {elements.map((el) => (
                <ElementView
                  key={el.id}
                  el={el}
                  scale={scale}
                  selected={selectedId === el.id}
                  onPointerDown={onPointerDownEl}
                />
              ))}
            </div>
          </div>

          {/* Painel de propriedades */}
          <aside className="border-l border-border bg-card overflow-y-auto p-4 space-y-3">
            <h3 className="text-sm font-semibold">Propriedades</h3>
            {!selected ? (
              <p className="text-xs text-muted-foreground italic">Selecione um elemento no canvas.</p>
            ) : (
              <PropertiesPanel
                el={selected}
                onChange={(patch) => updateEl(selected.id, patch)}
                onDelete={() => removeEl(selected.id)}
                onDuplicate={() => duplicateEl(selected.id)}
              />
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Elementos renderizados
// ============================================================================

function ElementView({ el, scale, selected, onPointerDown }: {
  el: El; scale: number; selected: boolean;
  onPointerDown: (e: React.PointerEvent, el: El, mode: 'move' | 'resize') => void;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x * scale,
    top: el.y * scale,
    width: el.w * scale,
    height: el.h * scale,
    outline: selected ? '2px solid hsl(var(--primary))' : '1px dashed transparent',
    outlineOffset: 0,
    cursor: 'move',
  };

  return (
    <div style={style} onPointerDown={(e) => onPointerDown(e, el, 'move')}>
      <ElementInner el={el} scale={scale} />
      {selected && (
        <div
          onPointerDown={(e) => onPointerDown(e, el, 'resize')}
          className="absolute -bottom-1.5 -right-1.5 size-3 bg-primary rounded-sm cursor-se-resize"
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  );
}

function ElementInner({ el, scale }: { el: El; scale: number }) {
  if (el.type === 'text') {
    return (
      <div
        className="w-full h-full overflow-hidden flex items-center leading-tight break-words"
        style={{
          fontSize: el.fontSize * scale * 0.9,
          fontWeight: el.bold ? 700 : 400,
          textAlign: el.align,
          justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
          color: '#000',
        }}
      >
        <span className="w-full">{el.text}</span>
      </div>
    );
  }
  if (el.type === 'qr') {
    const size = Math.min(el.w, el.h) * scale;
    return <QRCodeCanvas value={el.value || ' '} size={size} includeMargin={false} />;
  }
  if (el.type === 'barcode') return <BarcodePreview value={el.value} fmt={el.fmt} width={el.w * scale} height={el.h * scale} />;
  // rect
  return (
    <div className="w-full h-full" style={{
      border: `${el.borderWidth * scale}px solid #000`,
      background: el.filled ? '#000' : 'transparent',
    }} />
  );
}

function BarcodePreview({ value, fmt, width, height }: { value: string; fmt: BarcodeFmt; width: number; height: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value || '000', {
        format: fmt, displayValue: false, margin: 0, width: 1, height: Math.max(10, height - 4),
      });
    } catch { /* invalid payload for this fmt */ }
  }, [value, fmt, width, height]);
  return <svg ref={ref} style={{ width, height }} />;
}

// ============================================================================
// Painel de propriedades
// ============================================================================
function PropertiesPanel({ el, onChange, onDelete, onDuplicate }: {
  el: El; onChange: (patch: Partial<El>) => void; onDelete: () => void; onDuplicate: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="X (mm)" value={el.x} onChange={(v) => onChange({ x: v } as Partial<El>)} />
        <Field label="Y (mm)" value={el.y} onChange={(v) => onChange({ y: v } as Partial<El>)} />
        <Field label="Largura" value={el.w} onChange={(v) => onChange({ w: v } as Partial<El>)} />
        <Field label="Altura" value={el.h} onChange={(v) => onChange({ h: v } as Partial<El>)} />
      </div>

      {el.type === 'text' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Texto</Label>
            <Input value={el.text} onChange={(e) => onChange({ text: e.target.value } as Partial<El>)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tamanho fonte (mm): {el.fontSize.toFixed(1)}</Label>
            <Slider min={2} max={14} step={0.5} value={[el.fontSize]}
              onValueChange={([v]) => onChange({ fontSize: v } as Partial<El>)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Negrito</Label>
            <Switch checked={el.bold} onCheckedChange={(v) => onChange({ bold: v } as Partial<El>)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Alinhamento</Label>
            <Select value={el.align} onValueChange={(v) => onChange({ align: v as TextEl['align'] } as Partial<El>)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {el.type === 'barcode' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Valor</Label>
            <Input value={el.value} onChange={(e) => onChange({ value: e.target.value } as Partial<El>)} className="font-mono" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Formato</Label>
            <Select value={el.fmt} onValueChange={(v) => onChange({ fmt: v as BarcodeFmt } as Partial<El>)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CODE128">CODE128</SelectItem>
                <SelectItem value="CODE39">CODE39</SelectItem>
                <SelectItem value="EAN13">EAN-13</SelectItem>
                <SelectItem value="EAN8">EAN-8</SelectItem>
                <SelectItem value="ITF14">ITF-14</SelectItem>
                <SelectItem value="UPC">UPC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {el.type === 'qr' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Conteúdo do QR</Label>
          <Input value={el.value} onChange={(e) => onChange({ value: e.target.value } as Partial<El>)} className="font-mono" />
        </div>
      )}

      {el.type === 'rect' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Borda (mm): {el.borderWidth.toFixed(2)}</Label>
            <Slider min={0} max={2} step={0.1} value={[el.borderWidth]}
              onValueChange={([v]) => onChange({ borderWidth: v } as Partial<El>)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Preenchido</Label>
            <Switch checked={el.filled} onCheckedChange={(v) => onChange({ filled: v } as Partial<El>)} />
          </div>
        </>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={onDuplicate}>
          <Copy className="size-4" /> Duplicar
        </Button>
        <Button size="sm" variant="destructive" className="gap-1.5 flex-1" onClick={onDelete}>
          <Trash2 className="size-4" /> Excluir
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input type="number" value={Number(value.toFixed(1))} step={0.5} className="h-8 font-mono text-xs"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
    </div>
  );
}

function ToolBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick} className="gap-1.5 h-8">
      {icon} <span className="hidden md:inline text-xs">{label}</span>
    </Button>
  );
}

// ============================================================================
// Geração de ZPL a partir dos elementos do canvas.
// Coord. em dots (8 dots/mm — 203 dpi padrão).
// ============================================================================
function generateZplFromElements(elements: El[], widthMm: number, heightMm: number): string {
  const DPMM = 8;
  const toDots = (mm: number) => Math.round(mm * DPMM);
  const lines: string[] = ['^XA', `^PW${toDots(widthMm)}`, `^LL${toDots(heightMm)}`, '^CI28'];

  for (const el of elements) {
    const x = toDots(el.x);
    const y = toDots(el.y);
    const w = toDots(el.w);
    const h = toDots(el.h);
    if (el.type === 'text') {
      const size = Math.max(10, toDots(el.fontSize));
      const font = el.bold ? '^A0N' : '^A0N';
      lines.push(`^FO${x},${y}${font},${size},${size}^FB${w},4,0,${el.align === 'right' ? 'R' : el.align === 'center' ? 'C' : 'L'}^FD${escapeZpl(el.text)}^FS`);
    } else if (el.type === 'barcode') {
      const zplFmt = mapFmt(el.fmt);
      lines.push(`^FO${x},${y}^BY2,2,${h}${zplFmt}^FD${escapeZpl(el.value)}^FS`);
    } else if (el.type === 'qr') {
      const mag = Math.max(1, Math.min(10, Math.floor(Math.min(w, h) / 40)));
      lines.push(`^FO${x},${y}^BQN,2,${mag}^FDLA,${escapeZpl(el.value)}^FS`);
    } else {
      const bw = Math.max(1, toDots(el.borderWidth));
      if (el.filled) lines.push(`^FO${x},${y}^GB${w},${h},${Math.max(w, h)},B,0^FS`);
      else lines.push(`^FO${x},${y}^GB${w},${h},${bw},B,0^FS`);
    }
  }

  lines.push('^XZ');
  return lines.join('\n');
}

function mapFmt(fmt: BarcodeFmt): string {
  switch (fmt) {
    case 'CODE39': return '^B3N,N,80,Y,N';
    case 'EAN13':  return '^BEN,80,Y,N';
    case 'EAN8':   return '^B8N,80,Y,N';
    case 'UPC':    return '^BUN,80,Y,N,N';
    case 'ITF14':  return '^BIN,80,Y,N';
    default:       return '^BCN,80,Y,N,N';
  }
}

function escapeZpl(s: string): string {
  return (s ?? '').replace(/[\^~]/g, ' ');
}

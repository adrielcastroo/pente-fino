// ============================================================================
// Etiquetas de Expedição — editor visual estilo Canva/BarTender.
// Recursos:
//  - Réguas horizontal/vertical (mm) com marcador da posição do elemento
//  - Variáveis dinâmicas em QR/Barras/Texto ({{nfNumero}}, {{codigo}}, ...)
//  - Tamanhos padrão + personalizado com atualização em tempo real
//  - Elementos: texto (B/I/U/negativo/fonte), QR, DataMatrix, Aztec, barras,
//    linha (sólida/tracejada/pontilhada), retângulo (oco/preenchido/borda/raio)
//  - Imagem externa (logo da empresa) via upload
//  - Zoom pela roda do mouse (Ctrl/Alt para passo fino)
// ============================================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js/browser';
import {
  Printer, Tag, FileText, RotateCcw, History, Type, QrCode, Barcode as BarcodeIcon,
  Trash2, Copy, Minus, Square, ArrowUp, ArrowDown, Plus, Image as ImageIcon,
  Grid3x3, Hexagon, Bold, Italic, Underline, Contrast,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { loadHistory, pushHistory, clearHistory, type PrintHistoryEntry, type BarcodeFmt } from './etiqueta-helpers';
import EtiquetaXmlDialog, { type LabelSizeKey } from './EtiquetaXmlDialog';
import type { EtiquetaXmlPatch } from './etiqueta-xml';
import { cn } from '@/lib/utils';

// ============================================================================
// Model
// ============================================================================

type PresetSize = '100x150' | '100x100' | '100x50' | 'custom';

type ElementType = 'text' | 'qr' | 'datamatrix' | 'aztec' | 'barcode' | 'line' | 'rect' | 'image';

type LineStyle = 'solid' | 'dashed' | 'dotted';
type RectFill = 'outline' | 'filled';

interface LabelElement {
  id: string;
  type: ElementType;
  x: number; y: number; w: number; h: number; // mm
  // texto
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  negative?: boolean;
  align?: 'left' | 'center' | 'right';
  // códigos
  barcodeFmt?: BarcodeFmt;
  payload?: string;
  // linha
  lineStyle?: LineStyle;
  // retângulo
  rectFill?: RectFill;
  borderWidth?: number;
  borderRadius?: number;
  // imagem
  imageSrc?: string;
}

interface LabelState {
  pageSize: PresetSize;
  widthMm: number;
  heightMm: number;
  copias: number;
  elements: LabelElement[];
  meta: {
    transportadora: string;
    nfNumero: string;
    volumeAtual: string;
    volumeTotal: string;
    destino: string;
    codigo: string;
  };
}

const PRESETS: Record<Exclude<PresetSize, 'custom'>, { w: number; h: number; label: string }> = {
  '100x150': { w: 100, h: 150, label: '100 × 150 mm (padrão)' },
  '100x100': { w: 100, h: 100, label: '100 × 100 mm (quadrada)' },
  '100x50':  { w: 100, h: 50,  label: '100 × 50 mm (compacta)' },
};

const FONT_FAMILIES: { value: string; label: string }[] = [
  { value: 'system-ui, sans-serif', label: 'Sistema (sans-serif)' },
  { value: '"Inter", system-ui, sans-serif', label: 'Inter' },
  { value: '"IBM Plex Sans", sans-serif', label: 'IBM Plex Sans' },
  { value: '"IBM Plex Mono", ui-monospace, monospace', label: 'IBM Plex Mono' },
  { value: '"JetBrains Mono", ui-monospace, monospace', label: 'JetBrains Mono' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia (serifada)' },
  { value: '"Courier New", ui-monospace, monospace', label: 'Courier New' },
  { value: 'Impact, sans-serif', label: 'Impact (display)' },
];

const STORAGE_KEY = 'exp_label_editor_v3';
const MM_TO_PX = 3.7795;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function defaultElements(): LabelElement[] {
  return [
    { id: uid(), type: 'text', x: 4, y: 4, w: 92, h: 8, text: 'EXPEDIÇÃO', fontSize: 16, bold: true, align: 'center', fontFamily: FONT_FAMILIES[0].value },
    { id: uid(), type: 'line', x: 4, y: 13, w: 92, h: 0.4, lineStyle: 'solid' },
    { id: uid(), type: 'text', x: 4, y: 16, w: 92, h: 8, text: '{{transportadora}}', fontSize: 12, bold: true, align: 'center' },
    { id: uid(), type: 'text', x: 4, y: 26, w: 92, h: 8, text: 'NF {{nfNumero}}', fontSize: 14, bold: true, align: 'center' },
    { id: uid(), type: 'text', x: 4, y: 36, w: 92, h: 12, text: 'VOL {{volumeAtual}}/{{volumeTotal}}', fontSize: 22, bold: true, align: 'center' },
    { id: uid(), type: 'qr', x: 30, y: 55, w: 40, h: 40, payload: '{{codigo}}' },
    { id: uid(), type: 'text', x: 4, y: 100, w: 92, h: 30, text: '{{destino}}', fontSize: 10, align: 'left' },
  ];
}

const DEFAULT_STATE: LabelState = {
  pageSize: '100x150',
  widthMm: 100,
  heightMm: 150,
  copias: 1,
  elements: defaultElements(),
  meta: { transportadora: '', nfNumero: '', volumeAtual: '1', volumeTotal: '1', destino: '', codigo: '' },
};

function loadState(): LabelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, elements: defaultElements() };
    const p = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...p, meta: { ...DEFAULT_STATE.meta, ...(p.meta || {}) } };
  } catch { return { ...DEFAULT_STATE, elements: defaultElements() }; }
}

const PRESETS_KEY = 'exp_label_presets_v1';
interface SavedPreset { id: string; name: string; createdAt: number; snapshot: LabelState }
function loadPresets(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function savePresets(list: SavedPreset[]) { localStorage.setItem(PRESETS_KEY, JSON.stringify(list)); }

// Interpolação de variáveis: {{nfNumero}} → valor real do meta.
const VARIABLE_KEYS = ['transportadora', 'nfNumero', 'volumeAtual', 'volumeTotal', 'destino', 'codigo'] as const;
function resolveVars(input: string | undefined, meta: LabelState['meta']): string {
  if (!input) return '';
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const v = (meta as Record<string, string>)[k];
    return v == null ? '' : String(v);
  });
}

// ============================================================================
// Page
// ============================================================================

export default function ExpedicaoEtiquetasPage() {
  useDocumentTitle('Etiquetas · Expedição');

  const [state, setState] = useState<LabelState>(() => loadState());
  const [xmlOpen, setXmlOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0); // 0 = auto-fit
  const [presets, setPresets] = useState<SavedPreset[]>(() => loadPresets());
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSavePreset = () => {
    const name = prompt('Nome do preset:', `Preset ${presets.length + 1}`);
    if (!name?.trim()) return;
    const next: SavedPreset = { id: uid(), name: name.trim(), createdAt: Date.now(), snapshot: state };
    const list = [next, ...presets];
    setPresets(list); savePresets(list);
    toast.success(`Preset "${next.name}" salvo.`);
  };
  const handleLoadPreset = (p: SavedPreset) => { setState(p.snapshot); setSelectedId(null); toast.success(`Preset "${p.name}" carregado.`); };
  const handleDeletePreset = (id: string) => { const list = presets.filter((p) => p.id !== id); setPresets(list); savePresets(list); };

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), 250);
    return () => clearTimeout(id);
  }, [state]);

  const patch = useCallback((p: Partial<LabelState>) => setState((s) => ({ ...s, ...p })), []);
  const updateElement = useCallback((id: string, p: Partial<LabelElement>) => {
    setState((s) => ({ ...s, elements: s.elements.map((e) => e.id === id ? { ...e, ...p } : e) }));
  }, []);
  const removeElement = useCallback((id: string) => {
    setState((s) => ({ ...s, elements: s.elements.filter((e) => e.id !== id) }));
    setSelectedId(null);
  }, []);
  const duplicateElement = useCallback((id: string) => {
    setState((s) => {
      const el = s.elements.find((e) => e.id === id); if (!el) return s;
      const clone = { ...el, id: uid(), x: Math.min(s.widthMm - el.w, el.x + 4), y: Math.min(s.heightMm - el.h, el.y + 4) };
      return { ...s, elements: [...s.elements, clone] };
    });
  }, []);
  const moveElementZ = useCallback((id: string, dir: 'up' | 'down') => {
    setState((s) => {
      const idx = s.elements.findIndex((e) => e.id === id); if (idx < 0) return s;
      const next = [...s.elements];
      const swap = dir === 'up' ? idx + 1 : idx - 1;
      if (swap < 0 || swap >= next.length) return s;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...s, elements: next };
    });
  }, []);

  const addElement = useCallback((type: ElementType) => {
    const base: LabelElement = (() => {
      switch (type) {
        case 'text': return { id: uid(), type, x: 5, y: 5, w: 60, h: 8, text: 'Novo texto', fontSize: 12, align: 'left', fontFamily: FONT_FAMILIES[0].value, fontColor: '#000000' };
        case 'qr': return { id: uid(), type, x: 5, y: 5, w: 30, h: 30, payload: '{{codigo}}' };
        case 'datamatrix': return { id: uid(), type, x: 5, y: 5, w: 25, h: 25, payload: '{{codigo}}' };
        case 'aztec': return { id: uid(), type, x: 5, y: 5, w: 25, h: 25, payload: '{{codigo}}' };
        case 'barcode': return { id: uid(), type, x: 5, y: 5, w: 60, h: 15, barcodeFmt: 'CODE128', payload: '{{codigo}}' };
        case 'line': return { id: uid(), type, x: 5, y: 5, w: 60, h: 0.4, lineStyle: 'solid' };
        case 'rect': return { id: uid(), type, x: 5, y: 5, w: 30, h: 20, rectFill: 'outline', borderWidth: 0.4, borderRadius: 0 };
        case 'image': return { id: uid(), type, x: 5, y: 5, w: 30, h: 20, imageSrc: '' };
      }
    })();
    setState((s) => ({ ...s, elements: [...s.elements, base] }));
    setSelectedId(base.id);
    return base.id;
  }, []);

  // Requisito #4: adicionar imagem = sempre upload do usuário. O botão dispara file picker
  // imediatamente; só cria o elemento após a imagem ser carregada com sucesso.
  const triggerImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);
  const onImageUploadFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // permite escolher a mesma imagem depois
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máx 2 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const id = uid();
      // proporção aproximada baseada na imagem para ficar bonita já no add
      const img = new Image();
      img.onload = () => {
        const maxW = 40; // mm
        const ratio = img.height / img.width || 0.6;
        const w = Math.min(maxW, 40);
        const h = +(w * ratio).toFixed(1);
        setState((s) => ({ ...s, elements: [...s.elements, { id, type: 'image', x: 5, y: 5, w, h, imageSrc: src, borderRadius: 0 }] }));
        setSelectedId(id);
      };
      img.onerror = () => {
        setState((s) => ({ ...s, elements: [...s.elements, { id, type: 'image', x: 5, y: 5, w: 30, h: 20, imageSrc: src, borderRadius: 0 }] }));
        setSelectedId(id);
      };
      img.src = src;
    };
    reader.readAsDataURL(f);
  }, []);

  // Requisito #7: atalhos no preview — Del/Backspace remove, Ctrl/Cmd+B alterna negrito.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeElement(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setState((s) => {
          const el = s.elements.find((x) => x.id === selectedId);
          if (!el || el.type !== 'text') return s;
          return { ...s, elements: s.elements.map((x) => x.id === selectedId ? { ...x, bold: !x.bold } : x) };
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, removeElement]);


  function applyXmlPatch(input: EtiquetaXmlPatch & { pageSize: LabelSizeKey; copies: number }) {
    setState((s) => {
      const preset = PRESETS[input.pageSize];
      const dims = preset ? { widthMm: preset.w, heightMm: preset.h, pageSize: input.pageSize as PresetSize } : {};
      return {
        ...s, ...dims,
        copias: Math.max(1, input.copies),
        meta: {
          transportadora: input.transportadora,
          nfNumero: input.nfNumero,
          volumeAtual: input.volumeAtual,
          volumeTotal: input.volumeTotal,
          destino: input.destino,
          codigo: input.codePayload || input.codigo || input.nfNumero,
        },
      };
    });
    toast.success('Dados do XML aplicados. As variáveis dos elementos foram atualizadas automaticamente.');
  }

  function changePreset(next: PresetSize) {
    if (next === 'custom') { patch({ pageSize: 'custom' }); return; }
    const p = PRESETS[next];
    patch({ pageSize: next, widthMm: p.w, heightMm: p.h });
  }

  function reset() {
    setState({ ...DEFAULT_STATE, elements: defaultElements() });
    setSelectedId(null);
    toast.success('Etiqueta reiniciada.');
  }

  function handlePrint() {
    window.print();
    pushHistory({
      templateId: 'editor',
      templateName: `Etiqueta ${state.widthMm}×${state.heightMm}mm`,
      copies: state.copias,
      payload: state.meta.nfNumero || state.meta.codigo || '',
      method: 'browser',
      snapshot: state,
    });
  }

  const selected = state.elements.find((e) => e.id === selectedId) || null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
            <Tag className="size-5 text-primary" /> Etiquetas de Expedição
            <Badge variant="secondary" className="font-mono text-[11px]">{state.widthMm}×{state.heightMm} mm</Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            Editor livre com réguas, variáveis dinâmicas e zoom por scroll do mouse.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" size="sm" className="gap-1.5" onClick={() => setXmlOpen(true)}>
            <FileText className="size-4" /> Importar XML
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHistoryOpen(true)}>
            <History className="size-4" /> Histórico
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reset} title="Limpar etiqueta">
            <RotateCcw className="size-4" />
          </Button>
          <Button onClick={handlePrint} size="sm" className="gap-1.5">
            <Printer className="size-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 lg:gap-6 print:block min-w-0">
        {/* Painel de configuração */}
        <Card className="print:hidden">
          <CardContent className="p-4 space-y-4">
            {/* Tamanho */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tamanho</Label>
              <Select value={state.pageSize} onValueChange={(v) => changePreset(v as PresetSize)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRESETS) as [Exclude<PresetSize, 'custom'>, typeof PRESETS['100x150']][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Personalizado…</SelectItem>
                </SelectContent>
              </Select>
              {state.pageSize === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Largura (mm)</Label>
                    <Input type="number" min={20} max={300} className="h-8"
                      value={state.widthMm}
                      onChange={(e) => patch({ widthMm: Math.max(20, Math.min(300, Number(e.target.value) || 20)) })} />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Altura (mm)</Label>
                    <Input type="number" min={20} max={400} className="h-8"
                      value={state.heightMm}
                      onChange={(e) => patch({ heightMm: Math.max(20, Math.min(400, Number(e.target.value) || 20)) })} />
                  </div>
                </div>
              )}
            </div>

            {/* Cópias */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Cópias</Label>
                <span className="text-xs font-mono">{state.copias}</span>
              </div>
              <Slider value={[state.copias]} min={1} max={50} step={1}
                onValueChange={(v) => patch({ copias: v[0] })} />
            </div>

            {/* Adicionar elementos */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Adicionar elemento</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('text')}>
                  <Type className="size-3.5" /> Texto
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('qr')}>
                  <QrCode className="size-3.5" /> QR
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('datamatrix')}>
                  <Grid3x3 className="size-3.5" /> DataMatrix
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('aztec')}>
                  <Hexagon className="size-3.5" /> Aztec
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('barcode')}>
                  <BarcodeIcon className="size-3.5" /> Barras
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('line')}>
                  <Minus className="size-3.5" /> Linha
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('rect')}>
                  <Square className="size-3.5" /> Retângulo
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-1.5 h-8" onClick={() => addElement('image')}>
                  <ImageIcon className="size-3.5" /> Imagem
                </Button>
              </div>
            </div>

            {/* Variáveis */}
            <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-[10px] space-y-1">
              <div className="font-semibold uppercase tracking-wider text-muted-foreground">Variáveis disponíveis</div>
              <div className="flex flex-wrap gap-1">
                {VARIABLE_KEYS.map((k) => (
                  <code key={k} className="px-1 py-0.5 rounded bg-background border border-border font-mono">{`{{${k}}}`}</code>
                ))}
              </div>
              <p className="text-muted-foreground pt-1">Use em textos, QR e barras. São resolvidas ao imprimir.</p>
            </div>

            {/* Elementos */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Elementos ({state.elements.length})</Label>
              <ScrollArea className="h-40 border border-border/60 rounded-md">
                <ul className="divide-y divide-border">
                  {state.elements.map((el) => (
                    <li key={el.id}>
                      <button type="button" onClick={() => setSelectedId(el.id)}
                        className={cn('w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-accent/40 transition-colors',
                          selectedId === el.id && 'bg-primary/10')}>
                        <ElementIcon type={el.type} />
                        <span className="truncate flex-1">{elementLabel(el)}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3" />
                        </button>
                      </button>
                    </li>
                  ))}
                  {state.elements.length === 0 && (
                    <li className="p-3 text-[11px] text-muted-foreground italic">Nenhum elemento.</li>
                  )}
                </ul>
              </ScrollArea>
            </div>

            {/* Presets salvos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Meus presets ({presets.length})</Label>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={handleSavePreset}>
                  <Plus className="size-3" /> Salvar
                </Button>
              </div>
              {presets.length > 0 && (
                <ScrollArea className="max-h-40 border border-border/60 rounded-md">
                  <ul className="divide-y divide-border">
                    {presets.map((p) => (
                      <li key={p.id} className="flex items-center gap-1 px-2 py-1.5 hover:bg-accent/40">
                        <button type="button" onClick={() => handleLoadPreset(p)} className="flex-1 min-w-0 text-left">
                          <div className="text-xs font-medium truncate">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {p.snapshot.widthMm}×{p.snapshot.heightMm}mm · {p.snapshot.elements.length} elem.
                          </div>
                        </button>
                        <button type="button" onClick={() => handleDeletePreset(p.id)}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>

            {/* Resumo XML */}
            {(state.meta.transportadora || state.meta.nfNumero) && (
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5 text-[11px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted-foreground uppercase tracking-wide text-[10px]">Transp.</span>
                  <span className="font-semibold text-right truncate">{state.meta.transportadora || '—'}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted-foreground uppercase tracking-wide text-[10px]">NF-e</span>
                  <span className="font-mono text-right truncate">{state.meta.nfNumero || '—'}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted-foreground uppercase tracking-wide text-[10px]">Vol.</span>
                  <span className="font-mono">{state.meta.volumeAtual}/{state.meta.volumeTotal}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor Canvas */}
        <PreviewWorkbench
          widthMm={state.widthMm}
          heightMm={state.heightMm}
          copias={state.copias}
          zoom={zoom}
          onZoomChange={setZoom}
          selected={selected}
        >
          {Array.from({ length: state.copias }).map((_, i) => (
            <LabelCanvas
              key={i}
              editable={i === 0}
              widthMm={state.widthMm}
              heightMm={state.heightMm}
              elements={state.elements}
              meta={state.meta}
              selectedId={i === 0 ? selectedId : null}
              onSelect={setSelectedId}
              onUpdate={updateElement}
              onRemove={removeElement}
              onDuplicate={duplicateElement}
              onMoveZ={moveElementZ}
            />
          ))}
        </PreviewWorkbench>
      </div>

      {/* Painel de edição do elemento selecionado */}
      {selected && (
        <ElementInspector
          element={selected}
          onUpdate={(p) => updateElement(selected.id, p)}
          onClose={() => setSelectedId(null)}
        />
      )}

      <EtiquetaXmlDialog open={xmlOpen} onOpenChange={setXmlOpen} onApply={applyXmlPatch} />
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} onRestore={(snap) => {
        if (snap && typeof snap === 'object') setState(snap as LabelState);
        setHistoryOpen(false);
      }} />
      <PrintStyles wMm={state.widthMm} hMm={state.heightMm} />
    </div>
  );
}

// ============================================================================
// Preview workbench com réguas + zoom pela roda do mouse
// ============================================================================

const RULER_SIZE = 20; // px

function PreviewWorkbench({
  widthMm, heightMm, copias, zoom, onZoomChange, selected, children,
}: {
  widthMm: number; heightMm: number; copias: number; zoom: number;
  onZoomChange: (v: number) => void;
  selected: LabelElement | null;
  children: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [autoFit, setAutoFit] = useState(1);

  const gapPx = 16;
  const naturalW = widthMm * MM_TO_PX;
  const naturalH = heightMm * MM_TO_PX * Math.max(1, copias) + gapPx * Math.max(0, copias - 1);

  useLayoutEffect(() => {
    const el = boxRef.current; if (!el) return;
    const recalc = () => {
      const pad = 48;
      const availW = Math.max(0, el.clientWidth - pad - RULER_SIZE);
      const availH = Math.max(0, el.clientHeight - pad - RULER_SIZE);
      if (availW <= 0 || availH <= 0) return;
      setAutoFit(Math.min(availW / naturalW, availH / naturalH, 1.5));
    };
    recalc();
    const ro = new ResizeObserver(recalc); ro.observe(el);
    return () => ro.disconnect();
  }, [naturalW, naturalH]);

  const fit = zoom > 0 ? zoom : autoFit;

  // Wheel zoom: sem preventDefault (React events são passivos); usamos listener nativo.
  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      const step = e.altKey ? 0.02 : 0.08;
      const dir = e.deltaY > 0 ? -1 : 1;
      const base = zoom > 0 ? zoom : autoFit;
      const next = Math.max(0.2, Math.min(4, base + dir * step));
      onZoomChange(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom, autoFit, onZoomChange]);

  return (
    <div className="space-y-3 exp-preview-workbench">
      <div className="flex items-baseline justify-between shrink-0 print:hidden">
        <Label className="text-xs font-semibold uppercase tracking-widest opacity-60">Pré-visualização</Label>
        <div className="flex items-center gap-3 text-[10px] font-mono opacity-70">
          <span>{widthMm}×{heightMm}mm</span>
          <span>{Math.round(fit * 100)}%</span>
          <button className="underline hover:text-primary" onClick={() => onZoomChange(0)}>Ajustar</button>
          <span className="opacity-60">Scroll do mouse para zoom (Ctrl = zoom fino)</span>
        </div>
      </div>
      <div
        ref={boxRef}
        className="exp-preview-box relative flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-border/50 min-h-[560px] overflow-auto shadow-inner"
        style={{
          backgroundColor: 'hsl(var(--muted) / 0.55)',
          backgroundImage:
            'linear-gradient(45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${fit})`,
            transformOrigin: 'center center',
            paddingLeft: RULER_SIZE, paddingTop: RULER_SIZE,
          }}
        >
          {/* Régua horizontal */}
          <Ruler orientation="horizontal" lengthMm={widthMm} highlight={selected ? { start: selected.x, end: selected.x + selected.w } : null} />
          {/* Régua vertical */}
          <Ruler orientation="vertical" lengthMm={heightMm * Math.max(1, copias) + (gapPx / MM_TO_PX) * Math.max(0, copias - 1)} highlight={selected ? { start: selected.y, end: selected.y + selected.h } : null} />
          <div
            className="exp-preview-stack"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: `${gapPx}px` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Régua (estilo Canva/BarTender): traços a cada mm, número a cada 10mm.
// ---------------------------------------------------------------------------
function Ruler({
  orientation, lengthMm, highlight,
}: { orientation: 'horizontal' | 'vertical'; lengthMm: number; highlight: { start: number; end: number } | null }) {
  const lengthPx = lengthMm * MM_TO_PX;
  const isH = orientation === 'horizontal';
  const marks: JSX.Element[] = [];
  for (let mm = 0; mm <= Math.ceil(lengthMm); mm++) {
    const pos = mm * MM_TO_PX;
    let height = 4;
    if (mm % 10 === 0) height = 12;
    else if (mm % 5 === 0) height = 8;
    marks.push(
      <div key={mm}
        className="absolute bg-foreground/60"
        style={isH
          ? { left: pos, top: RULER_SIZE - height, width: 1, height }
          : { top: pos, left: RULER_SIZE - height, height: 1, width: height }}
      />
    );
    if (mm % 10 === 0 && mm > 0) {
      marks.push(
        <div key={`l-${mm}`}
          className="absolute text-[8px] font-mono text-foreground/70 select-none pointer-events-none"
          style={isH
            ? { left: pos + 2, top: 1 }
            : { top: pos + 2, left: 1, writingMode: 'vertical-rl' as const }}
        >{mm}</div>
      );
    }
  }

  const style: React.CSSProperties = isH
    ? { position: 'absolute', top: 0, left: RULER_SIZE, width: lengthPx, height: RULER_SIZE, background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))' }
    : { position: 'absolute', top: RULER_SIZE, left: 0, height: lengthPx, width: RULER_SIZE, background: 'hsl(var(--background))', borderRight: '1px solid hsl(var(--border))' };

  return (
    <div style={style} className="print:hidden">
      {marks}
      {highlight && (
        <div
          className="absolute bg-primary/40"
          style={isH
            ? { left: highlight.start * MM_TO_PX, top: 0, width: (highlight.end - highlight.start) * MM_TO_PX, height: RULER_SIZE }
            : { top: highlight.start * MM_TO_PX, left: 0, height: (highlight.end - highlight.start) * MM_TO_PX, width: RULER_SIZE }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Canvas com elementos arrastáveis
// ============================================================================

interface CanvasProps {
  editable: boolean;
  widthMm: number; heightMm: number;
  elements: LabelElement[];
  meta: LabelState['meta'];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<LabelElement>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveZ: (id: string, dir: 'up' | 'down') => void;
}

function LabelCanvas({
  editable, widthMm, heightMm, elements, meta, selectedId, onSelect, onUpdate, onRemove, onDuplicate, onMoveZ,
}: CanvasProps) {
  const wPx = widthMm * MM_TO_PX;
  const hPx = heightMm * MM_TO_PX;
  const canvasRef = useRef<HTMLDivElement>(null);

  const startDrag = (e: React.PointerEvent, el: LabelElement, mode: 'move' | 'resize') => {
    if (!editable) return;
    e.stopPropagation();
    onSelect(el.id);
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / wPx;
    const scaleY = rect.height / hPx;
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = { x: el.x, y: el.y, w: el.w, h: el.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const dxMm = (ev.clientX - startX) / scaleX / MM_TO_PX;
      const dyMm = (ev.clientY - startY) / scaleY / MM_TO_PX;
      if (mode === 'move') {
        const nx = Math.max(0, Math.min(widthMm - origin.w, origin.x + dxMm));
        const ny = Math.max(0, Math.min(heightMm - origin.h, origin.y + dyMm));
        onUpdate(el.id, { x: +nx.toFixed(2), y: +ny.toFixed(2) });
      } else {
        const nw = Math.max(4, Math.min(widthMm - origin.x, origin.w + dxMm));
        const nh = Math.max(2, Math.min(heightMm - origin.y, origin.h + dyMm));
        onUpdate(el.id, { w: +nw.toFixed(2), h: +nh.toFixed(2) });
      }
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={canvasRef}
      className="label-sheet bg-white text-black shadow-md relative overflow-hidden"
      style={{ width: `${wPx}px`, height: `${hPx}px`, fontFamily: 'system-ui, sans-serif' }}
      onPointerDown={(e) => { if (editable && e.target === e.currentTarget) onSelect(null); }}
    >
      {elements.map((el) => (
        <ElementView
          key={el.id}
          el={el}
          meta={meta}
          selected={editable && selectedId === el.id}
          editable={editable}
          onPointerDown={(e, mode) => startDrag(e, el, mode)}
          onRemove={() => onRemove(el.id)}
          onDuplicate={() => onDuplicate(el.id)}
          onMoveZ={(d) => onMoveZ(el.id, d)}
          onUpdate={(p) => onUpdate(el.id, p)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Element view
// ============================================================================

function ElementView({
  el, meta, selected, editable, onPointerDown, onRemove, onDuplicate, onMoveZ, onUpdate,
}: {
  el: LabelElement; meta: LabelState['meta'];
  selected: boolean; editable: boolean;
  onPointerDown: (e: React.PointerEvent, mode: 'move' | 'resize') => void;
  onRemove: () => void; onDuplicate: () => void;
  onMoveZ: (dir: 'up' | 'down') => void;
  onUpdate: (p: Partial<LabelElement>) => void;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x * MM_TO_PX}px`, top: `${el.y * MM_TO_PX}px`,
    width: `${el.w * MM_TO_PX}px`, height: `${el.h * MM_TO_PX}px`,
  };
  return (
    <div
      style={style}
      className={cn('label-el',
        editable && 'cursor-move',
        editable && selected && 'outline outline-2 outline-primary',
        editable && !selected && 'hover:outline hover:outline-1 hover:outline-primary/50',
      )}
      onPointerDown={(e) => onPointerDown(e, 'move')}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (el.type === 'text') { const next = prompt('Texto:', el.text || ''); if (next != null) onUpdate({ text: next }); }
      }}
    >
      <ElementContent el={el} meta={meta} />

      {editable && selected && (
        <>
          <div onPointerDown={(e) => onPointerDown(e, 'resize')}
            className="label-handle absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-sm cursor-se-resize border border-white" />
          <div onPointerDown={(e) => e.stopPropagation()}
            className="label-actions absolute -top-8 left-0 flex items-center gap-0.5 bg-background border border-border rounded-md shadow-lg px-1 py-0.5 z-10">
            <button className="p-1 hover:bg-accent rounded" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicar"><Copy className="size-3" /></button>
            <button className="p-1 hover:bg-accent rounded" onClick={(e) => { e.stopPropagation(); onMoveZ('up'); }} title="Frente"><ArrowUp className="size-3" /></button>
            <button className="p-1 hover:bg-accent rounded" onClick={(e) => { e.stopPropagation(); onMoveZ('down'); }} title="Trás"><ArrowDown className="size-3" /></button>
            <button className="p-1 hover:bg-destructive/20 text-destructive rounded" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remover"><Trash2 className="size-3" /></button>
          </div>
        </>
      )}
    </div>
  );
}

function ElementContent({ el, meta }: { el: LabelElement; meta: LabelState['meta'] }) {
  if (el.type === 'text') {
    const negative = el.negative;
    return (
      <div className="w-full h-full leading-tight overflow-hidden break-words"
        style={{
          fontSize: `${el.fontSize || 12}pt`,
          fontFamily: el.fontFamily || 'system-ui, sans-serif',
          fontWeight: el.bold ? 800 : 400,
          fontStyle: el.italic ? 'italic' : 'normal',
          textDecoration: el.underline ? 'underline' : 'none',
          textAlign: el.align || 'left',
          background: negative ? '#000' : 'transparent',
          color: negative ? '#fff' : '#000',
          display: 'flex', alignItems: 'center',
          justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
          padding: negative ? '2px 4px' : 0,
        }}
      >
        <span className="w-full" style={{ textAlign: el.align || 'left' }}>
          {resolveVars(el.text, meta) || ' '}
        </span>
      </div>
    );
  }
  if (el.type === 'qr') {
    const size = Math.min(el.w, el.h) * MM_TO_PX;
    const value = resolveVars(el.payload, meta);
    return (
      <div className="w-full h-full flex items-center justify-center">
        {value ? <QRCodeCanvas value={value} size={size} level="M" includeMargin={false} /> : <EmptyBox label="QR" />}
      </div>
    );
  }
  if (el.type === 'datamatrix') return <BwipCode kind="datamatrix" value={resolveVars(el.payload, meta)} />;
  if (el.type === 'aztec') return <BwipCode kind="azteccode" value={resolveVars(el.payload, meta)} />;
  if (el.type === 'barcode') return <BarcodeSvg value={resolveVars(el.payload, meta)} fmt={el.barcodeFmt || 'CODE128'} />;
  if (el.type === 'line') {
    const style = el.lineStyle || 'solid';
    if (style === 'solid') return <div className="w-full h-full bg-black" />;
    // dashed/dotted usando gradient
    const dashSize = style === 'dashed' ? '6px' : '2px';
    const gapSize = style === 'dashed' ? '4px' : '3px';
    return (
      <div className="w-full h-full" style={{
        backgroundImage: `linear-gradient(to right, #000 ${dashSize}, transparent ${dashSize})`,
        backgroundSize: `calc(${dashSize} + ${gapSize}) 100%`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center',
        height: '100%',
      }} />
    );
  }
  if (el.type === 'rect') {
    const bw = (el.borderWidth ?? 0.4) * MM_TO_PX;
    const br = (el.borderRadius ?? 0) * MM_TO_PX;
    if (el.rectFill === 'filled') {
      return <div className="w-full h-full bg-black" style={{ borderRadius: `${br}px` }} />;
    }
    return <div className="w-full h-full" style={{ border: `${bw}px solid #000`, borderRadius: `${br}px` }} />;
  }
  if (el.type === 'image') {
    const br = (el.borderRadius ?? 0) * MM_TO_PX;
    return el.imageSrc
      ? <img src={el.imageSrc} alt="" className="w-full h-full object-contain" style={{ borderRadius: `${br}px` }} draggable={false} />
      : <EmptyBox label="Imagem" />;
  }
  return null;
}

function EmptyBox({ label }: { label: string }) {
  return <div className="text-[8pt] text-black/40 border border-dashed border-black/30 w-full h-full flex items-center justify-center">{label} (vazio)</div>;
}

function BarcodeSvg({ value, fmt }: { value: string; fmt: BarcodeFmt }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      if (!value) { ref.current.innerHTML = ''; return; }
      JsBarcode(ref.current, value, { format: fmt, displayValue: true, fontSize: 10, height: 40, margin: 0, width: 1.4 });
    } catch { /* ignore */ }
  }, [value, fmt]);
  if (!value) return <EmptyBox label="Barras" />;
  return <svg ref={ref} className="w-full h-full" preserveAspectRatio="none" />;
}

function BwipCode({ kind, value }: { kind: 'datamatrix' | 'azteccode'; value: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      bwipjs.toCanvas(ref.current, { bcid: kind, text: value, scale: 4, includetext: false });
    } catch { /* ignore */ }
  }, [kind, value]);
  if (!value) return <EmptyBox label={kind === 'datamatrix' ? 'DataMatrix' : 'Aztec'} />;
  return <canvas ref={ref} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />;
}

// ============================================================================
// Inspector
// ============================================================================

function ElementInspector({
  element, onUpdate, onClose,
}: { element: LabelElement; onUpdate: (p: Partial<LabelElement>) => void; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máx 2 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => onUpdate({ imageSrc: String(reader.result || '') });
    reader.readAsDataURL(f);
  };

  return (
    <Card className="print:hidden">
      <CardContent className="p-3 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 mr-2">
          <ElementIcon type={element.type} />
          <span className="text-xs font-semibold">{elementLabel(element)}</span>
        </div>

        <NumField label="X" value={element.x} onChange={(v) => onUpdate({ x: v })} />
        <NumField label="Y" value={element.y} onChange={(v) => onUpdate({ y: v })} />
        <NumField label="L" value={element.w} onChange={(v) => onUpdate({ w: v })} />
        <NumField label="A" value={element.h} onChange={(v) => onUpdate({ h: v })} />

        {element.type === 'text' && (
          <>
            <div className="flex flex-col gap-1 min-w-[220px] flex-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Texto (aceita {'{{variáveis}}'})</Label>
              <Input className="h-8" value={element.text || ''} onChange={(e) => onUpdate({ text: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1 min-w-[160px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Fonte</Label>
              <Select value={element.fontFamily || FONT_FAMILIES[0].value} onValueChange={(v) => onUpdate({ fontFamily: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((f) => (<SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <NumField label="pt" value={element.fontSize || 12} onChange={(v) => onUpdate({ fontSize: v })} />
            <div className="flex gap-1">
              <ToggleBtn active={!!element.bold} onClick={() => onUpdate({ bold: !element.bold })} title="Negrito"><Bold className="size-3.5" /></ToggleBtn>
              <ToggleBtn active={!!element.italic} onClick={() => onUpdate({ italic: !element.italic })} title="Itálico"><Italic className="size-3.5" /></ToggleBtn>
              <ToggleBtn active={!!element.underline} onClick={() => onUpdate({ underline: !element.underline })} title="Sublinhado"><Underline className="size-3.5" /></ToggleBtn>
              <ToggleBtn active={!!element.negative} onClick={() => onUpdate({ negative: !element.negative })} title="Texto negativo (fundo preto)"><Contrast className="size-3.5" /></ToggleBtn>
            </div>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <Button key={a} size="sm" variant={element.align === a ? 'default' : 'outline'} className="h-8 px-2 text-[10px] uppercase"
                  onClick={() => onUpdate({ align: a })}>{a[0]}</Button>
              ))}
            </div>
          </>
        )}

        {(element.type === 'qr' || element.type === 'barcode' || element.type === 'datamatrix' || element.type === 'aztec') && (
          <div className="flex flex-col gap-1 min-w-[240px] flex-1">
            <Label className="text-[10px] uppercase text-muted-foreground">
              Dado (aceita {'{{variáveis}}'} — resolvido ao imprimir)
            </Label>
            <Input className="h-8 font-mono text-xs" value={element.payload || ''} onChange={(e) => onUpdate({ payload: e.target.value })} placeholder="{{codigo}}" />
          </div>
        )}

        {element.type === 'barcode' && (
          <div className="flex flex-col gap-1 min-w-[130px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Formato</Label>
            <Select value={element.barcodeFmt || 'CODE128'} onValueChange={(v) => onUpdate({ barcodeFmt: v as BarcodeFmt })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['CODE128', 'CODE39', 'EAN13', 'EAN8', 'ITF14', 'UPC'] as BarcodeFmt[]).map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}

        {element.type === 'line' && (
          <div className="flex flex-col gap-1 min-w-[140px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Estilo da linha</Label>
            <Select value={element.lineStyle || 'solid'} onValueChange={(v) => onUpdate({ lineStyle: v as LineStyle })}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Sólida</SelectItem>
                <SelectItem value="dashed">Tracejada</SelectItem>
                <SelectItem value="dotted">Pontilhada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {element.type === 'rect' && (
          <>
            <div className="flex flex-col gap-1 min-w-[130px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Preenchimento</Label>
              <Select value={element.rectFill || 'outline'} onValueChange={(v) => onUpdate({ rectFill: v as RectFill })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outline">Somente borda</SelectItem>
                  <SelectItem value="filled">Preenchido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {element.rectFill !== 'filled' && (
              <NumField label="Borda (mm)" value={element.borderWidth ?? 0.4} onChange={(v) => onUpdate({ borderWidth: v })} />
            )}
            <NumField label="Raio (mm)" value={element.borderRadius ?? 0} onChange={(v) => onUpdate({ borderRadius: v })} />
          </>
        )}

        {element.type === 'image' && (
          <>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => fileRef.current?.click()}>
              <ImageIcon className="size-3.5" /> {element.imageSrc ? 'Trocar imagem' : 'Carregar imagem'}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            {element.imageSrc && (
              <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => onUpdate({ imageSrc: '' })}>
                Remover
              </Button>
            )}
            <NumField label="Raio (mm)" value={element.borderRadius ?? 0} onChange={(v) => onUpdate({ borderRadius: v })} />
          </>
        )}

        <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={onClose}>Fechar</Button>
      </CardContent>
    </Card>
  );
}

function ToggleBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <Button size="sm" variant={active ? 'default' : 'outline'} className="h-8 w-8 p-0" onClick={onClick} title={title}>
      {children}
    </Button>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1 w-20">
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Input type="number" step="0.5" className="h-8 font-mono text-xs" value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

// ============================================================================
// History Dialog
// ============================================================================

function HistoryDialog({
  open, onOpenChange, onRestore,
}: { open: boolean; onOpenChange: (v: boolean) => void; onRestore: (snap: unknown) => void }) {
  const [items, setItems] = useState<PrintHistoryEntry[]>([]);
  useEffect(() => { if (open) setItems(loadHistory()); }, [open]);
  const stats = useMemo(() => ({
    total: items.length,
    copies: items.reduce((s, i) => s + i.copies, 0),
    today: items.filter((i) => new Date(i.printedAt).toDateString() === new Date().toDateString()).length,
  }), [items]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="size-4 text-primary" /> Histórico de impressões</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          <StatMini label="Total" value={String(stats.total)} />
          <StatMini label="Cópias" value={String(stats.copies)} />
          <StatMini label="Hoje" value={String(stats.today)} />
        </div>
        <ScrollArea className="h-[420px] border border-border rounded-md">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground italic">Nenhuma impressão registrada ainda.</div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((h) => (
                <li key={h.id} className="p-3 hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{h.templateName}</span>
                        <Badge variant="secondary" className="text-[10px] font-mono">×{h.copies}</Badge>
                        <Badge variant="outline" className="text-[10px]">{h.method}</Badge>
                      </div>
                      {h.payload && <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{h.payload}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(h.printedAt).toLocaleString('pt-BR')}</p>
                    </div>
                    {h.snapshot != null && (
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onRestore(h.snapshot)}>Restaurar</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { clearHistory(); setItems([]); toast.success('Histórico limpo.'); }}>Limpar histórico</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-bold font-mono">{value}</div>
    </div>
  );
}

// ============================================================================
// Icons & labels
// ============================================================================

function ElementIcon({ type }: { type: ElementType }) {
  const Icon = type === 'text' ? Type
    : type === 'qr' ? QrCode
    : type === 'datamatrix' ? Grid3x3
    : type === 'aztec' ? Hexagon
    : type === 'barcode' ? BarcodeIcon
    : type === 'line' ? Minus
    : type === 'image' ? ImageIcon
    : Square;
  return <Icon className="size-3.5 text-muted-foreground shrink-0" />;
}

function elementLabel(el: LabelElement): string {
  if (el.type === 'text') return el.text || 'Texto';
  if (el.type === 'qr') return `QR ${el.payload ? '· ' + el.payload.slice(0, 20) : ''}`;
  if (el.type === 'datamatrix') return `DataMatrix ${el.payload ? '· ' + el.payload.slice(0, 16) : ''}`;
  if (el.type === 'aztec') return `Aztec ${el.payload ? '· ' + el.payload.slice(0, 16) : ''}`;
  if (el.type === 'barcode') return `Barras (${el.barcodeFmt || 'CODE128'})`;
  if (el.type === 'line') return `Linha (${el.lineStyle || 'solid'})`;
  if (el.type === 'image') return el.imageSrc ? 'Imagem' : 'Imagem (vazia)';
  return 'Retângulo';
}

// ============================================================================
// Print styles
// ============================================================================

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
        .exp-preview-stack { transform: none !important; gap: 0 !important; display: block !important; }
        .label-sheet {
          position: relative;
          page-break-after: always;
          border: 0 !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important;
        }
        .label-sheet:last-child { page-break-after: auto; }
        .label-handle, .label-actions { display: none !important; }
        .label-el { outline: none !important; }
      }
    `}</style>
  );
}

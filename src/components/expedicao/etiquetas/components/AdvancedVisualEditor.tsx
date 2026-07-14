// ============================================================================
// Etiquetas de Expedição — editor visual estilo BarTender/Canva.
// Estrutura: barra superior única + 3 colunas (Adicionar/Elementos | Canvas | Propriedades).
// Painel de propriedades único com abas Elemento | Variáveis | Presets.
// Preserva 100% do comportamento anterior (snap, réguas, ZPL, atalhos, impressão).
// ============================================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js/browser';
import {
  Printer, Tag, FileText, RotateCcw, History, Type, QrCode, Barcode as BarcodeIcon,
  Trash2, Copy, Minus, Square, ArrowUp, ArrowDown, Plus, Image as ImageIcon,
  Grid3x3, Hexagon, Bold, Italic, Underline, Contrast, Ruler as RulerIcon,
  Layers, Sparkles, MousePointerClick, Keyboard, Bookmark, MoreHorizontal,
  Eye, EyeOff, Lock, Unlock, HelpCircle, ZoomIn, ZoomOut, Maximize2, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { loadHistory, pushHistory, clearHistory, type PrintHistoryEntry, type BarcodeFmt } from '@/pages/expedicao/etiqueta-helpers';
import EtiquetaXmlDialog, { type LabelSizeKey } from '@/pages/expedicao/EtiquetaXmlDialog';
import type { EtiquetaXmlPatch } from '@/pages/expedicao/etiqueta-xml';
import { cn } from '@/lib/utils';

// ============================================================================
// Model
// ============================================================================

type PresetSize = '100x150' | '100x100' | '100x50' | 'custom';
type ElementType = 'text' | 'qr' | 'datamatrix' | 'aztec' | 'barcode' | 'line' | 'rect' | 'image';
type LineStyle = 'solid' | 'dashed' | 'dotted';
type RectFill = 'outline' | 'filled';
type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge';

interface LabelElement {
  id: string;
  type: ElementType;
  x: number; y: number; w: number; h: number;
  hidden?: boolean;
  locked?: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  negative?: boolean;
  align?: 'left' | 'center' | 'right';
  barcodeFmt?: BarcodeFmt;
  payload?: string;
  lineStyle?: LineStyle;
  rectFill?: RectFill;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  rectFillColor?: string;
  imageSrc?: string;
}

interface LabelState {
  name: string;
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
  name: 'Etiqueta de expedição',
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

const VARIABLE_KEYS = ['transportadora', 'nfNumero', 'volumeAtual', 'volumeTotal', 'destino', 'codigo'] as const;
function resolveVars(input: string | undefined, meta: LabelState['meta']): string {
  if (!input) return '';
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const v = (meta as Record<string, string>)[k];
    return v == null ? '' : String(v);
  });
}

// Insere texto no último input/textarea focado. Usado pelas chips da aba Variáveis.
function insertIntoLastFocused(text: string, fallback?: HTMLElement | null) {
  const el = (document.activeElement as HTMLElement) || fallback;
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + text + el.value.slice(end);
    // dispara React onChange
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set;
    setter?.call(el, next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    const pos = start + text.length;
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
    return true;
  }
  return false;
}

// ============================================================================
// Page
// ============================================================================

export default function AdvancedVisualEditor() {
  const [state, setState] = useState<LabelState>(() => loadState());
  const [xmlOpen, setXmlOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0);
  const [presets, setPresets] = useState<SavedPreset[]>(() => loadPresets());
  const [rightTab, setRightTab] = useState<'element' | 'variables' | 'presets'>('element');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

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
  const reorderElements = useCallback((fromId: string, toId: string) => {
    setState((s) => {
      const from = s.elements.findIndex((e) => e.id === fromId);
      const to = s.elements.findIndex((e) => e.id === toId);
      if (from < 0 || to < 0 || from === to) return s;
      const next = [...s.elements];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
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
    setRightTab('element');
    return base.id;
  }, []);

  const triggerImageUpload = useCallback(() => { imageInputRef.current?.click(); }, []);
  const onImageUploadFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máx 2 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const id = uid();
      const img = new Image();
      img.onload = () => {
        const ratio = img.height / img.width || 0.6;
        const w = Math.min(40, 40);
        const h = +(w * ratio).toFixed(1);
        setState((s) => ({ ...s, elements: [...s.elements, { id, type: 'image', x: 5, y: 5, w, h, imageSrc: src, borderRadius: 0 }] }));
        setSelectedId(id); setRightTab('element');
      };
      img.onerror = () => {
        setState((s) => ({ ...s, elements: [...s.elements, { id, type: 'image', x: 5, y: 5, w: 30, h: 20, imageSrc: src, borderRadius: 0 }] }));
        setSelectedId(id); setRightTab('element');
      };
      img.src = src;
    };
    reader.readAsDataURL(f);
  }, []);

  // Atalhos globais: Del remove, Ctrl+B negrito.
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

  // Rastreia último input/textarea focado (para chips de variáveis).
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
        lastFocusedRef.current = t;
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

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
    toast.success('Dados do XML aplicados.');
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

  function handleSaveLayout() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    toast.success('Layout salvo.');
  }

  function handlePrint() {
    window.print();
    pushHistory({
      templateId: 'editor',
      templateName: state.name || `Etiqueta ${state.widthMm}×${state.heightMm}mm`,
      copies: state.copias,
      payload: state.meta.nfNumero || state.meta.codigo || '',
      method: 'browser',
      snapshot: state,
    });
  }

  const selected = state.elements.find((e) => e.id === selectedId) || null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-64px)] min-h-0 print:h-auto print:block">
        {/* ============ BARRA SUPERIOR ÚNICA ============ */}
        <TopBar
          state={state}
          onRename={(name) => patch({ name })}
          onSave={handleSaveLayout}
          onPrint={handlePrint}
          onImportXml={() => setXmlOpen(true)}
          onReset={reset}
          onHistory={() => setHistoryOpen(true)}
        />

        {/* ============ 3 COLUNAS ============ */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-0 print:block">
          {/* -------- COLUNA ESQUERDA -------- */}
          <aside className="print:hidden border-r border-border/60 bg-card/40 flex flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-4">
                <AddElementPanel onAdd={addElement} onUploadImage={triggerImageUpload} />
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageUploadFile} />
                <Separator />
                <LayersPanel
                  elements={state.elements}
                  selectedId={selectedId}
                  onSelect={(id) => { setSelectedId(id); setRightTab('element'); }}
                  onUpdate={updateElement}
                  onRemove={removeElement}
                  onDuplicate={duplicateElement}
                  onReorder={reorderElements}
                />
              </div>
            </ScrollArea>
          </aside>

          {/* -------- CENTRO: CANVAS -------- */}
          <main className="flex flex-col min-h-0 bg-muted/20 print:bg-transparent print:block">
            <PreviewWorkbench
              widthMm={state.widthMm}
              heightMm={state.heightMm}
              zoom={zoom}
              onZoomChange={setZoom}
              selected={selected}
            >
              <LabelCanvas
                editable
                widthMm={state.widthMm}
                heightMm={state.heightMm}
                elements={state.elements}
                meta={state.meta}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); if (id) setRightTab('element'); }}
                onUpdate={updateElement}
                onRemove={removeElement}
                onDuplicate={duplicateElement}
                onMoveZ={moveElementZ}
              />
            </PreviewWorkbench>
          </main>

          {/* -------- COLUNA DIREITA -------- */}
          <aside className="print:hidden border-l border-border/60 bg-card/40 flex flex-col min-h-0">
            <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as typeof rightTab)} className="flex flex-col h-full min-h-0">
              <TabsList className="grid grid-cols-3 mx-3 mt-3 h-9 shrink-0">
                <TabsTrigger value="element" className="text-xs">Elemento</TabsTrigger>
                <TabsTrigger value="variables" className="text-xs">Variáveis</TabsTrigger>
                <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
              </TabsList>

              <TabsContent value="element" className="flex-1 min-h-0 mt-2 mx-0">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    {selected ? (
                      <ElementInspector
                        element={selected}
                        onUpdate={(p) => updateElement(selected.id, p)}
                        pageSize={state.pageSize}
                        widthMm={state.widthMm}
                        heightMm={state.heightMm}
                        onChangePreset={changePreset}
                        onPatch={patch}
                      />
                    ) : (
                      <PageInspector
                        pageSize={state.pageSize}
                        widthMm={state.widthMm}
                        heightMm={state.heightMm}
                        onChangePreset={changePreset}
                        onPatch={patch}
                      />
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="variables" className="flex-1 min-h-0 mt-2 mx-0">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    <VariablesTab lastFocusedRef={lastFocusedRef} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="presets" className="flex-1 min-h-0 mt-2 mx-0">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    <PresetsTab
                      presets={presets}
                      onSave={handleSavePreset}
                      onLoad={handleLoadPreset}
                      onDelete={handleDeletePreset}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </aside>
        </div>

        <EtiquetaXmlDialog open={xmlOpen} onOpenChange={setXmlOpen} onApply={applyXmlPatch} />
        <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} onRestore={(snap) => {
          if (snap && typeof snap === 'object') setState(snap as LabelState);
          setHistoryOpen(false);
        }} />
        <PrintStyles wMm={state.widthMm} hMm={state.heightMm} />
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// TopBar
// ============================================================================

function TopBar({
  state, onRename, onSave, onPrint, onImportXml, onReset, onHistory,
}: {
  state: LabelState;
  onRename: (n: string) => void;
  onSave: () => void;
  onPrint: () => void;
  onImportXml: () => void;
  onReset: () => void;
  onHistory: () => void;
}) {
  const [draft, setDraft] = useState(state.name);
  useEffect(() => setDraft(state.name), [state.name]);

  return (
    <div className="print:hidden shrink-0 h-14 border-b border-border/60 bg-card/60 backdrop-blur flex items-center gap-3 px-4">
      <div className="flex items-center gap-2 shrink-0">
        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
          <Tag className="size-4" />
        </div>
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft.trim() && onRename(draft.trim())}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
        className="h-8 max-w-[280px] font-medium text-sm border-transparent hover:border-border focus-visible:border-border bg-transparent"
        placeholder="Nome da etiqueta"
        aria-label="Nome da etiqueta"
      />
      <Badge variant="secondary" className="font-mono text-[10px] gap-1 h-6">
        <RulerIcon className="size-3" /> {state.widthMm}×{state.heightMm} mm
      </Badge>
      <Badge variant="outline" className="font-mono text-[10px] gap-1 h-6 text-muted-foreground">
        <Layers className="size-3" /> {state.elements.length}
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSave} className="gap-1.5">
          <Bookmark className="size-4" /> Salvar layout
        </Button>
        <Button size="sm" onClick={onPrint} className="gap-1.5 shadow-sm">
          <Printer className="size-4" /> Imprimir
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9" aria-label="Mais ações">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onImportXml}>
              <FileText className="size-4 mr-2" /> Importar XML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHistory}>
              <History className="size-4 mr-2" /> Histórico
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReset} className="text-destructive focus:text-destructive">
              <RotateCcw className="size-4 mr-2" /> Reiniciar etiqueta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ============================================================================
// Painel esquerdo — Adicionar elemento
// ============================================================================

function AddElementPanel({ onAdd, onUploadImage }: { onAdd: (t: ElementType) => void; onUploadImage: () => void }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
        <Plus className="size-3.5 text-primary/70" /> Adicionar elemento
      </div>

      <div className="space-y-2.5">
        <SubGroup label="Texto">
          <AddTile icon={<Type className="size-4" />} label="Texto" onClick={() => onAdd('text')} />
        </SubGroup>

        <SubGroup label="Códigos">
          <div className="grid grid-cols-2 gap-1.5">
            <AddTile icon={<QrCode className="size-4" />} label="QR" onClick={() => onAdd('qr')} />
            <AddTile icon={<BarcodeIcon className="size-4" />} label="Barras" onClick={() => onAdd('barcode')} />
            <AddTile icon={<Grid3x3 className="size-4" />} label="DataMatrix" onClick={() => onAdd('datamatrix')} />
            <AddTile icon={<Hexagon className="size-4" />} label="Aztec" onClick={() => onAdd('aztec')} />
          </div>
        </SubGroup>

        <SubGroup label="Formas">
          <div className="grid grid-cols-2 gap-1.5">
            <AddTile icon={<Minus className="size-4" />} label="Linha" onClick={() => onAdd('line')} />
            <AddTile icon={<Square className="size-4" />} label="Retângulo" onClick={() => onAdd('rect')} />
          </div>
        </SubGroup>

        <SubGroup label="Mídia">
          <AddTile icon={<ImageIcon className="size-4" />} label="Imagem" onClick={onUploadImage} />
        </SubGroup>
      </div>
    </section>
  );
}

function SubGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function AddTile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex flex-col items-center justify-center gap-1 rounded-md border border-border/70 bg-background/60 px-2 py-3 text-[11px] font-medium hover:bg-accent hover:border-primary/40 hover:text-foreground transition-all active:scale-[0.98]"
      aria-label={`Adicionar ${label}`}
    >
      <span className="text-primary/80">{icon}</span>
      {label}
    </button>
  );
}

// ============================================================================
// Painel esquerdo — Layers (elementos)
// ============================================================================

function LayersPanel({
  elements, selectedId, onSelect, onUpdate, onRemove, onDuplicate, onReorder,
}: {
  elements: LabelElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, p: Partial<LabelElement>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  // Renderiza em ordem visual: topo do painel = topo do z-index (último no array).
  const ordered = [...elements].reverse();

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
          <Layers className="size-3.5 text-primary/70" /> Elementos
          <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-1">{elements.length}</Badge>
        </div>
      </div>

      {elements.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic text-center py-6 border border-dashed border-border/50 rounded-md">
          <MousePointerClick className="size-4 mx-auto mb-1 opacity-50" />
          Nenhum elemento — adicione acima.
        </div>
      ) : (
        <ul className="rounded-md border border-border/60 bg-background/40 overflow-hidden">
          {ordered.map((el) => {
            const active = selectedId === el.id;
            return (
              <li
                key={el.id}
                draggable
                onDragStart={() => setDragId(el.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId && dragId !== el.id) onReorder(dragId, el.id);
                  setDragId(null);
                }}
                onDragEnd={() => setDragId(null)}
                className={cn(
                  'group flex items-center gap-1 px-1.5 py-1.5 text-xs border-b border-border/50 last:border-b-0 transition-colors',
                  active ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-accent/40',
                  dragId === el.id && 'opacity-50',
                )}
              >
                <GripVertical className="size-3 text-muted-foreground/50 shrink-0 cursor-grab" />
                <button
                  type="button"
                  onClick={() => onSelect(el.id)}
                  className="flex-1 flex items-center gap-1.5 min-w-0 text-left"
                >
                  <ElementIcon type={el.type} />
                  <span className={cn('truncate', el.hidden && 'opacity-50 line-through')}>{elementLabel(el)}</span>
                </button>

                <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <LayerAction
                    label={el.hidden ? 'Mostrar' : 'Ocultar'}
                    onClick={() => onUpdate(el.id, { hidden: !el.hidden })}
                  >
                    {el.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </LayerAction>
                  <LayerAction
                    label={el.locked ? 'Destravar' : 'Travar'}
                    onClick={() => onUpdate(el.id, { locked: !el.locked })}
                  >
                    {el.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
                  </LayerAction>
                  <LayerAction label="Duplicar" onClick={() => onDuplicate(el.id)}>
                    <Copy className="size-3" />
                  </LayerAction>
                  <LayerAction label="Excluir" destructive onClick={() => onRemove(el.id)}>
                    <Trash2 className="size-3" />
                  </LayerAction>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function LayerAction({
  label, onClick, children, destructive,
}: { label: string; onClick: () => void; children: React.ReactNode; destructive?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          aria-label={label}
          className={cn(
            'p-1 rounded transition-colors text-muted-foreground',
            destructive ? 'hover:bg-destructive/15 hover:text-destructive' : 'hover:bg-accent hover:text-foreground',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[10px]">{label}</TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Painel direito — Variáveis
// ============================================================================

function VariablesTab({ lastFocusedRef }: { lastFocusedRef: React.MutableRefObject<HTMLElement | null> }) {
  const insert = (key: string) => {
    const ok = insertIntoLastFocused(`{{${key}}}`, lastFocusedRef.current);
    if (!ok) {
      navigator.clipboard?.writeText(`{{${key}}}`);
      toast.success(`{{${key}}} copiado — cole em um campo.`);
    }
  };
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-muted-foreground">
        Clique numa variável para inserir no campo em foco.
      </div>
      <div className="flex flex-wrap gap-1.5">
        {VARIABLE_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(k)}
            className="px-2 py-1 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 font-mono text-[11px] text-primary transition-colors"
          >
            {`{{${k}}}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Painel direito — Presets
// ============================================================================

function PresetsTab({
  presets, onSave, onLoad, onDelete,
}: {
  presets: SavedPreset[];
  onSave: () => void;
  onLoad: (p: SavedPreset) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Button size="sm" variant="secondary" className="w-full gap-1.5" onClick={onSave}>
        <Plus className="size-3.5" /> Salvar preset
      </Button>
      {presets.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic text-center py-6 border border-dashed border-border/50 rounded-md">
          Nenhum preset salvo ainda.
        </div>
      ) : (
        <ul className="rounded-md border border-border/60 bg-background/40 divide-y divide-border/60">
          {presets.map((p) => (
            <li key={p.id} className="flex items-center gap-1 px-2 py-2 hover:bg-accent/40 transition-colors">
              <button type="button" onClick={() => onLoad(p)} className="flex-1 min-w-0 text-left">
                <div className="text-xs font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {p.snapshot.widthMm}×{p.snapshot.heightMm}mm · {p.snapshot.elements.length} elem.
                </div>
              </button>
              <LayerAction label="Excluir preset" destructive onClick={() => onDelete(p.id)}>
                <Trash2 className="size-3" />
              </LayerAction>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Painel direito — Inspector (Elemento)
// ============================================================================

function PageInspector({
  pageSize, widthMm, heightMm, onChangePreset, onPatch,
}: {
  pageSize: PresetSize; widthMm: number; heightMm: number;
  onChangePreset: (p: PresetSize) => void;
  onPatch: (p: Partial<LabelState>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
        <MousePointerClick className="size-4 text-primary/70 shrink-0" />
        Selecione um elemento na etiqueta.
      </div>
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">Tamanho da etiqueta</div>
        <Select value={pageSize} onValueChange={(v) => onChangePreset(v as PresetSize)}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(PRESETS) as [Exclude<PresetSize, 'custom'>, typeof PRESETS['100x150']][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
            <SelectItem value="custom">Personalizado…</SelectItem>
          </SelectContent>
        </Select>
        {pageSize === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Largura (mm)</Label>
              <DimensionInput value={widthMm} min={20} max={300} onCommit={(v) => onPatch({ widthMm: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Altura (mm)</Label>
              <DimensionInput value={heightMm} min={20} max={400} onCommit={(v) => onPatch({ heightMm: v })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ElementInspector({
  element, onUpdate, pageSize, widthMm, heightMm, onChangePreset, onPatch,
}: {
  element: LabelElement;
  onUpdate: (p: Partial<LabelElement>) => void;
  pageSize: PresetSize; widthMm: number; heightMm: number;
  onChangePreset: (p: PresetSize) => void;
  onPatch: (p: Partial<LabelState>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máx 2 MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => onUpdate({ imageSrc: String(reader.result || '') });
    reader.readAsDataURL(f);
  };

  return (
    <div className="space-y-4">
      {/* Header do elemento */}
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
          <ElementIcon type={element.type} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate">{elementLabel(element)}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{typeLabel(element.type)}</div>
        </div>
      </div>

      {/* Posição / dimensões */}
      <InspectorSection title="Posição e tamanho (mm)">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="X" value={element.x} onChange={(v) => onUpdate({ x: v })} />
          <NumField label="Y" value={element.y} onChange={(v) => onUpdate({ y: v })} />
          <NumField label="Largura" value={element.w} onChange={(v) => onUpdate({ w: v })} />
          <NumField label="Altura" value={element.h} onChange={(v) => onUpdate({ h: v })} />
        </div>
      </InspectorSection>

      {/* Texto */}
      {element.type === 'text' && (
        <>
          <InspectorSection title="Conteúdo">
            <Input
              placeholder="Texto (aceita {{variáveis}})"
              value={element.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="h-8 text-xs"
            />
          </InspectorSection>
          <InspectorSection title="Tipografia">
            <Select value={element.fontFamily || FONT_FAMILIES[0].value} onValueChange={(v) => onUpdate({ fontFamily: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (<SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NumField label="Tamanho (pt)" value={element.fontSize || 12} onChange={(v) => onUpdate({ fontSize: v })} />
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cor</Label>
                <input type="color" value={element.fontColor || '#000000'} onChange={(e) => onUpdate({ fontColor: e.target.value })}
                  className="h-8 w-full rounded-md border border-border bg-background cursor-pointer p-0.5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ToggleBtn active={!!element.bold} onClick={() => onUpdate({ bold: !element.bold })} title="Negrito (Ctrl+B)"><Bold className="size-3.5" /></ToggleBtn>
              <ToggleBtn active={!!element.italic} onClick={() => onUpdate({ italic: !element.italic })} title="Itálico"><Italic className="size-3.5" /></ToggleBtn>
              <ToggleBtn active={!!element.underline} onClick={() => onUpdate({ underline: !element.underline })} title="Sublinhado"><Underline className="size-3.5" /></ToggleBtn>
              <ToggleBtn active={!!element.negative} onClick={() => onUpdate({ negative: !element.negative })} title="Negativo"><Contrast className="size-3.5" /></ToggleBtn>
              <div className="w-px h-5 bg-border mx-1" />
              <ToggleBtn active={element.align === 'left'} onClick={() => onUpdate({ align: 'left' })} title="Alinhar à esquerda"><span className="text-[10px]">L</span></ToggleBtn>
              <ToggleBtn active={element.align === 'center'} onClick={() => onUpdate({ align: 'center' })} title="Centralizar"><span className="text-[10px]">C</span></ToggleBtn>
              <ToggleBtn active={element.align === 'right'} onClick={() => onUpdate({ align: 'right' })} title="Alinhar à direita"><span className="text-[10px]">R</span></ToggleBtn>
            </div>
          </InspectorSection>
        </>
      )}

      {/* Códigos */}
      {(element.type === 'qr' || element.type === 'barcode' || element.type === 'datamatrix' || element.type === 'aztec') && (
        <InspectorSection title="Dado">
          <Input
            placeholder="{{codigo}}"
            value={element.payload || ''}
            onChange={(e) => onUpdate({ payload: e.target.value })}
            className="h-8 font-mono text-xs"
          />
          {element.type === 'barcode' && (
            <div className="mt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Formato</Label>
              <Select value={element.barcodeFmt || 'CODE128'} onValueChange={(v) => onUpdate({ barcodeFmt: v as BarcodeFmt })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['CODE128', 'CODE39', 'EAN13', 'EAN8', 'ITF14', 'UPC'] as BarcodeFmt[]).map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
        </InspectorSection>
      )}

      {/* Linha */}
      {element.type === 'line' && (
        <InspectorSection title="Estilo da linha">
          <Select value={element.lineStyle || 'solid'} onValueChange={(v) => onUpdate({ lineStyle: v as LineStyle })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Sólida</SelectItem>
              <SelectItem value="dashed">Tracejada</SelectItem>
              <SelectItem value="dotted">Pontilhada</SelectItem>
            </SelectContent>
          </Select>
        </InspectorSection>
      )}

      {/* Retângulo */}
      {element.type === 'rect' && (
        <InspectorSection title="Retângulo">
          <Select value={element.rectFill || 'outline'} onValueChange={(v) => onUpdate({ rectFill: v as RectFill })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="outline">Somente borda</SelectItem>
              <SelectItem value="filled">Preenchido</SelectItem>
            </SelectContent>
          </Select>
          {element.rectFill === 'filled' ? (
            <div className="mt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cor</Label>
              <input type="color" value={element.rectFillColor || '#000000'} onChange={(e) => onUpdate({ rectFillColor: e.target.value })}
                className="h-8 w-full rounded-md border border-border bg-background cursor-pointer p-0.5" />
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              <Select value={element.borderStyle || 'solid'} onValueChange={(v) => onUpdate({ borderStyle: v as BorderStyle })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólida</SelectItem>
                  <SelectItem value="dashed">Tracejada</SelectItem>
                  <SelectItem value="dotted">Pontilhada</SelectItem>
                  <SelectItem value="double">Dupla</SelectItem>
                  <SelectItem value="groove">Baixo-relevo</SelectItem>
                  <SelectItem value="ridge">Alto-relevo</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <NumField label="Espessura (mm)" value={element.borderWidth ?? 0.4} onChange={(v) => onUpdate({ borderWidth: v })} />
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cor</Label>
                  <input type="color" value={element.borderColor || '#000000'} onChange={(e) => onUpdate({ borderColor: e.target.value })}
                    className="h-8 w-full rounded-md border border-border bg-background cursor-pointer p-0.5" />
                </div>
              </div>
            </div>
          )}
          <div className="mt-2">
            <NumField label="Raio (mm)" value={element.borderRadius ?? 0} onChange={(v) => onUpdate({ borderRadius: v })} />
          </div>
        </InspectorSection>
      )}

      {/* Imagem */}
      {element.type === 'image' && (
        <InspectorSection title="Imagem">
          <Button size="sm" variant="outline" className="w-full h-8 gap-1.5" onClick={() => fileRef.current?.click()}>
            <ImageIcon className="size-3.5" /> {element.imageSrc ? 'Trocar imagem' : 'Carregar imagem'}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          {element.imageSrc && (
            <Button size="sm" variant="ghost" className="w-full h-8 text-xs text-destructive hover:bg-destructive/10 mt-1" onClick={() => onUpdate({ imageSrc: '' })}>
              Remover imagem
            </Button>
          )}
          <div className="mt-2">
            <NumField label="Raio (mm)" value={element.borderRadius ?? 0} onChange={(v) => onUpdate({ borderRadius: v })} />
          </div>
        </InspectorSection>
      )}

      <Separator />

      <InspectorSection title="Página">
        <Select value={pageSize} onValueChange={(v) => onChangePreset(v as PresetSize)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(PRESETS) as [Exclude<PresetSize, 'custom'>, typeof PRESETS['100x150']][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
            <SelectItem value="custom">Personalizado…</SelectItem>
          </SelectContent>
        </Select>
        {pageSize === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">L (mm)</Label>
              <DimensionInput value={widthMm} min={20} max={300} onCommit={(v) => onPatch({ widthMm: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">A (mm)</Label>
              <DimensionInput value={heightMm} min={20} max={400} onCommit={(v) => onPatch({ heightMm: v })} />
            </div>
          </div>
        )}
      </InspectorSection>
    </div>
  );
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </section>
  );
}

function typeLabel(t: ElementType): string {
  return t === 'text' ? 'Texto'
    : t === 'qr' ? 'QR Code'
    : t === 'datamatrix' ? 'DataMatrix'
    : t === 'aztec' ? 'Aztec'
    : t === 'barcode' ? 'Código de barras'
    : t === 'line' ? 'Linha'
    : t === 'image' ? 'Imagem'
    : 'Retângulo';
}

// ============================================================================
// Preview workbench com réguas + zoom flutuante
// ============================================================================

const RULER_SIZE = 22;

function PreviewWorkbench({
  widthMm, heightMm, zoom, onZoomChange, selected, children,
}: {
  widthMm: number; heightMm: number; zoom: number;
  onZoomChange: (v: number) => void;
  selected: LabelElement | null;
  children: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [autoFit, setAutoFit] = useState(1);
  const [spaceDown, setSpaceDown] = useState(false);

  const naturalW = widthMm * MM_TO_PX;
  const naturalH = heightMm * MM_TO_PX;

  useLayoutEffect(() => {
    const el = boxRef.current; if (!el) return;
    const recalc = () => {
      const pad = 32;
      const availW = Math.max(0, el.clientWidth - pad - RULER_SIZE);
      const availH = Math.max(0, el.clientHeight - pad - RULER_SIZE);
      if (availW <= 0 || availH <= 0) return;
      setAutoFit(Math.min(availW / naturalW, availH / naturalH, 1.8));
    };
    recalc();
    const ro = new ResizeObserver(recalc); ro.observe(el);
    return () => ro.disconnect();
  }, [naturalW, naturalH]);

  const fit = zoom > 0 ? zoom : autoFit;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        setSpaceDown(true);
      }
    };
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceDown(false); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const handler = (e: WheelEvent) => {
      if (spaceDown) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        return;
      }
      e.preventDefault();
      const step = e.altKey ? 0.02 : e.ctrlKey || e.metaKey ? 0.04 : 0.08;
      const dir = e.deltaY > 0 ? -1 : 1;
      const base = zoom > 0 ? zoom : autoFit;
      const next = Math.max(0.2, Math.min(4, base + dir * step));
      onZoomChange(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom, autoFit, onZoomChange, spaceDown]);

  const scaledW = naturalW * fit;
  const scaledH = naturalH * fit;

  const zoomIn = () => onZoomChange(Math.min(4, fit + 0.1));
  const zoomOut = () => onZoomChange(Math.max(0.2, fit - 0.1));

  return (
    <div
      ref={boxRef}
      className={cn(
        'exp-preview-box relative overflow-auto flex-1 min-h-0',
        spaceDown && 'cursor-grab',
      )}
      style={{
        backgroundColor: 'hsl(var(--muted) / 0.55)',
        backgroundImage:
          'linear-gradient(45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
      }}
    >
      {/* Réguas */}
      <div
        className="pointer-events-none sticky top-0 left-0 z-20 print:hidden"
        style={{ height: RULER_SIZE, width: '100%' }}
      >
        <div className="absolute" style={{ left: RULER_SIZE, top: 0 }}>
          <Ruler orientation="horizontal" lengthMm={widthMm} pxPerMm={MM_TO_PX * fit}
            highlight={selected ? { start: selected.x, end: selected.x + selected.w } : null} />
        </div>
        <div className="absolute" style={{ left: 0, top: 0 }}>
          <Ruler orientation="vertical" lengthMm={heightMm} pxPerMm={MM_TO_PX * fit}
            highlight={selected ? { start: selected.y, end: selected.y + selected.h } : null} />
        </div>
        <div className="absolute bg-background border-b border-r border-border" style={{ left: 0, top: 0, width: RULER_SIZE, height: RULER_SIZE }} />
      </div>

      <div
        ref={stageRef}
        className="exp-preview-stack relative"
        style={{
          paddingLeft: RULER_SIZE + 8,
          paddingTop: 8,
          paddingRight: 8,
          paddingBottom: 8,
          width: `max(100%, ${scaledW + RULER_SIZE + 16}px)`,
          minHeight: `${scaledH + 16}px`,
        }}
      >
        <div
          style={{
            width: naturalW, height: naturalH,
            transform: `scale(${fit})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>

      {/* Controle de zoom flutuante + ajuda */}
      <div className="print:hidden sticky bottom-3 left-0 flex justify-center pointer-events-none z-30" style={{ marginTop: -46 }}>
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border bg-card/95 backdrop-blur shadow-lg px-1.5 py-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={zoomOut} aria-label="Diminuir zoom">
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="min-w-[42px] text-center font-mono text-[11px] font-medium tabular-nums">{Math.round(fit * 100)}%</span>
          <Button variant="ghost" size="icon" className="size-7" onClick={zoomIn} aria-label="Aumentar zoom">
            <ZoomIn className="size-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => onZoomChange(0)} aria-label="Ajustar à tela">
                <Maximize2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">Ajustar à tela</TooltipContent>
          </Tooltip>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" aria-label="Atalhos de teclado">
                <HelpCircle className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-72 p-3">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Keyboard className="size-3.5 text-primary" /> Atalhos
              </div>
              <div className="space-y-1.5 text-[11px]">
                <ShortcutRow keys={['Scroll']} desc="Zoom" />
                <ShortcutRow keys={['Space', '+', 'Scroll']} desc="Mover / pan" />
                <ShortcutRow keys={['Del']} desc="Excluir elemento" />
                <ShortcutRow keys={['Ctrl', '+', 'B']} desc="Negrito" />
                <ShortcutRow keys={['Alt']} desc="Arrastar sem snap" />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        {keys.map((k, i) => k === '+' ? (
          <span key={i} className="opacity-50">+</span>
        ) : (
          <Kbd key={i}>{k}</Kbd>
        ))}
      </div>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Régua
// ---------------------------------------------------------------------------
function Ruler({
  orientation, lengthMm, highlight, pxPerMm,
}: {
  orientation: 'horizontal' | 'vertical';
  lengthMm: number;
  highlight: { start: number; end: number } | null;
  pxPerMm?: number;
}) {
  const px = pxPerMm ?? MM_TO_PX;
  const lengthPx = lengthMm * px;
  const isH = orientation === 'horizontal';
  const marks: JSX.Element[] = [];
  const labelStep = px < 1.2 ? 50 : px < 2.4 ? 20 : 10;
  for (let mm = 0; mm <= Math.ceil(lengthMm); mm++) {
    const pos = mm * px;
    let height = 3;
    if (mm % labelStep === 0) height = 11;
    else if (mm % (labelStep / 2) === 0) height = 7;
    marks.push(
      <div key={mm}
        className="absolute bg-foreground/60"
        style={isH
          ? { left: pos, top: RULER_SIZE - height, width: 1, height }
          : { top: pos, left: RULER_SIZE - height, height: 1, width: height }}
      />
    );
    if (mm % labelStep === 0 && mm > 0) {
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
    ? { position: 'relative', width: lengthPx, height: RULER_SIZE, background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))' }
    : { position: 'relative', height: lengthPx, width: RULER_SIZE, background: 'hsl(var(--background))', borderRight: '1px solid hsl(var(--border))' };

  return (
    <div style={style} className="print:hidden">
      {marks}
      {highlight && (
        <div
          className="absolute bg-primary/40"
          style={isH
            ? { left: highlight.start * px, top: 0, width: (highlight.end - highlight.start) * px, height: RULER_SIZE }
            : { top: highlight.start * px, left: 0, height: (highlight.end - highlight.start) * px, width: RULER_SIZE }}
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
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

  const startDrag = (e: React.PointerEvent, el: LabelElement, mode: 'move' | 'resize') => {
    if (!editable) return;
    if (el.locked) { e.stopPropagation(); onSelect(el.id); return; }
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

    const others = elements.filter((o) => o.id !== el.id && !o.hidden);
    const xTargetsBase = [0, widthMm / 2, widthMm, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
    const yTargetsBase = [0, heightMm / 2, heightMm, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];

    const onMove = (ev: PointerEvent) => {
      const dxMm = (ev.clientX - startX) / scaleX / MM_TO_PX;
      const dyMm = (ev.clientY - startY) / scaleY / MM_TO_PX;
      const snapEnabled = !ev.altKey;
      const tol = 1.2;

      if (mode === 'move') {
        let nx = Math.max(0, Math.min(widthMm - origin.w, origin.x + dxMm));
        let ny = Math.max(0, Math.min(heightMm - origin.h, origin.y + dyMm));
        const activeV: number[] = [];
        const activeH: number[] = [];
        if (snapEnabled) {
          const xCands = [nx, nx + origin.w / 2, nx + origin.w];
          for (let i = 0; i < xCands.length; i++) {
            for (const t of xTargetsBase) {
              if (Math.abs(xCands[i] - t) <= tol) {
                nx = t - (i === 0 ? 0 : i === 1 ? origin.w / 2 : origin.w);
                activeV.push(t);
                break;
              }
            }
          }
          const yCands = [ny, ny + origin.h / 2, ny + origin.h];
          for (let i = 0; i < yCands.length; i++) {
            for (const t of yTargetsBase) {
              if (Math.abs(yCands[i] - t) <= tol) {
                ny = t - (i === 0 ? 0 : i === 1 ? origin.h / 2 : origin.h);
                activeH.push(t);
                break;
              }
            }
          }
          nx = Math.max(0, Math.min(widthMm - origin.w, nx));
          ny = Math.max(0, Math.min(heightMm - origin.h, ny));
        }
        setGuides({ v: activeV, h: activeH });
        onUpdate(el.id, { x: +nx.toFixed(2), y: +ny.toFixed(2) });
      } else {
        let nw = Math.max(4, Math.min(widthMm - origin.x, origin.w + dxMm));
        let nh = Math.max(2, Math.min(heightMm - origin.y, origin.h + dyMm));
        const activeV: number[] = [];
        const activeH: number[] = [];
        if (snapEnabled) {
          for (const t of xTargetsBase) {
            if (Math.abs(origin.x + nw - t) <= tol) { nw = t - origin.x; activeV.push(t); break; }
          }
          for (const t of yTargetsBase) {
            if (Math.abs(origin.y + nh - t) <= tol) { nh = t - origin.y; activeH.push(t); break; }
          }
        }
        setGuides({ v: activeV, h: activeH });
        onUpdate(el.id, { w: +nw.toFixed(2), h: +nh.toFixed(2) });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGuides({ v: [], h: [] });
    };
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
      {elements.filter((e) => !e.hidden).map((el) => (
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

      {editable && (guides.v.length > 0 || guides.h.length > 0) && (
        <div className="pointer-events-none absolute inset-0 print:hidden">
          {guides.v.map((mm, i) => (
            <div key={`v-${i}-${mm}`} className="absolute top-0 bottom-0 w-px bg-fuchsia-500"
              style={{ left: `${mm * MM_TO_PX}px` }} />
          ))}
          {guides.h.map((mm, i) => (
            <div key={`h-${i}-${mm}`} className="absolute left-0 right-0 h-px bg-fuchsia-500"
              style={{ top: `${mm * MM_TO_PX}px` }} />
          ))}
        </div>
      )}
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
  const PURPLE = '#8B3DFF';
  return (
    <div
      style={style}
      className={cn('label-el group',
        editable && !el.locked && 'cursor-move',
        editable && el.locked && 'cursor-not-allowed',
        editable && !selected && !el.locked && 'hover:[outline-style:dashed] hover:[outline-width:1px] hover:[outline-color:#8B3DFF] hover:[outline-offset:2px]',
      )}
      onPointerDown={(e) => onPointerDown(e, 'move')}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (el.locked) return;
        if (el.type === 'text') { const next = prompt('Texto:', el.text || ''); if (next != null) onUpdate({ text: next }); }
      }}
    >
      <ElementContent el={el} meta={meta} />

      {editable && selected && !el.locked && (
        <>
          <div
            className="pointer-events-none absolute -inset-px z-[5]"
            style={{
              border: `1.5px solid ${PURPLE}`,
              boxShadow: `0 0 0 1px rgba(255,255,255,0.6), 0 0 0 2px rgba(139,61,255,0.15)`,
              borderRadius: 2,
            }}
          />

          {([
            ['nw', '-top-[6px] -left-[6px] cursor-nw-resize', 'corner'],
            ['n',  '-top-[6px] left-1/2 -translate-x-1/2 cursor-n-resize', 'edge-h'],
            ['ne', '-top-[6px] -right-[6px] cursor-ne-resize', 'corner'],
            ['e',  'top-1/2 -right-[6px] -translate-y-1/2 cursor-e-resize', 'edge-v'],
            ['se', '-bottom-[6px] -right-[6px] cursor-se-resize', 'corner'],
            ['s',  '-bottom-[6px] left-1/2 -translate-x-1/2 cursor-s-resize', 'edge-h'],
            ['sw', '-bottom-[6px] -left-[6px] cursor-sw-resize', 'corner'],
            ['w',  'top-1/2 -left-[6px] -translate-y-1/2 cursor-w-resize', 'edge-v'],
          ] as const).map(([key, pos, kind]) => {
            const isCorner = kind === 'corner';
            const isH = kind === 'edge-h';
            return (
              <div key={key}
                onPointerDown={(e) => onPointerDown(e, 'resize')}
                className={cn('label-handle absolute z-[6]', pos)}
                style={{
                  width: isCorner ? 12 : (isH ? 18 : 6),
                  height: isCorner ? 12 : (isH ? 6 : 18),
                  background: '#ffffff',
                  border: `1.5px solid ${PURPLE}`,
                  borderRadius: isCorner ? 999 : 3,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.28), 0 0 0 0.5px rgba(15,23,42,0.05)',
                }} />
            );
          })}

          <div onPointerDown={(e) => e.stopPropagation()}
            className="label-actions absolute -top-12 left-0 flex items-center gap-0.5 rounded-full px-2 py-1.5 z-10"
            style={{
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              boxShadow: '0 6px 20px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.08)',
            }}>
            <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" style={{ color: '#1e293b' }} onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicar"><Copy className="size-[15px]" strokeWidth={2} /></button>
            <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" style={{ color: '#1e293b' }} onClick={(e) => { e.stopPropagation(); onMoveZ('up'); }} title="Trazer para frente"><ArrowUp className="size-[15px]" strokeWidth={2} /></button>
            <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" style={{ color: '#1e293b' }} onClick={(e) => { e.stopPropagation(); onMoveZ('down'); }} title="Enviar para trás"><ArrowDown className="size-[15px]" strokeWidth={2} /></button>
            <div className="w-px h-4 mx-1" style={{ background: '#e2e8f0' }} />
            <button className="p-1.5 rounded-full hover:bg-red-50 transition-colors" style={{ color: '#dc2626' }} onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remover"><Trash2 className="size-[15px]" strokeWidth={2} /></button>
          </div>
        </>
      )}
    </div>
  );
}

function ElementContent({ el, meta }: { el: LabelElement; meta: LabelState['meta'] }) {
  if (el.type === 'text') {
    const negative = el.negative;
    const fg = negative ? '#fff' : (el.fontColor || '#000');
    const bg = negative ? '#000' : 'transparent';
    return (
      <div className="w-full h-full leading-tight overflow-hidden break-words"
        style={{
          fontSize: `${el.fontSize || 12}pt`,
          fontFamily: el.fontFamily || 'system-ui, sans-serif',
          fontWeight: el.bold ? 800 : 400,
          fontStyle: el.italic ? 'italic' : 'normal',
          textDecoration: el.underline ? 'underline' : 'none',
          textAlign: el.align || 'left',
          background: bg,
          color: fg,
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
  const codePreview = (raw: string | undefined) => {
    const resolved = resolveVars(raw, meta);
    if (resolved) return resolved;
    return (raw && raw.trim()) || 'PREVIEW';
  };
  if (el.type === 'qr') {
    const value = codePreview(el.payload);
    return (
      <div className="w-full h-full flex items-center justify-center bg-white overflow-hidden">
        <QRCodeSVG
          value={value}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
          style={{ width: '100%', height: '100%', display: 'block', shapeRendering: 'crispEdges' }}
        />
      </div>
    );
  }
  if (el.type === 'datamatrix') return <BwipCode kind="datamatrix" value={codePreview(el.payload)} />;
  if (el.type === 'aztec') return <BwipCode kind="azteccode" value={codePreview(el.payload)} />;
  if (el.type === 'barcode') return <BarcodeSvg value={codePreview(el.payload)} fmt={el.barcodeFmt || 'CODE128'} />;
  if (el.type === 'line') {
    const style = el.lineStyle || 'solid';
    if (style === 'solid') return <div className="w-full h-full bg-black" />;
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
    const bs = el.borderStyle || 'solid';
    const bc = el.borderColor || '#000';
    if (el.rectFill === 'filled') {
      return <div className="w-full h-full" style={{ background: el.rectFillColor || '#000', borderRadius: `${br}px` }} />;
    }
    return <div className="w-full h-full" style={{ border: `${bw}px ${bs} ${bc}`, borderRadius: `${br}px`, background: 'transparent' }} />;
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
  return <svg ref={ref} className="w-full h-full bg-white" preserveAspectRatio="none" />;
}

function BwipCode({ kind, value }: { kind: 'datamatrix' | 'azteccode'; value: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      bwipjs.toCanvas(ref.current, { bcid: kind, text: value, scale: 4, includetext: false });
    } catch { /* ignore */ }
  }, [kind, value]);
  return <canvas ref={ref} className="w-full h-full bg-white" style={{ imageRendering: 'pixelated' }} />;
}

// ============================================================================
// Reusable form controls
// ============================================================================

function ToggleBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <Button size="sm" variant={active ? 'default' : 'outline'} className="h-8 w-8 p-0" onClick={onClick} title={title} aria-label={title}>
      {children}
    </Button>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Input type="number" step="0.5" className="h-8 font-mono text-xs" value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

function DimensionInput({
  value, min, max, onCommit,
}: { value: number; min: number; max: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string>(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const raw = draft.trim();
    if (raw === '') { setDraft(String(value)); return; }
    const n = Number(raw);
    if (!Number.isFinite(n)) { setDraft(String(value)); return; }
    const clamped = Math.max(min, Math.min(max, n));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <Input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      className="h-8"
      value={draft}
      onFocus={() => setEditing(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.currentTarget.blur(); }
        if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); e.currentTarget.blur(); }
      }}
    />
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
          <StatMini label="Total" value={String(stats.total)} icon={<History className="size-4" />} />
          <StatMini label="Cópias" value={String(stats.copies)} icon={<Copy className="size-4" />} />
          <StatMini label="Hoje" value={String(stats.today)} icon={<Sparkles className="size-4" />} />
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

function StatMini({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-muted/10 p-3 flex items-center gap-3">
      {icon && <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>}
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xl font-bold font-mono leading-tight">{value}</div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 h-[18px] rounded border border-border/70 bg-muted/60 font-mono text-[9px] font-semibold text-foreground/80 shadow-[0_1px_0_hsl(var(--border))]">
      {children}
    </kbd>
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

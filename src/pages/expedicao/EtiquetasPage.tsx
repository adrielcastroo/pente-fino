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
  Grid3x3, Hexagon, Bold, Italic, Underline, Contrast, Ruler as RulerIcon,
  Layers, Sparkles, MousePointerClick, Keyboard, Bookmark, Palette, Move,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      {/* Header — cartão premium com hierarquia clara e CTA destacado */}
      <div className="print:hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/40 shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="hidden sm:flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Tag className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">Etiquetas de Expedição</h1>
                <Badge variant="secondary" className="font-mono text-[11px] gap-1">
                  <RulerIcon className="size-3" /> {state.widthMm}×{state.heightMm} mm
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] gap-1 text-muted-foreground">
                  <Layers className="size-3" /> {state.elements.length} elem.
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Editor visual com réguas, variáveis dinâmicas e snap inteligente — estilo Canva/BarTender.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHistoryOpen(true)}>
              <History className="size-4" /> Histórico
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={reset} title="Limpar etiqueta">
              <RotateCcw className="size-4" /> <span className="hidden sm:inline">Reiniciar</span>
            </Button>
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setXmlOpen(true)}>
              <FileText className="size-4" /> Importar XML
            </Button>
            <Button onClick={handlePrint} size="sm" className="gap-1.5 shadow-sm">
              <Printer className="size-4" /> Imprimir
            </Button>
          </div>
        </div>
      </div>


      {/* Req #6: layout sem scroll vertical — grade ocupa altura restante da viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-5 print:block min-w-0 lg:h-[calc(100vh-200px)] lg:overflow-hidden">
        {/* Painel de configuração (rola internamente para não empurrar o preview) */}
        <div className="lg:h-full lg:overflow-y-auto lg:pr-1 space-y-3 custom-scrollbar">
        <Card className="print:hidden border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* --- Tamanho --- */}
            <SidebarSection icon={<RulerIcon className="size-3.5" />} title="Tamanho da etiqueta">
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
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Largura (mm)</Label>
                    <DimensionInput value={state.widthMm} min={20} max={300} onCommit={(v) => patch({ widthMm: v })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Altura (mm)</Label>
                    <DimensionInput value={state.heightMm} min={20} max={400} onCommit={(v) => patch({ heightMm: v })} />
                  </div>
                </div>
              )}
            </SidebarSection>

            {/* --- Adicionar elementos --- */}
            <SidebarSection icon={<Plus className="size-3.5" />} title="Adicionar elemento">
              <div className="space-y-2.5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">Texto</div>
                  <AddButton icon={<Type className="size-3.5" />} label="Texto" onClick={() => addElement('text')} />
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">Códigos</div>
                  <Select value="" onValueChange={(v) => v && addElement(v as ElementType)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecionar tipo de código…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qr"><span className="inline-flex items-center gap-2"><QrCode className="size-3.5" /> QR Code</span></SelectItem>
                      <SelectItem value="barcode"><span className="inline-flex items-center gap-2"><BarcodeIcon className="size-3.5" /> Código de barras (1D)</span></SelectItem>
                      <SelectItem value="datamatrix"><span className="inline-flex items-center gap-2"><Grid3x3 className="size-3.5" /> DataMatrix</span></SelectItem>
                      <SelectItem value="aztec"><span className="inline-flex items-center gap-2"><Hexagon className="size-3.5" /> Aztec</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">Formas</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <AddButton icon={<Minus className="size-3.5" />} label="Linha" onClick={() => addElement('line')} />
                    <AddButton icon={<Square className="size-3.5" />} label="Retângulo" onClick={() => addElement('rect')} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">Mídia</div>
                  <AddButton icon={<ImageIcon className="size-3.5" />} label="Carregar imagem" onClick={triggerImageUpload} />
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageUploadFile} />
                </div>
              </div>
            </SidebarSection>

            {/* --- Variáveis disponíveis --- */}
            <SidebarSection icon={<Sparkles className="size-3.5" />} title="Variáveis dinâmicas">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {VARIABLE_KEYS.map((k) => (
                    <code key={k} className="px-1.5 py-0.5 rounded bg-background border border-border/70 font-mono text-[10px] text-primary">{`{{${k}}}`}</code>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Use em textos, QR, DataMatrix e barras. Resolvidas ao imprimir.</p>
              </div>
            </SidebarSection>

            {/* --- Elementos da etiqueta --- */}
            <SidebarSection
              icon={<Layers className="size-3.5" />}
              title="Elementos"
              badge={<Badge variant="secondary" className="text-[10px] px-1.5 h-4">{state.elements.length}</Badge>}
            >
              <ScrollArea className="h-40 border border-border/60 rounded-md bg-background/40">
                <ul className="divide-y divide-border/60">
                  {state.elements.map((el) => (
                    <li key={el.id}>
                      <button type="button" onClick={() => setSelectedId(el.id)}
                        className={cn('w-full text-left px-2.5 py-2 text-xs flex items-center gap-2 hover:bg-accent/50 transition-colors',
                          selectedId === el.id && 'bg-primary/10 border-l-2 border-primary')}>
                        <ElementIcon type={el.type} />
                        <span className="truncate flex-1">{elementLabel(el)}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remover">
                          <Trash2 className="size-3" />
                        </button>
                      </button>
                    </li>
                  ))}
                  {state.elements.length === 0 && (
                    <li className="p-4 text-[11px] text-muted-foreground italic text-center">
                      <MousePointerClick className="size-4 mx-auto mb-1 opacity-50" />
                      Nenhum elemento — adicione acima.
                    </li>
                  )}
                </ul>
              </ScrollArea>
            </SidebarSection>

            {/* --- Presets --- */}
            <SidebarSection
              icon={<Bookmark className="size-3.5" />}
              title="Meus presets"
              badge={<Badge variant="secondary" className="text-[10px] px-1.5 h-4">{presets.length}</Badge>}
              action={
                <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10" onClick={handleSavePreset}>
                  <Plus className="size-3" /> Salvar
                </Button>
              }
            >
              {presets.length > 0 ? (
                <ScrollArea className="max-h-40 border border-border/60 rounded-md bg-background/40">
                  <ul className="divide-y divide-border/60">
                    {presets.map((p) => (
                      <li key={p.id} className="flex items-center gap-1 px-2 py-1.5 hover:bg-accent/50 transition-colors">
                        <button type="button" onClick={() => handleLoadPreset(p)} className="flex-1 min-w-0 text-left">
                          <div className="text-xs font-medium truncate">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {p.snapshot.widthMm}×{p.snapshot.heightMm}mm · {p.snapshot.elements.length} elem.
                          </div>
                        </button>
                        <button type="button" onClick={() => handleDeletePreset(p.id)}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <div className="text-[11px] text-muted-foreground italic text-center py-3 border border-dashed border-border/50 rounded-md">
                  Salve o layout atual para reutilizar depois.
                </div>
              )}
            </SidebarSection>

            {/* --- Resumo XML --- */}
            {(state.meta.transportadora || state.meta.nfNumero) && (
              <SidebarSection icon={<FileText className="size-3.5" />} title="Dados do XML atual" last>
                <div className="rounded-md border border-border/60 bg-muted/40 p-2.5 space-y-1.5 text-[11px]">
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
              </SidebarSection>
            )}
          </CardContent>
        </Card>
        </div>


        {/* Editor Canvas — barra de ações (Inspector) fica ACIMA do preview (Req #2) */}
        <div className="flex flex-col min-h-0 lg:h-full gap-2">
          {selected ? (
            <ElementInspector
              element={selected}
              onUpdate={(p) => updateElement(selected.id, p)}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground print:hidden flex items-center gap-2.5">
              <div className="size-8 rounded-md bg-background/70 border border-border/60 flex items-center justify-center shrink-0">
                <MousePointerClick className="size-4 text-primary/70" />
              </div>
              <div>
                <div className="font-medium text-foreground/90">Selecione um elemento na etiqueta</div>
                <div className="text-[11px] text-muted-foreground">Suas propriedades aparecem aqui para edição rápida.</div>
              </div>
            </div>
          )}
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
              onSelect={setSelectedId}
              onUpdate={updateElement}
              onRemove={removeElement}
              onDuplicate={duplicateElement}
              onMoveZ={moveElementZ}
            />
          </PreviewWorkbench>
        </div>
      </div>

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

const RULER_SIZE = 22; // px

/**
 * Workbench com:
 *  - Réguas mm fixadas nas bordas superior/esquerda do preview (Req #1)
 *  - Zoom pela roda do mouse (Ctrl/Alt = passo fino)
 *  - Scroll horizontal com Espaço pressionado + roda do mouse (Req #9)
 *  - Sem scroll vertical do editor: o preview ocupa a altura disponível (Req #6)
 */
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

  // Espaço pressionado → habilita "pan" com scroll horizontal (Req #9)
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

  // Roda: zoom (padrão) ou pan horizontal (Espaço pressionado)
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

  return (
    <div className="space-y-2 exp-preview-workbench flex flex-col min-h-0 lg:h-full">
      <div className="flex items-center justify-between gap-3 shrink-0 print:hidden flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pré-visualização</Label>
          <Badge variant="outline" className="font-mono text-[10px] gap-1 h-5">
            <RulerIcon className="size-3" /> {widthMm}×{heightMm}mm
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px] h-5">{Math.round(fit * 100)}%</Badge>
          <button className="text-[10px] font-medium text-primary hover:underline underline-offset-2 transition-colors" onClick={() => onZoomChange(0)}>
            Ajustar à tela
          </button>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Keyboard className="size-3 mr-0.5 opacity-60" />
          <Kbd>Scroll</Kbd><span className="opacity-60">zoom</span>
          <span className="opacity-30">·</span>
          <Kbd>Space</Kbd>+<Kbd>Scroll</Kbd><span className="opacity-60">mover</span>
          <span className="opacity-30">·</span>
          <Kbd>Del</Kbd><span className="opacity-60">excluir</span>
          <span className="opacity-30">·</span>
          <Kbd>Ctrl</Kbd>+<Kbd>B</Kbd><span className="opacity-60">negrito</span>
          <span className="opacity-30">·</span>
          <Kbd>Alt</Kbd><span className="opacity-60">sem snap</span>
        </div>
      </div>
      <div
        ref={boxRef}
        className={cn(
          'exp-preview-box relative rounded-xl border border-border/60 overflow-auto shadow-inner flex-1 min-h-0 bg-background/50',
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
        {/* Réguas fixadas nas bordas do preview (Req #1) */}
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
          {/* canto */}
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
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Régua (estilo Canva/BarTender): traços a cada mm, número a cada 10mm.
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
  // Espaçamento adaptativo entre rótulos conforme escala.
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

  // Guias de snap ativas durante o drag (em mm). Estilo Canva:
  // mostra linhas quando o elemento se alinha a bordas/centros do canvas ou de outros elementos.
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

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

    // Alvos de snap fixos (bordas + centro do canvas). Adiciona também bordas/centros
    // de outros elementos, para replicar o comportamento do Canva/BarTender.
    const others = elements.filter((o) => o.id !== el.id);
    const xTargetsBase = [0, widthMm / 2, widthMm, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
    const yTargetsBase = [0, heightMm / 2, heightMm, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];

    const onMove = (ev: PointerEvent) => {
      const dxMm = (ev.clientX - startX) / scaleX / MM_TO_PX;
      const dyMm = (ev.clientY - startY) / scaleY / MM_TO_PX;
      // Snap desabilitado com Alt pressionado (mesma UX do Canva)
      const snapEnabled = !ev.altKey;
      // Tolerância em mm — proporcional para telas com fit variável (~5px).
      const tol = 1.2;

      if (mode === 'move') {
        let nx = Math.max(0, Math.min(widthMm - origin.w, origin.x + dxMm));
        let ny = Math.max(0, Math.min(heightMm - origin.h, origin.y + dyMm));
        const activeV: number[] = [];
        const activeH: number[] = [];
        if (snapEnabled) {
          // Candidatos verticais: esquerda, centro, direita do elemento em movimento.
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

      {/* Guias de snap (Req #3): linhas cyan enquanto arrasta, ocultas na impressão. */}
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
  // Códigos: se a variável ainda não foi preenchida, usamos um valor de preview
  // baseado no próprio payload para que o QR/DM/Aztec/Barras seja sempre visível (Req #5).
  const codePreview = (raw: string | undefined) => {
    const resolved = resolveVars(raw, meta);
    if (resolved) return resolved;
    return (raw && raw.trim()) || 'PREVIEW';
  };
  if (el.type === 'qr') {
    const size = Math.max(16, Math.min(el.w, el.h) * MM_TO_PX);
    const value = codePreview(el.payload);
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <QRCodeCanvas value={value} size={size} level="M" includeMargin={false} />
      </div>
    );
  }
  if (el.type === 'datamatrix') return <BwipCode kind="datamatrix" value={codePreview(el.payload)} />;
  if (el.type === 'aztec') return <BwipCode kind="azteccode" value={codePreview(el.payload)} />;
  if (el.type === 'barcode') return <BarcodeSvg value={codePreview(el.payload)} fmt={el.barcodeFmt || 'CODE128'} />;
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
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Cor</Label>
              <input
                type="color"
                value={element.fontColor || '#000000'}
                onChange={(e) => onUpdate({ fontColor: e.target.value })}
                className="h-8 w-10 rounded border border-border bg-background cursor-pointer p-0.5"
                title="Cor da fonte"
              />
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

/**
 * Campo de dimensão que permite ao usuário apagar totalmente o valor e digitar
 * do zero (Req #1). O clamp min/max só é aplicado ao confirmar (blur ou Enter).
 * Enquanto o campo está em edição mantemos uma string local para não sobrescrever
 * o que o usuário digitou.
 */
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

// --- Sidebar / toolbar helpers (visual only) ---

function SidebarSection({
  icon, title, badge, action, children, last,
}: {
  icon: React.ReactNode; title: string;
  badge?: React.ReactNode; action?: React.ReactNode;
  children: React.ReactNode; last?: boolean;
}) {
  return (
    <section className={cn('px-3.5 py-3', !last && 'border-b border-border/50')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
          <span className="text-primary/70">{icon}</span>
          {title}
          {badge}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-2.5 py-2 text-xs font-medium hover:bg-accent hover:border-primary/40 hover:text-foreground transition-all active:scale-[0.98] shadow-sm"
    >
      <span className="text-primary/80">{icon}</span>
      {label}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 h-[18px] rounded border border-border/70 bg-muted/60 font-mono text-[9px] font-semibold text-foreground/80 shadow-[0_1px_0_hsl(var(--border))]">
      {children}
    </kbd>
  );
}

// --- Inspector visual helpers ---

function InspectorGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2.5 pr-3 mr-1 border-r border-border/50 last:border-r-0 last:pr-0 last:mr-0">
      {children}
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

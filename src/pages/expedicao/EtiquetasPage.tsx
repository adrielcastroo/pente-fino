import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import {
  Printer, Tag, Save, Trash2, Plus, Copy, Download, Upload, Image as ImageIcon, X,
  History, Sparkles, GripVertical, Usb, AlertCircle, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePickings } from '@/hooks/expedicao/useExpedicaoData';
import {
  LABEL_PRESETS, KNOWN_VARS, interpolate, validateBarcode,
  loadHistory, pushHistory, clearHistory, historyStatsByTemplate,
  generateZpl, sendZplViaUsb, sendZplViaSerial,
  isWebUsbSupported, isWebSerialSupported,
  type BarcodeFmt, type Vars, type PrintHistoryEntry,
} from './etiqueta-helpers';

// ============================================================================
// Types
// ============================================================================

type PageSize = '100x150' | '100x100' | '80x60' | '60x40' | '50x30' | 'custom';
type Align = 'left' | 'center' | 'right';
type BlockKey = 'header' | 'carga' | 'code' | 'fields' | 'destino' | 'obs';

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface LabelTemplate {
  id: string;
  name: string;
  updatedAt: number;
  // Conteúdo (aceita variáveis {{romaneio}}, {{nf}}, {{cliente}}…)
  titulo: string;
  subtitulo: string;
  codigo: string;
  destino: string;
  observacoes: string;
  transportadora: string;
  nfNumero: string;
  volumeAtual: string;
  volumeTotal: string;
  customFields: CustomField[];
  logoDataUrl: string | null;
  // Variáveis dinâmicas por template (sobreescrevem vars do picking ativo)
  vars: Vars;
  // BarTender import
  bartenderImage: string | null;
  bartenderFileName: string | null;
  bartenderEnabled: boolean;
  // Códigos — QR e barras podem coexistir
  showQr: boolean;
  showBarcode: boolean;
  codePayload: string; // vazio → usa o campo "código"
  barcodeFmt: BarcodeFmt;
  codeSize: number;
  // Layout
  pageSize: PageSize;
  customWidth: number;
  customHeight: number;
  titleSize: number;
  codeFontSize: number;
  align: Align;
  borderStyle: 'none' | 'solid' | 'dashed';
  paddingMm: number;
  blocksOrder: BlockKey[];
  // Impressão
  copias: number;
}

const STORAGE_KEY = 'exp_label_templates_v2';
const ACTIVE_KEY = 'exp_label_active_v2';
const VARS_KEY = 'exp_label_global_vars_v1';

const PAGE_DIMS: Record<PageSize, { w: number; h: number; label: string }> = {
  '100x150': { w: 100, h: 150, label: '100×150 mm (padrão Zebra/Argox)' },
  '100x100': { w: 100, h: 100, label: '100×100 mm (quadrada)' },
  '80x60':   { w: 80,  h: 60,  label: '80×60 mm' },
  '60x40':   { w: 60,  h: 40,  label: '60×40 mm (pequena)' },
  '50x30':   { w: 50,  h: 30,  label: '50×30 mm (mini)' },
  'custom':  { w: 100, h: 150, label: 'Personalizado…' },
};

const MIN_MM = 10;
const MAX_MM = 300;

function clampMm(v: number) {
  if (!Number.isFinite(v)) return MIN_MM;
  return Math.min(MAX_MM, Math.max(MIN_MM, Math.round(v)));
}

function resolveDims(t: { pageSize: PageSize; customWidth: number; customHeight: number }) {
  if (t.pageSize === 'custom') {
    return { w: clampMm(t.customWidth), h: clampMm(t.customHeight), label: 'Personalizado' };
  }
  return PAGE_DIMS[t.pageSize];
}

const DEFAULT_BLOCKS: BlockKey[] = ['header', 'code', 'fields', 'destino', 'obs'];

const DEFAULT_TEMPLATE: Omit<LabelTemplate, 'id' | 'name' | 'updatedAt'> = {
  titulo: 'EXPEDIÇÃO',
  subtitulo: '',
  codigo: '',
  destino: '',
  observacoes: '',
  transportadora: '',
  nfNumero: '',
  volumeAtual: '1',
  volumeTotal: '1',
  customFields: [],
  logoDataUrl: null,
  vars: {},
  bartenderImage: null,
  bartenderFileName: null,
  bartenderEnabled: false,
  showQr: true,
  showBarcode: false,
  codePayload: '',
  barcodeFmt: 'CODE128',
  codeSize: 200,
  pageSize: '100x150',
  customWidth: 100,
  customHeight: 150,
  titleSize: 12,
  codeFontSize: 26,
  align: 'center',
  borderStyle: 'solid',
  paddingMm: 4,
  blocksOrder: [...DEFAULT_BLOCKS],
  copias: 1,
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeTemplate(name = 'Novo modelo', overrides: Partial<LabelTemplate> = {}): LabelTemplate {
  return { id: newId(), name, updatedAt: Date.now(), ...DEFAULT_TEMPLATE, ...overrides };
}

// Migração: templates antigos podem ter `codeMode` em vez de showQr/showBarcode,
// e podem não ter `blocksOrder`/`vars`. Normalizamos no load.
type LegacyTemplate = Partial<LabelTemplate> & {
  codeMode?: 'none' | 'qr' | 'barcode';
};

function migrateTemplate(raw: LegacyTemplate): LabelTemplate {
  const base = makeTemplate(raw.name ?? 'Modelo', {});
  const out: LabelTemplate = { ...base, ...(raw as Partial<LabelTemplate>), id: raw.id ?? base.id };
  if (raw.codeMode && raw.showQr === undefined && raw.showBarcode === undefined) {
    out.showQr = raw.codeMode === 'qr';
    out.showBarcode = raw.codeMode === 'barcode';
  }
  if (!Array.isArray(out.blocksOrder) || out.blocksOrder.length === 0) {
    out.blocksOrder = [...DEFAULT_BLOCKS];
  } else {
    // Garante que todos os blocos estejam presentes (compatibilidade futura)
    for (const k of DEFAULT_BLOCKS) {
      if (!out.blocksOrder.includes(k)) out.blocksOrder.push(k);
    }
  }
  if (!out.vars || typeof out.vars !== 'object') out.vars = {};
  return out;
}

function loadTemplates(): LabelTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((t) => migrateTemplate(t as LegacyTemplate));
  } catch { return []; }
}

function saveTemplates(list: LabelTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadGlobalVars(): Vars {
  try {
    const raw = localStorage.getItem(VARS_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}
function saveGlobalVars(v: Vars) {
  localStorage.setItem(VARS_KEY, JSON.stringify(v));
}

// ============================================================================
// Page
// ============================================================================

export default function ExpedicaoEtiquetasPage() {
  useDocumentTitle('Impressão de etiqueta');

  const [templates, setTemplates] = useState<LabelTemplate[]>(() => {
    const list = loadTemplates();
    return list.length ? list : [makeTemplate('Padrão Expedição')];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const stored = localStorage.getItem(ACTIVE_KEY);
    const list = loadTemplates();
    if (stored && list.some((t) => t.id === stored)) return stored;
    return list[0]?.id ?? '';
  });
  const [globalVars, setGlobalVars] = useState<Vars>(() => loadGlobalVars());
  const [history, setHistory] = useState<PrintHistoryEntry[]>(() => loadHistory());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  useEffect(() => {
    if (!templates.some((t) => t.id === activeId)) {
      setActiveId(templates[0]?.id ?? '');
    }
  }, [templates, activeId]);

  const active = templates.find((t) => t.id === activeId) ?? templates[0];

  useEffect(() => {
    const id = setTimeout(() => saveTemplates(templates), 250);
    return () => clearTimeout(id);
  }, [templates]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  useEffect(() => { saveGlobalVars(globalVars); }, [globalVars]);

  function update<K extends keyof LabelTemplate>(key: K, value: LabelTemplate[K]) {
    setTemplates((list) =>
      list.map((t) => (t.id === activeId ? { ...t, [key]: value, updatedAt: Date.now() } : t)),
    );
  }

  function patchActive(patch: Partial<LabelTemplate>) {
    setTemplates((list) =>
      list.map((t) => (t.id === activeId ? { ...t, ...patch, updatedAt: Date.now() } : t)),
    );
  }

  function addCustomField() {
    update('customFields', [...active.customFields, { id: newId(), label: 'Campo', value: '' }]);
  }
  function updateCustomField(id: string, patch: Partial<CustomField>) {
    update('customFields', active.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function removeCustomField(id: string) {
    update('customFields', active.customFields.filter((f) => f.id !== id));
  }

  function createTemplate() {
    const tpl = makeTemplate(`Modelo ${templates.length + 1}`);
    setTemplates((l) => [...l, tpl]);
    setActiveId(tpl.id);
    toast.success('Modelo criado');
  }
  function duplicateTemplate() {
    if (!active) return;
    const tpl = { ...active, id: newId(), name: `${active.name} (cópia)`, updatedAt: Date.now() };
    setTemplates((l) => [...l, tpl]);
    setActiveId(tpl.id);
    toast.success('Modelo duplicado');
  }
  function removeTemplate() {
    if (!active) return;
    if (templates.length === 1) return toast.error('Mantenha pelo menos um modelo.');
    setTemplates((l) => l.filter((t) => t.id !== active.id));
    toast.success('Modelo removido');
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `etiquetas-modelos-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(String(reader.result));
        if (!Array.isArray(arr)) throw new Error('inválido');
        setTemplates((l) => [...l, ...arr.map((t: LegacyTemplate) => migrateTemplate({ ...t, id: newId() }))]);
        toast.success(`${arr.length} modelo(s) importado(s)`);
      } catch { toast.error('Arquivo inválido.'); }
    };
    reader.readAsText(file);
  }

  function uploadLogo(file: File) {
    if (file.size > 1024 * 1024) return toast.error('Logo deve ter até 1MB.');
    const reader = new FileReader();
    reader.onload = () => update('logoDataUrl', String(reader.result));
    reader.readAsDataURL(file);
  }

  function uploadBartender(file: File) {
    const isImage = /\.(png|jpe?g|webp|gif)$/i.test(file.name) || file.type.startsWith('image/');
    const isBtw = /\.(btw|btxml)$/i.test(file.name);
    if (!isImage && !isBtw) {
      return toast.error('Envie uma imagem (PNG/JPG) exportada do BarTender ou um arquivo .btw.');
    }
    if (file.size > 4 * 1024 * 1024) return toast.error('Arquivo deve ter até 4MB.');
    if (isBtw) {
      patchActive({ bartenderFileName: file.name });
      toast.info('Arquivo .btw salvo como referência. Exporte como PNG no BarTender para imprimir.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patchActive({
        bartenderImage: String(reader.result),
        bartenderFileName: file.name,
        bartenderEnabled: true,
      });
      toast.success('Etiqueta BarTender importada.');
    };
    reader.readAsDataURL(file);
  }

  function applyPreset(presetId: string) {
    const preset = LABEL_PRESETS.find((p) => p.id === presetId);
    if (!preset || !active) return;
    patchActive(preset.patch as Partial<LabelTemplate>);
    toast.success(`Preset "${preset.label}" aplicado`);
    setPresetsOpen(false);
  }

  // Aplica o preset e dispara impressão automaticamente — comportamento "driver de impressora":
  // a escolha do preset substitui o template ativo e imediatamente envia para impressão
  // usando as dimensões/margens/orientação do próprio preset.
  function applyPresetAndPrint(presetId: string) {
    const preset = LABEL_PRESETS.find((p) => p.id === presetId);
    if (!preset || !active) return;
    patchActive(preset.patch as Partial<LabelTemplate>);
    setPresetsOpen(false);
    toast.success(`Imprimindo com preset "${preset.label}"…`);
    // Aguarda o React commitar o patch (dimensões e @page) antes de chamar window.print().
    setTimeout(() => {
      recordPrint('browser');
      window.print();
    }, 250);
  }

  // Combinação: vars globais + vars do template (template tem prioridade)
  const mergedVars: Vars = useMemo(
    () => ({ ...globalVars, ...(active?.vars ?? {}) }),
    [globalVars, active],
  );

  // Snapshot interpolado para preview/print/ZPL
  const interpolated = useMemo(() => {
    if (!active) return null;
    return {
      ...active,
      titulo: interpolate(active.titulo, mergedVars),
      subtitulo: interpolate(active.subtitulo, mergedVars),
      codigo: interpolate(active.codigo, mergedVars),
      destino: interpolate(active.destino, mergedVars),
      observacoes: interpolate(active.observacoes, mergedVars),
      codePayload: interpolate(active.codePayload, mergedVars),
      customFields: active.customFields.map((f) => ({ ...f, value: interpolate(f.value, mergedVars) })),
    };
  }, [active, mergedVars]);

  function recordPrint(method: PrintHistoryEntry['method']) {
    if (!interpolated || !active) return;
    const payload = (interpolated.codePayload || interpolated.codigo || interpolated.titulo || '').slice(0, 200);
    const entry = pushHistory({
      templateId: active.id,
      templateName: active.name,
      copies: active.copias,
      payload,
      method,
      snapshot: interpolated,
    });
    setHistory((h) => [entry, ...h].slice(0, 100));
  }

  function handleBrowserPrint() {
    if (!interpolated) return;
    if (!interpolated.titulo.trim() && !interpolated.codigo.trim()) {
      return toast.error('Preencha pelo menos o título ou código.');
    }
    recordPrint('browser');
    window.print();
  }

  async function handleZplPrint(transport: 'usb' | 'serial') {
    if (!interpolated) return;
    const dims = resolveDims(interpolated);
    const payload = (interpolated.codePayload || interpolated.codigo || interpolated.titulo || '').slice(0, 700);
    const zpl = generateZpl({
      widthMm: dims.w, heightMm: dims.h,
      titulo: interpolated.titulo, subtitulo: interpolated.subtitulo,
      codigo: interpolated.codigo, destino: interpolated.destino,
      observacoes: interpolated.observacoes,
      customFields: interpolated.customFields,
      showQr: interpolated.showQr, showBarcode: interpolated.showBarcode,
      barcodeFmt: interpolated.barcodeFmt,
      payload, copies: interpolated.copias,
    });
    const result = transport === 'usb' ? await sendZplViaUsb(zpl) : await sendZplViaSerial(zpl);
    if (result.ok === true) {
      recordPrint(result.method);
      toast.success(`Enviado para impressora via ${transport.toUpperCase()}`);
      return;
    }
    toast.error(result.error);
  }

  function reprintFromHistory(entry: PrintHistoryEntry) {
    if (entry.snapshot) {
      // Repõe as variáveis no template ativo e imprime
      const snap = entry.snapshot as Partial<LabelTemplate>;
      patchActive({
        titulo: snap.titulo ?? '', subtitulo: snap.subtitulo ?? '',
        codigo: snap.codigo ?? '', destino: snap.destino ?? '',
        observacoes: snap.observacoes ?? '',
        codePayload: snap.codePayload ?? '',
      });
      setHistoryOpen(false);
      setTimeout(() => window.print(), 100);
      recordPrint('browser');
      toast.success('Reimpressão disparada');
    }
  }

  if (!active || !interpolated) return null;

  const dims = resolveDims(active);

  return (
    <div className="space-y-4">
      <Header
        templates={templates}
        active={active}
        onSelect={setActiveId}
        onCreate={createTemplate}
        onDuplicate={duplicateTemplate}
        onRemove={removeTemplate}
        onRename={(name) => update('name', name)}
        onExport={exportJson}
        onImport={importJson}
        onPrint={handleBrowserPrint}
        onPrintZplUsb={() => handleZplPrint('usb')}
        onPrintZplSerial={() => handleZplPrint('serial')}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenPresets={() => setPresetsOpen(true)}
        historyCount={history.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_460px] gap-4 lg:gap-6 print:block min-w-0">
        {/* Form */}
        <Card className="print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personalização</CardTitle>
            <CardDescription>
              Tudo é salvo automaticamente. Use <code className="font-mono text-[11px] bg-muted px-1 rounded">{'{{romaneio}}'}</code>,
              {' '}<code className="font-mono text-[11px] bg-muted px-1 rounded">{'{{nf}}'}</code>,
              {' '}<code className="font-mono text-[11px] bg-muted px-1 rounded">{'{{cliente}}'}</code> em qualquer campo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="conteudo" className="w-full">
              <TabsList className="grid grid-cols-3 sm:grid-cols-5 mb-4 h-auto gap-1">
                <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                <TabsTrigger value="codigo">Códigos</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="vars">Variáveis</TabsTrigger>
                <TabsTrigger value="extras">Extras</TabsTrigger>
              </TabsList>

              {/* CONTEÚDO */}
              <TabsContent value="conteudo" className="space-y-4">
                <TextField label="Título" value={active.titulo}
                  onChange={(v) => update('titulo', v)} placeholder="EXPEDIÇÃO" />
                <TextField label="Subtítulo" value={active.subtitulo}
                  onChange={(v) => update('subtitulo', v)} placeholder="Romaneio · NF · Cliente…" />
                <TextField label="Código principal" mono value={active.codigo}
                  onChange={(v) => update('codigo', v)} placeholder="ROM-00123" />
                <TextField label="Destino / Cliente" value={active.destino}
                  onChange={(v) => update('destino', v)} placeholder="Nome · Cidade · UF" />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
                  <Textarea rows={3} value={active.observacoes}
                    onChange={(e) => update('observacoes', e.target.value)}
                    placeholder="Texto livre que aparece no rodapé." />
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Campos personalizados</p>
                    <p className="text-xs text-muted-foreground">Adicione rótulos extras (lote, peso, validade…).</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={addCustomField}>
                    <Plus className="size-4" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {active.customFields.map((f) => (
                    <div key={f.id} className="grid grid-cols-[140px_1fr_auto] gap-2 items-center">
                      <Input value={f.label} placeholder="Rótulo"
                        onChange={(e) => updateCustomField(f.id, { label: e.target.value })} />
                      <Input value={f.value} placeholder="Valor"
                        onChange={(e) => updateCustomField(f.id, { value: e.target.value })} />
                      <Button size="icon" variant="ghost" onClick={() => removeCustomField(f.id)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                  {active.customFields.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Nenhum campo extra.</p>
                  )}
                </div>
              </TabsContent>

              {/* CÓDIGOS — QR + Barcode independentes */}
              <TabsContent value="codigo" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ToggleCard label="QR Code" checked={active.showQr}
                    onChange={(v) => update('showQr', v)} />
                  <ToggleCard label="Código de barras" checked={active.showBarcode}
                    onChange={(v) => update('showBarcode', v)} />
                </div>

                {(active.showQr || active.showBarcode) && (
                  <>
                    <TextField label="Payload (vazio = usa código principal)" mono
                      value={active.codePayload} onChange={(v) => update('codePayload', v)}
                      placeholder={active.codigo || 'ROM-00123'} />

                    {active.showBarcode && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">Formato do código de barras</Label>
                          <Select value={active.barcodeFmt}
                            onValueChange={(v: BarcodeFmt) => update('barcodeFmt', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CODE128">CODE128 (genérico)</SelectItem>
                              <SelectItem value="CODE39">CODE39</SelectItem>
                              <SelectItem value="EAN13">EAN-13</SelectItem>
                              <SelectItem value="EAN8">EAN-8</SelectItem>
                              <SelectItem value="UPC">UPC</SelectItem>
                              <SelectItem value="ITF14">ITF-14</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <BarcodeValidation
                          value={interpolate(active.codePayload || active.codigo, mergedVars)}
                          format={active.barcodeFmt}
                        />
                      </>
                    )}

                    <SliderField label="Tamanho dos códigos" suffix="px"
                      min={80} max={320} step={10}
                      value={active.codeSize} onChange={(v) => update('codeSize', v)} />
                  </>
                )}
              </TabsContent>

              {/* LAYOUT */}
              <TabsContent value="layout" className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Tamanho da etiqueta</Label>
                  <Select value={active.pageSize}
                    onValueChange={(v: PageSize) => update('pageSize', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PAGE_DIMS) as PageSize[]).map((k) => (
                        <SelectItem key={k} value={k}>{PAGE_DIMS[k].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {active.pageSize === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Largura (mm)</Label>
                      <Input type="number" inputMode="numeric"
                        min={MIN_MM} max={MAX_MM} step={1}
                        value={active.customWidth}
                        onChange={(e) => update('customWidth', clampMm(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Altura (mm)</Label>
                      <Input type="number" inputMode="numeric"
                        min={MIN_MM} max={MAX_MM} step={1}
                        value={active.customHeight}
                        onChange={(e) => update('customHeight', clampMm(Number(e.target.value)))} />
                    </div>
                    <p className="col-span-2 text-[11px] text-muted-foreground">
                      Aceita {MIN_MM}–{MAX_MM} mm. Preview e impressão se ajustam automaticamente.
                    </p>
                  </div>
                )}

                <SliderField label="Tamanho do título" suffix="pt" min={8} max={24} step={1}
                  value={active.titleSize} onChange={(v) => update('titleSize', v)} />
                <SliderField label="Tamanho do código (texto)" suffix="pt" min={10} max={48} step={1}
                  value={active.codeFontSize} onChange={(v) => update('codeFontSize', v)} />
                <SliderField label="Margem interna" suffix="mm" min={1} max={10} step={0.5}
                  value={active.paddingMm} onChange={(v) => update('paddingMm', v)} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Alinhamento</Label>
                    <Select value={active.align} onValueChange={(v: Align) => update('align', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Borda</Label>
                    <Select value={active.borderStyle}
                      onValueChange={(v: 'none' | 'solid' | 'dashed') => update('borderStyle', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem borda</SelectItem>
                        <SelectItem value="solid">Sólida</SelectItem>
                        <SelectItem value="dashed">Tracejada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
                <BlocksEditor
                  blocks={active.blocksOrder}
                  onChange={(b) => update('blocksOrder', b)}
                />
              </TabsContent>

              {/* VARIÁVEIS */}
              <TabsContent value="vars" className="space-y-4">
                <PickingVarsPanel
                  vars={globalVars}
                  onChange={setGlobalVars}
                />
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Variáveis específicas deste modelo (sobrescrevem as globais)
                  </Label>
                  <KeyValueEditor
                    value={active.vars}
                    onChange={(v) => update('vars', v)}
                  />
                </div>
              </TabsContent>

              {/* EXTRAS */}
              <TabsContent value="extras" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Logo (PNG/JPG, ≤1MB)</Label>
                  {active.logoDataUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={active.logoDataUrl} alt="logo"
                        className="h-14 w-14 object-contain rounded border border-border bg-white p-1" />
                      <Button size="sm" variant="ghost" className="gap-1.5"
                        onClick={() => update('logoDataUrl', null)}>
                        <Trash2 className="size-4" /> Remover
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 border border-dashed border-border rounded-md px-3 py-3 cursor-pointer hover:bg-accent/30 transition-colors">
                      <ImageIcon className="size-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para enviar logo</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                    </label>
                  )}
                </div>

                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Etiqueta BarTender</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Envie a imagem exportada do BarTender (PNG/JPG) — ocupa toda a etiqueta.
                      </p>
                    </div>
                    {active.bartenderImage && (
                      <div className="flex items-center gap-2">
                        <Label className="text-[11px] text-muted-foreground">Usar</Label>
                        <Switch checked={active.bartenderEnabled}
                          onCheckedChange={(v) => update('bartenderEnabled', v)} />
                      </div>
                    )}
                  </div>
                  {active.bartenderImage ? (
                    <div className="flex items-center gap-3 border border-border rounded-md p-2">
                      <img src={active.bartenderImage} alt="BarTender"
                        className="h-16 w-16 object-contain bg-white rounded border border-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{active.bartenderFileName ?? 'etiqueta'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {active.bartenderEnabled ? 'Substituindo conteúdo na impressão' : 'Salva mas desativada'}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => {
                        patchActive({ bartenderImage: null, bartenderFileName: null, bartenderEnabled: false });
                      }}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 border border-dashed border-border rounded-md px-3 py-3 cursor-pointer hover:bg-accent/30 transition-colors">
                      <Upload className="size-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Enviar PNG/JPG do BarTender {active.bartenderFileName ? `· ref: ${active.bartenderFileName}` : ''}
                      </span>
                      <input type="file" accept="image/*,.btw,.btxml" className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadBartender(e.target.files[0])} />
                    </label>
                  )}
                </div>

                <SliderField label="Cópias" suffix="" min={1} max={50} step={1}
                  value={active.copias} onChange={(v) => update('copias', v)} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between print:hidden">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Pré-visualização · {dims.w}×{dims.h}mm
            </p>
            <span className="text-[10px] text-muted-foreground">
              {active.copias} cópia(s)
            </span>
          </div>
          <div className="print:contents">
            {Array.from({ length: active.copias }).map((_, i) => (
              <LabelSheet key={i} t={interpolated} />
            ))}
          </div>
        </div>
      </div>

      <PresetsDialog open={presetsOpen} onOpenChange={setPresetsOpen} onApply={applyPreset} onApplyAndPrint={applyPresetAndPrint} />
      <HistoryDialog
        open={historyOpen} onOpenChange={setHistoryOpen}
        history={history}
        onReprint={reprintFromHistory}
        onClear={() => { clearHistory(); setHistory([]); toast.success('Histórico limpo'); }}
      />

      <PrintStyles wMm={dims.w} hMm={dims.h} />
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function Header({
  templates, active, onSelect, onCreate, onDuplicate, onRemove, onRename,
  onExport, onImport, onPrint, onPrintZplUsb, onPrintZplSerial,
  onOpenHistory, onOpenPresets, historyCount,
}: {
  templates: LabelTemplate[]; active: LabelTemplate;
  onSelect: (id: string) => void; onCreate: () => void; onDuplicate: () => void;
  onRemove: () => void; onRename: (name: string) => void;
  onExport: () => void; onImport: (f: File) => void;
  onPrint: () => void; onPrintZplUsb: () => void; onPrintZplSerial: () => void;
  onOpenHistory: () => void; onOpenPresets: () => void; historyCount: number;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(active.name);
  useEffect(() => setName(active.name), [active.name, active.id]);

  const usbOk = isWebUsbSupported();
  const serialOk = isWebSerialSupported();
  const headerDims = resolveDims(active);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 print:hidden">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
          <Tag className="size-5 text-primary" /> Etiquetas
          <Badge
            variant="secondary"
            className="ml-1 font-mono text-[11px] gap-1"
            title="Tamanho padrão atual — usado na próxima impressão até ser alterado"
          >
            <span className="text-muted-foreground">Padrão:</span>
            {headerDims.w}×{headerDims.h} mm
          </Badge>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize, salve modelos e imprima via navegador ou ZPL direto na impressora.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={active.id} onValueChange={onSelect}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenPresets}>
          <Sparkles className="size-4" /> Presets
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenHistory}>
          <History className="size-4" /> Histórico
          {historyCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{historyCount}</Badge>
          )}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setRenaming(true)}>
          <Save className="size-4" /> Renomear
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onCreate}>
          <Plus className="size-4" /> Novo
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onDuplicate}>
          <Copy className="size-4" /> Duplicar
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={onRemove}>
          <Trash2 className="size-4" /> Excluir
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onExport}>
          <Download className="size-4" /> Exportar
        </Button>
        <label className="inline-flex">
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <span><Upload className="size-4" /> Importar</span>
          </Button>
          <input type="file" accept="application/json" className="hidden"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </label>

        {usbOk && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onPrintZplUsb}
            title="Envia ZPL direto via WebUSB (Zebra/Argox/Bixolon)">
            <Usb className="size-4" /> ZPL USB
          </Button>
        )}
        {serialOk && !usbOk && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onPrintZplSerial}>
            <Usb className="size-4" /> ZPL Serial
          </Button>
        )}

        <Button onClick={onPrint} className="gap-2">
          <Printer className="size-4" /> Imprimir
        </Button>
      </div>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear modelo</DialogTitle>
            <DialogDescription>Identifique este modelo para reaproveitar depois.</DialogDescription>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(name.trim() || 'Sem nome'); setRenaming(false); }
            }} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(false)}>Cancelar</Button>
            <Button onClick={() => { onRename(name.trim() || 'Sem nome'); setRenaming(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder, mono,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={mono ? 'font-mono tracking-tight' : ''} />
    </div>
  );
}

function SliderField({
  label, value, onChange, min, max, step, suffix,
}: { label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; suffix: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono text-foreground">{value}{suffix}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]}
        onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function ToggleCard({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors ${
        checked ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:bg-accent/30'
      }`}>
      <span className="font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </button>
  );
}

function BarcodeValidation({ value, format }: { value: string; format: BarcodeFmt }) {
  const result = validateBarcode(value, format);
  if (!value) return null;
  return (
    <div className={`flex items-start gap-2 text-xs rounded-md px-2.5 py-2 ${
      result.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'bg-destructive/10 text-destructive'
    }`}>
      {result.ok
        ? <CheckCircle2 className="size-3.5 mt-0.5 shrink-0" />
        : <AlertCircle className="size-3.5 mt-0.5 shrink-0" />}
      <span>{result.ok ? `Payload válido para ${format}.` : result.msg}</span>
    </div>
  );
}

function BlocksEditor({ blocks, onChange }: { blocks: BlockKey[]; onChange: (b: BlockKey[]) => void }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const labels: Record<BlockKey, string> = {
    header: 'Cabeçalho (logo + título + subtítulo)',
    carga:  'Carga (transportadora + NF + volumes)',
    code:   'Códigos (QR / barras / texto)',
    fields: 'Campos personalizados',
    destino: 'Destino / Cliente',
    obs:    'Observações',
  };

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Ordem dos blocos (arraste para reorganizar)</Label>
      <ul className="space-y-1.5">
        {blocks.map((b, i) => (
          <li key={b}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); }}
            onDragEnd={() => setDragIdx(null)}
            className={`flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-sm cursor-grab active:cursor-grabbing ${
              dragIdx === i ? 'opacity-50' : ''
            }`}>
            <GripVertical className="size-4 text-muted-foreground" />
            <span className="font-mono text-[10px] text-muted-foreground w-5">{i + 1}</span>
            <span className="flex-1">{labels[b]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PickingVarsPanel({ vars, onChange }: { vars: Vars; onChange: (v: Vars) => void }) {
  const { data: pickings = [] } = usePickings();
  const ativos = useMemo(
    () => pickings.filter((p) => ['em_separacao', 'aguardando', 'em_conferencia'].includes(p.status)),
    [pickings],
  );
  const [selected, setSelected] = useState<string>('');

  function applyPicking(numero: string) {
    const p = pickings.find((x) => x.numero === numero);
    if (!p) return;
    onChange({
      ...vars,
      romaneio: p.numero,
      cliente: p.cliente,
      nf: p.nfe_numero ?? '',
      data: new Date().toLocaleDateString('pt-BR'),
    });
    toast.success(`Variáveis preenchidas com picking ${numero}`);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Picking ativo</p>
            <p className="text-[11px] text-muted-foreground">Puxa romaneio, NF e cliente automaticamente.</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">{ativos.length} em aberto</Badge>
        </div>
        <div className="flex gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um picking…" /></SelectTrigger>
            <SelectContent>
              {ativos.length === 0 && <SelectItem value="__none" disabled>Nenhum picking em aberto</SelectItem>}
              {ativos.map((p) => (
                <SelectItem key={p.numero} value={p.numero}>
                  {p.numero} · {p.cliente}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="default" className="gap-1.5"
            disabled={!selected} onClick={() => applyPicking(selected)}>
            <RefreshCw className="size-4" /> Aplicar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Variáveis globais</Label>
        <p className="text-[11px] text-muted-foreground">
          Disponíveis em todos os modelos: {KNOWN_VARS.map((v) => `{{${v}}}`).join(', ')}.
        </p>
        <KeyValueEditor value={vars} onChange={onChange} suggested={KNOWN_VARS as unknown as string[]} />
      </div>
    </div>
  );
}

function KeyValueEditor({
  value, onChange, suggested,
}: { value: Vars; onChange: (v: Vars) => void; suggested?: string[] }) {
  const entries = Object.entries(value);
  const [newKey, setNewKey] = useState('');

  function setKey(k: string, v: string) { onChange({ ...value, [k]: v }); }
  function removeKey(k: string) {
    const { [k]: _omit, ...rest } = value;
    onChange(rest);
  }
  function addNew() {
    const k = newKey.trim();
    if (!k) return;
    if (value[k] !== undefined) return toast.error('Variável já existe.');
    onChange({ ...value, [k]: '' });
    setNewKey('');
  }

  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr_auto] gap-2 items-center">
          <code className="font-mono text-xs bg-muted px-2 py-1.5 rounded">{`{{${k}}}`}</code>
          <Input value={v} onChange={(e) => setKey(k, e.target.value)} placeholder={`Valor para ${k}`} />
          <Button size="icon" variant="ghost" onClick={() => removeKey(k)}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <Input value={newKey} onChange={(e) => setNewKey(e.target.value)}
          placeholder="nome_da_variavel"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNew(); } }} />
        <Button size="sm" variant="outline" className="gap-1.5" onClick={addNew}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
      {suggested && suggested.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {suggested.filter((k) => value[k] === undefined).map((k) => (
            <Button key={k} size="sm" variant="ghost" className="h-6 px-2 text-[10px] font-mono"
              onClick={() => onChange({ ...value, [k]: '' })}>
              + {`{{${k}}}`}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function PresetsDialog({
  open, onOpenChange, onApply, onApplyAndPrint,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApply: (id: string) => void;
  onApplyAndPrint: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reseta seleção sempre que o diálogo abre, evitando estado "preso" entre aberturas.
  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  const selectedPreset = selectedId
    ? LABEL_PRESETS.find((p) => p.id === selectedId) ?? null
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xl">
        <DialogHeader>
          <DialogTitle>Presets de etiqueta</DialogTitle>
          <DialogDescription>
            Selecione um modelo na lista abaixo e escolha uma ação. "Aplicar e imprimir" usa as dimensões, margens e orientação do preset automaticamente — como um driver de impressora.
          </DialogDescription>
        </DialogHeader>

        <div
          role="radiogroup"
          aria-label="Presets de etiqueta"
          className="flex flex-col gap-1.5 max-h-[55vh] overflow-y-auto pr-1"
        >
          {LABEL_PRESETS.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedId(p.id)}
                onDoubleClick={() => onApply(p.id)}
                className={`group flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-transparent group-hover:border-primary/40'
                  }`}
                  aria-hidden="true"
                >
                  <CheckCircle2 className="size-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{p.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{p.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground min-h-[1rem]">
            {selectedPreset ? <>Selecionado: <span className="font-medium text-foreground">{selectedPreset.label}</span></> : 'Nenhum preset selecionado'}
          </p>
          <div className="flex gap-2 sm:justify-end">
            <Button variant="outline" size="sm" disabled={!selectedId} onClick={() => selectedId && onApply(selectedId)}>
              Aplicar
            </Button>
            <Button size="sm" disabled={!selectedId} onClick={() => selectedId && onApplyAndPrint(selectedId)}>
              <Printer className="size-4" /> Aplicar e imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  open, onOpenChange, history, onReprint, onClear,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  history: PrintHistoryEntry[];
  onReprint: (e: PrintHistoryEntry) => void;
  onClear: () => void;
}) {
  const stats = useMemo(() => historyStatsByTemplate(history), [history]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Histórico de impressões</DialogTitle>
          <DialogDescription>
            {history.length} impressão(ões). Reimprima diretamente do snapshot.
          </DialogDescription>
        </DialogHeader>

        {stats.length > 0 && (
          <div className="rounded-md border border-border bg-muted/30 p-2.5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Por modelo</p>
            <div className="flex flex-wrap gap-1.5">
              {stats.map((s) => (
                <Badge key={s.id} variant="secondary" className="font-mono text-[11px]">
                  {s.name} · {s.count}× ({s.copies} cópias)
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma impressão registrada ainda.</p>
          )}
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{h.templateName}</p>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {h.method === 'browser' ? 'navegador' : h.method}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(h.printedAt).toLocaleString('pt-BR')} · {h.copies}× · payload: <span className="font-mono">{h.payload || '—'}</span>
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onReprint(h)}>
                  <Printer className="size-4" /> Reimprimir
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClear} disabled={history.length === 0}>Limpar histórico</Button>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function LabelSheet({ t }: { t: LabelTemplate }) {
  const dims = resolveDims(t);
  const codeValue = (t.codePayload || t.codigo || t.titulo || '').slice(0, 700);
  const alignClass = t.align === 'left' ? 'text-left' : t.align === 'right' ? 'text-right' : 'text-center';
  const flexAlign = t.align === 'left' ? 'items-start' : t.align === 'right' ? 'items-end' : 'items-center';
  const justify = t.align === 'left' ? 'justify-start' : t.align === 'right' ? 'justify-end' : 'justify-center';
  const borderClass =
    t.borderStyle === 'none' ? 'border-0'
    : t.borderStyle === 'dashed' ? 'border border-dashed border-border'
    : 'border border-border';

  if (t.bartenderEnabled && t.bartenderImage) {
    return (
      <div className={`label-sheet bg-white text-black ${borderClass} rounded-md mx-auto mb-4 overflow-hidden`}
        style={{ width: `${dims.w}mm`, height: `${dims.h}mm`, padding: 0 }}>
        <img src={t.bartenderImage} alt="BarTender" className="w-full h-full object-contain bg-white" />
      </div>
    );
  }

  function renderBlock(b: BlockKey) {
    switch (b) {
      case 'header':
        return (
          <div key="header" className="border-b-2 border-black pb-1.5">
            <div className={`flex ${flexAlign} gap-2 ${justify}`}>
              {t.logoDataUrl && (
                <img src={t.logoDataUrl} alt="" style={{ height: `${t.titleSize * 2}pt` }} className="object-contain" />
              )}
              <p className="font-bold uppercase tracking-widest leading-tight"
                style={{ fontSize: `${t.titleSize}pt` }}>
                {t.titulo || '—'}
              </p>
            </div>
            {t.subtitulo && (
              <p style={{ fontSize: `${Math.max(7, t.titleSize - 4)}pt` }} className="mt-0.5">
                {t.subtitulo}
              </p>
            )}
          </div>
        );
      case 'code':
        return (
          <div key="code" className={`flex-1 flex flex-col ${flexAlign} justify-center gap-2 py-2`}>
            {t.codigo && (
              <p className="font-mono font-extrabold leading-none break-all"
                style={{ fontSize: `${t.codigo.length > 14 ? t.codeFontSize - 6 : t.codeFontSize}pt` }}>
                {t.codigo}
              </p>
            )}
            {t.showQr && codeValue && (
              <QRCodeCanvas value={codeValue} size={t.codeSize} level="M" includeMargin={false} />
            )}
            {t.showBarcode && codeValue && (
              <Barcode value={codeValue} format={t.barcodeFmt} width={t.codeSize * 1.2} />
            )}
          </div>
        );
      case 'fields': {
        const visible = t.customFields.filter((f) => f.value.trim());
        if (visible.length === 0) return null;
        return (
          <div key="fields" className="border-t border-dashed border-black/40 pt-1 space-y-0.5">
            {visible.map((f) => (
              <div key={f.id} className="flex justify-between gap-2 text-[8pt] leading-tight">
                <span className="font-semibold uppercase tracking-wide text-black/60">{f.label}</span>
                <span className="font-mono text-right">{f.value}</span>
              </div>
            ))}
          </div>
        );
      }
      case 'destino':
        if (!t.destino) return null;
        return (
          <div key="destino" className="border-t border-black pt-1.5 mt-1">
            <p className="text-[7pt] uppercase tracking-wider text-black/60">Destino</p>
            <p style={{ fontSize: `${Math.max(8, t.titleSize - 2)}pt` }} className="font-semibold leading-tight">
              {t.destino}
            </p>
          </div>
        );
      case 'obs':
        if (!t.observacoes) return null;
        return (
          <p key="obs" className="mt-1 text-[8pt] leading-tight whitespace-pre-wrap border-t border-dashed border-black/40 pt-1">
            {t.observacoes}
          </p>
        );
      default:
        return null;
    }
  }

  return (
    <div className={`label-sheet bg-white text-black ${borderClass} rounded-md mx-auto mb-4 overflow-hidden`}
      style={{ width: `${dims.w}mm`, height: `${dims.h}mm`, padding: `${t.paddingMm}mm` }}>
      <div className={`h-full w-full flex flex-col ${alignClass}`}
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {t.blocksOrder.map(renderBlock)}
      </div>
    </div>
  );
}

function PrintStyles({ wMm, hMm }: { wMm: number; hMm: number }) {
  return (
    <style>{`
      @media print {
        @page { size: ${wMm}mm ${hMm}mm; margin: 0; }
        body * { visibility: hidden !important; }
        .label-sheet, .label-sheet * { visibility: visible !important; }
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import {
  Printer, Tag, Save, Trash2, Plus, Copy, Download, Upload, Image as ImageIcon, X,
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// ============================================================================
// Types
// ============================================================================

type PageSize = '100x150' | '100x100' | '80x60' | '60x40' | '50x30' | 'custom';
type CodeMode = 'none' | 'qr' | 'barcode';
type BarcodeFmt = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'ITF14' | 'UPC';
type Align = 'left' | 'center' | 'right';

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface LabelTemplate {
  id: string;
  name: string;
  updatedAt: number;
  // Conteúdo
  titulo: string;
  subtitulo: string;
  codigo: string;
  destino: string;
  observacoes: string;
  customFields: CustomField[];
  logoDataUrl: string | null;
  // BarTender import (imagem exportada do BarTender ocupa a etiqueta inteira)
  bartenderImage: string | null;     // dataURL PNG/JPG
  bartenderFileName: string | null;  // nome original (.btw guardado só como referência)
  bartenderEnabled: boolean;         // quando true, esconde campos e imprime só a imagem
  // Código (QR/Barcode)
  codeMode: CodeMode;
  codePayload: string;
  barcodeFmt: BarcodeFmt;
  codeSize: number; // 80–320 px aprox
  // Layout
  pageSize: PageSize;
  customWidth: number;  // mm (usado quando pageSize='custom')
  customHeight: number; // mm
  titleSize: number; // pt
  codeFontSize: number; // pt
  align: Align;
  borderStyle: 'none' | 'solid' | 'dashed';
  paddingMm: number;
  // Impressão
  copias: number;
}

const STORAGE_KEY = 'exp_label_templates_v2';
const ACTIVE_KEY = 'exp_label_active_v2';

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

const DEFAULT_TEMPLATE: Omit<LabelTemplate, 'id' | 'name' | 'updatedAt'> = {
  titulo: 'EXPEDIÇÃO',
  subtitulo: '',
  codigo: '',
  destino: '',
  observacoes: '',
  customFields: [],
  logoDataUrl: null,
  bartenderImage: null,
  bartenderFileName: null,
  bartenderEnabled: false,
  codeMode: 'qr',
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
  copias: 1,
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeTemplate(name = 'Novo modelo', overrides: Partial<LabelTemplate> = {}): LabelTemplate {
  return { id: newId(), name, updatedAt: Date.now(), ...DEFAULT_TEMPLATE, ...overrides };
}

// ============================================================================
// Persistence
// ============================================================================

function loadTemplates(): LabelTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveTemplates(list: LabelTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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

  // Garante activeId válido após primeiro render
  useEffect(() => {
    if (!templates.some((t) => t.id === activeId)) {
      setActiveId(templates[0]?.id ?? '');
    }
  }, [templates, activeId]);

  const active = templates.find((t) => t.id === activeId) ?? templates[0];

  // Auto-save de qualquer alteração (debounced)
  useEffect(() => {
    const id = setTimeout(() => saveTemplates(templates), 250);
    return () => clearTimeout(id);
  }, [templates]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  function update<K extends keyof LabelTemplate>(key: K, value: LabelTemplate[K]) {
    setTemplates((list) =>
      list.map((t) => (t.id === activeId ? { ...t, [key]: value, updatedAt: Date.now() } : t)),
    );
  }

  function addCustomField() {
    update('customFields', [...active.customFields, { id: newId(), label: 'Campo', value: '' }]);
  }
  function updateCustomField(id: string, patch: Partial<CustomField>) {
    update(
      'customFields',
      active.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
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
        setTemplates((l) => [...l, ...arr.map((t: LabelTemplate) => ({ ...t, id: newId() }))]);
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
      // .btw é binário proprietário do BarTender — guardamos só a referência do nome
      setTemplates((list) => list.map((t) => t.id === activeId
        ? { ...t, bartenderFileName: file.name, updatedAt: Date.now() }
        : t));
      toast.info('Arquivo .btw salvo como referência. Para imprimir, exporte como PNG no BarTender e envie a imagem.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTemplates((list) => list.map((t) => t.id === activeId
        ? {
            ...t,
            bartenderImage: String(reader.result),
            bartenderFileName: file.name,
            bartenderEnabled: true,
            updatedAt: Date.now(),
          }
        : t));
      toast.success('Etiqueta BarTender importada.');
    };
    reader.readAsDataURL(file);
  }

  if (!active) return null;

  const dims = PAGE_DIMS[active.pageSize];

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
        onPrint={() => {
          if (!active.titulo.trim() && !active.codigo.trim()) {
            return toast.error('Preencha pelo menos o título ou código.');
          }
          window.print();
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 print:block">
        {/* Form */}
        <Card className="print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personalização</CardTitle>
            <CardDescription>
              Tudo é salvo automaticamente. Campos vazios não aparecem na impressão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="conteudo" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                <TabsTrigger value="codigo">Código</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
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

              {/* CÓDIGO */}
              <TabsContent value="codigo" className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                  <Select value={active.codeMode}
                    onValueChange={(v: CodeMode) => update('codeMode', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="barcode">Código de barras</SelectItem>
                      <SelectItem value="none">Nenhum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {active.codeMode !== 'none' && (
                  <>
                    <TextField label="Payload (vazio = usa código principal)" mono
                      value={active.codePayload} onChange={(v) => update('codePayload', v)}
                      placeholder={active.codigo || 'ROM-00123'} />

                    {active.codeMode === 'barcode' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Formato</Label>
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
                    )}

                    <SliderField label="Tamanho do código" suffix="px"
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

                <SliderField label="Tamanho do título" suffix="pt"
                  min={8} max={24} step={1}
                  value={active.titleSize} onChange={(v) => update('titleSize', v)} />

                <SliderField label="Tamanho do código (texto)" suffix="pt"
                  min={10} max={48} step={1}
                  value={active.codeFontSize} onChange={(v) => update('codeFontSize', v)} />

                <SliderField label="Margem interna" suffix="mm"
                  min={1} max={10} step={0.5}
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
                        Envie a imagem exportada do BarTender (PNG/JPG) — ocupa toda a etiqueta. Arquivos .btw ficam só como referência.
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
                        update('bartenderImage', null);
                        update('bartenderFileName', null);
                        update('bartenderEnabled', false);
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


                <SliderField label="Cópias" suffix=""
                  min={1} max={50} step={1}
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
              <LabelSheet key={i} t={active} />
            ))}
          </div>
        </div>
      </div>

      <PrintStyles wMm={dims.w} hMm={dims.h} />
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function Header({
  templates, active, onSelect, onCreate, onDuplicate, onRemove, onRename, onExport, onImport, onPrint,
}: {
  templates: LabelTemplate[]; active: LabelTemplate;
  onSelect: (id: string) => void; onCreate: () => void; onDuplicate: () => void;
  onRemove: () => void; onRename: (name: string) => void;
  onExport: () => void; onImport: (f: File) => void; onPrint: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(active.name);
  useEffect(() => setName(active.name), [active.name, active.id]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 print:hidden">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Tag className="size-5 text-primary" /> Etiquetas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize, salve modelos e imprima em impressoras térmicas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={active.id} onValueChange={onSelect}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

function Barcode({ value, format, width }: { value: string; format: BarcodeFmt; width: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format, displayValue: true, fontSize: 12, height: 60,
        margin: 0, width: 1.6,
      });
    } catch {
      // formato incompatível com o valor — silencioso
    }
  }, [value, format]);
  return <svg ref={ref} style={{ maxWidth: `${width}px`, width: '100%', height: 'auto' }} />;
}

function LabelSheet({ t }: { t: LabelTemplate }) {
  const dims = PAGE_DIMS[t.pageSize];
  const codeValue = (t.codePayload || t.codigo || t.titulo || '').slice(0, 700);
  const alignClass = t.align === 'left' ? 'text-left' : t.align === 'right' ? 'text-right' : 'text-center';
  const flexAlign = t.align === 'left' ? 'items-start' : t.align === 'right' ? 'items-end' : 'items-center';
  const borderClass =
    t.borderStyle === 'none' ? 'border-0'
    : t.borderStyle === 'dashed' ? 'border border-dashed border-border'
    : 'border border-border';

  if (t.bartenderEnabled && t.bartenderImage) {
    return (
      <div
        className={`label-sheet bg-white text-black ${borderClass} rounded-md mx-auto mb-4 overflow-hidden`}
        style={{ width: `${dims.w}mm`, height: `${dims.h}mm`, padding: 0 }}
      >
        <img src={t.bartenderImage} alt="BarTender"
          className="w-full h-full object-contain bg-white" />
      </div>
    );
  }

  return (
    <div
      className={`label-sheet bg-white text-black ${borderClass} rounded-md mx-auto mb-4 overflow-hidden`}
      style={{ width: `${dims.w}mm`, height: `${dims.h}mm`, padding: `${t.paddingMm}mm` }}
    >
      <div
        className={`h-full w-full flex flex-col ${alignClass}`}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-1.5">
          <div className={`flex ${flexAlign} gap-2 ${t.align === 'center' ? 'justify-center' : t.align === 'right' ? 'justify-end' : 'justify-start'}`}>
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

        {/* Code + visual */}
        <div className={`flex-1 flex flex-col ${flexAlign} justify-center gap-2 py-2`}>
          {t.codigo && (
            <p className="font-mono font-extrabold leading-none break-all"
              style={{ fontSize: `${t.codigo.length > 14 ? t.codeFontSize - 6 : t.codeFontSize}pt` }}>
              {t.codigo}
            </p>
          )}
          {t.codeMode === 'qr' && codeValue && (
            <QRCodeCanvas value={codeValue} size={t.codeSize} level="M" includeMargin={false} />
          )}
          {t.codeMode === 'barcode' && codeValue && (
            <Barcode value={codeValue} format={t.barcodeFmt} width={t.codeSize * 1.2} />
          )}
        </div>

        {/* Campos custom */}
        {t.customFields.filter((f) => f.value.trim()).length > 0 && (
          <div className="border-t border-dashed border-black/40 pt-1 space-y-0.5">
            {t.customFields.filter((f) => f.value.trim()).map((f) => (
              <div key={f.id} className="flex justify-between gap-2 text-[8pt] leading-tight">
                <span className="font-semibold uppercase tracking-wide text-black/60">{f.label}</span>
                <span className="font-mono text-right">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Destino */}
        {t.destino && (
          <div className="border-t border-black pt-1.5 mt-1">
            <p className="text-[7pt] uppercase tracking-wider text-black/60">Destino</p>
            <p style={{ fontSize: `${Math.max(8, t.titleSize - 2)}pt` }} className="font-semibold leading-tight">
              {t.destino}
            </p>
          </div>
        )}

        {/* Obs */}
        {t.observacoes && (
          <p className="mt-1 text-[8pt] leading-tight whitespace-pre-wrap border-t border-dashed border-black/40 pt-1">
            {t.observacoes}
          </p>
        )}
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

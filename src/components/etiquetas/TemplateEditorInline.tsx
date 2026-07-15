/**
 * Editor inline de modelo de etiqueta — usado dentro da aba "Layout etiqueta"
 * da Central de Etiquetas (`/expedicao/etiquetas`).
 *
 * Encapsula todo o fluxo de edição que antes vivia em EditarEtiquetaPage:
 * dimensões, ZPL interativo, variáveis, logo, presets, valores de teste e
 * salvamento. Sem router, sem barra de topo global — a Central hospeda tudo.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, Trash2, Plus, Printer, Package, ChevronDown,
  AlertTriangle, Code2, CheckCircle2, Loader2, Ruler, Sparkles, Layers,
  Sliders, Variable, MousePointer2, Upload, ImageIcon, X, Type, QrCode, Barcode,
  Minus, Square, SquareDashed, FlaskConical, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAtualizarTemplate, useEtiqueta, useDuplicarTemplate } from '@/hooks/useEtiquetas';
import { InteractiveZPLEditor, appendZplBlock, createNewBlock } from '@/components/etiquetas/InteractiveZPLEditor';
import {
  PRESETS_TAMANHO,
  VARIAVEIS_INTELIGENTES,
  type CategoriaEtiqueta,
  type TipoVariavel,
  type VariavelTemplate,
} from '@/types/etiquetas';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { LABEL_PX_PER_MM } from '@/components/labels/LabelTemplates';

const TIPOS: TipoVariavel[] = ['text', 'select', 'date', 'barcode', 'qr', 'auto'];
const CATEGORIAS: { key: CategoriaEtiqueta; label: string }[] = [
  { key: 'expedicao', label: 'Expedição' },
  { key: 'conferencia', label: 'Conferência' },
  { key: 'devolucao', label: 'Devolução' },
  { key: 'custom', label: 'Personalizada' },
];

function extractReferencedVars(zpl: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(zpl)) !== null) set.add(m[1]);
  return Array.from(set);
}

interface TemplateEditorInlineProps {
  templateId: string | null;
  onCreateNew?: () => void;
}

export function TemplateEditorInline({ templateId, onCreateNew }: TemplateEditorInlineProps) {
  const navigate = useNavigate();
  const { data: template, isLoading } = useEtiqueta(templateId ?? undefined);
  const atualizar = useAtualizarTemplate();
  const duplicar = useDuplicarTemplate();
  const labelSettings = useAppStore((s) => s.labelSettings);
  const previewBorderWidth = labelSettings.expedicaoBorderWidth ?? 0;
  const previewBorderStyle = labelSettings.expedicaoBorderStyle ?? 'none';
  const previewBorderRadius = labelSettings.expedicaoBorderRadius ?? 0;
  const previewPadding = labelSettings.expedicaoPadding ?? 0;
  const previewOffsetX = (labelSettings.expedicaoPrintOffsetXMm ?? 0) * LABEL_PX_PER_MM;
  const previewOffsetY = (labelSettings.expedicaoPrintOffsetYMm ?? 0) * LABEL_PX_PER_MM;
  const previewLineThickness = labelSettings.expedicaoLineThickness ?? 2;
  const previewLineStyle = labelSettings.expedicaoLineStyle ?? 'solid';
  const previewLineColor = labelSettings.expedicaoLineColor ?? '#111111';
  const previewFontFamily = labelSettings.expedicaoFontFamily ?? 'monospace';

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaEtiqueta>('expedicao');
  const [largura, setLargura] = useState(100);
  const [altura, setAltura] = useState(150);
  const [zpl, setZplState] = useState('');
  const [variaveis, setVariaveis] = useState<VariavelTemplate[]>([]);
  const [previewMode, setPreviewMode] = useState<'interativo' | 'zpl'>('interativo');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [dirty, setDirty] = useState(false);
  const skipDirtyRef = useRef(true);

  // Histórico para undo/redo do ZPL (mantém últimas 100 alterações).
  const historyPast = useRef<string[]>([]);
  const historyFuture = useRef<string[]>([]);
  const historyLock = useRef(false);

  const setZpl = useCallback((next: string | ((prev: string) => string)) => {
    setZplState((prev) => {
      const val = typeof next === 'function' ? (next as (p: string) => string)(prev) : next;
      if (val === prev) return prev;
      if (!historyLock.current) {
        historyPast.current.push(prev);
        if (historyPast.current.length > 100) historyPast.current.shift();
        historyFuture.current = [];
      }
      return val;
    });
  }, []);

  const undoZpl = useCallback(() => {
    setZplState((prev) => {
      const p = historyPast.current.pop();
      if (p === undefined) return prev;
      historyFuture.current.push(prev);
      return p;
    });
  }, []);

  const redoZpl = useCallback(() => {
    setZplState((prev) => {
      const f = historyFuture.current.pop();
      if (f === undefined) return prev;
      historyPast.current.push(prev);
      return f;
    });
  }, []);

  const LOGO_VAR_KEY = '__logo_src__';

  const onLogoUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      setLogoUrl(url);
      if (templateId) {
        try { localStorage.setItem(`etiqueta-logo-${templateId}`, url); } catch { /* quota */ }
      }
      setZpl((prev) => (/\{\{\s*logo\s*\}\}/i.test(prev) ? prev : appendZplBlock(prev, createNewBlock('logo', { largura, altura }))));
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoUrl('');
    if (templateId) localStorage.removeItem(`etiqueta-logo-${templateId}`);
  };

  const addElement = (tipo: 'text' | 'qr' | 'barcode' | 'line-h' | 'line-v' | 'rect' | 'box-filled') => {
    setZpl((prev) => appendZplBlock(prev, createNewBlock(tipo, { largura, altura })));
  };

  const [previewOverrides, setPreviewOverrides] = useState<Record<string, string>>({});
  const [showPreviewValues, setShowPreviewValues] = useState(false);

  useEffect(() => {
    if (!template) return;
    skipDirtyRef.current = true;
    historyLock.current = true;
    historyPast.current = [];
    historyFuture.current = [];
    setNome(template.nome);
    setCategoria(template.categoria);
    setLargura(template.dimensoes.largura);
    setAltura(template.dimensoes.altura);
    setZplState(template.zpl);
    // Extrai logo persistida na variável interna, mantém demais variáveis visíveis.
    const logoVar = template.variaveis.find((v) => v.chave === LOGO_VAR_KEY);
    const visibleVars = template.variaveis.filter((v) => v.chave !== LOGO_VAR_KEY);
    setVariaveis(visibleVars);
    // Preferência: logo salva no template > fallback localStorage antigo.
    const fallback = templateId ? localStorage.getItem(`etiqueta-logo-${templateId}`) : null;
    setLogoUrl(logoVar?.padrao || fallback || '');
    queueMicrotask(() => {
      skipDirtyRef.current = false;
      historyLock.current = false;
      setDirty(false);
    });
  }, [template, templateId]);

  useEffect(() => {
    if (skipDirtyRef.current) return;
    setDirty(true);
  }, [nome, categoria, largura, altura, zpl, variaveis, logoUrl]);

  const salvar = useCallback(async () => {
    if (!templateId) return;
    // Serializa a logo dentro das variáveis persistidas — mesmo escopo do template.
    const varsToSave: VariavelTemplate[] = [...variaveis];
    if (logoUrl) {
      varsToSave.push({
        chave: LOGO_VAR_KEY,
        label: 'Logo (imagem)',
        tipo: 'auto',
        obrigatorio: false,
        padrao: logoUrl,
        descricao: 'Logo do template — persistida como imagem base64.',
        ordem: 9999,
      });
    }
    await atualizar.mutateAsync({
      id: templateId,
      data: {
        nome: nome.trim(),
        categoria,
        dimensoes: { largura, altura },
        zpl,
        variaveis: varsToSave,
      },
    });
    setDirty(false);
  }, [templateId, nome, categoria, largura, altura, zpl, variaveis, logoUrl, atualizar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); return; }
      if (typing) return;
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undoZpl(); return; }
      if ((ctrl && e.key.toLowerCase() === 'y') || (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault(); redoZpl(); return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [salvar, undoZpl, redoZpl]);

  const addVar = () => {
    setVariaveis((prev) => [
      ...prev,
      { chave: `campo${prev.length + 1}`, label: `Campo ${prev.length + 1}`, tipo: 'text', obrigatorio: false, ordem: prev.length },
    ]);
  };
  const removeVar = (i: number) => setVariaveis((prev) => prev.filter((_, idx) => idx !== i));
  const updateVar = (i: number, patch: Partial<VariavelTemplate>) => {
    setVariaveis((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };

  const importInteligente = (chave: string) => {
    const inteligente = VARIAVEIS_INTELIGENTES.find((v) => v.chave === chave);
    if (!inteligente) return;
    if (variaveis.some((v) => v.chave === inteligente.chave)) return;
    setVariaveis((prev) => [
      ...prev,
      {
        chave: inteligente.chave,
        label: inteligente.label,
        tipo: inteligente.tipo,
        obrigatorio: false,
        opcoes: inteligente.opcoes ? [...inteligente.opcoes] : undefined,
        padrao: inteligente.padrao,
        descricao: inteligente.desc,
        ordem: prev.length,
      },
    ]);
  };

  const aplicaPreset = (nomePreset: string) => {
    const p = PRESETS_TAMANHO.find((x) => x.nome === nomePreset);
    if (!p) return;
    setLargura(p.largura);
    setAltura(p.altura);
  };

  const valoresExemplo = useMemo(() => {
    const v: Record<string, string> = {};
    variaveis.forEach((x) => {
      if (x.tipo === 'barcode') v[x.chave] = 'RO-2024-001234';
      else if (x.tipo === 'date') v[x.chave] = new Date().toLocaleDateString('pt-BR');
      else v[x.chave] = x.label;
    });
    return { ...v, ...previewOverrides };
  }, [variaveis, previewOverrides]);

  const referenced = useMemo(() => extractReferencedVars(zpl), [zpl]);
  const definidasSet = useMemo(() => new Set(variaveis.map((v) => v.chave)), [variaveis]);
  const naoDefinidas = useMemo(() => referenced.filter((k) => !definidasSet.has(k)), [referenced, definidasSet]);

  if (!templateId) {
    return (
      <div className="border border-dashed border-border/60 rounded-xl p-10 text-center bg-muted/20">
        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-medium mb-1">Selecione um modelo para editar</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
          Escolha um modelo ativo no seletor acima, ou crie um novo modelo para começar a editar
          seu layout de etiqueta.
        </p>
        {onCreateNew && (
          <Button size="sm" onClick={onCreateNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Criar novo modelo
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando modelo...
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Template não encontrado.
      </div>
    );
  }

  const presetAtual = PRESETS_TAMANHO.find((p) => p.largura === largura && p.altura === altura);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* ============ BARRA COMPACTA ============ */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-card/60">
          <div className="min-w-0 flex items-center gap-2 flex-1">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-sm font-semibold truncate max-w-[280px]" title={nome}>
              {nome || 'Sem nome'}
            </h2>
            <SaveIndicator dirty={dirty} saving={atualizar.isPending} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Ruler className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{presetAtual?.nome || 'Personalizado'}</span>
                <Badge variant="secondary" className="font-mono text-[10px] h-5">{largura}×{altura}mm</Badge>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Presets</DropdownMenuLabel>
              {PRESETS_TAMANHO.map((p) => (
                <DropdownMenuItem key={p.nome} onClick={() => aplicaPreset(p.nome)}>
                  <div className="flex items-center justify-between w-full">
                    <span>{p.nome}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{p.largura}×{p.altura}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicar.mutate(templateId)}
            className="gap-1.5 h-8"
          >
            <FileText className="h-3.5 w-3.5" /> Duplicar
          </Button>

          <Button
            size="sm"
            onClick={salvar}
            disabled={atualizar.isPending || !dirty}
            className="gap-1.5 h-8"
          >
            {atualizar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-1.5 h-8">
                <Printer className="h-3.5 w-3.5" /> Imprimir
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate(`/expedicao/etiquetas/${templateId}/imprimir`)}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir agora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/expedicao/etiquetas/${templateId}/imprimir?modo=teste`)}>
                <Sparkles className="mr-2 h-4 w-4" /> Impressão de teste
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/expedicao/etiquetas/${templateId}/imprimir?modo=lote`)}>
                <Layers className="mr-2 h-4 w-4" /> Impressão em lote
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/expedicao/etiquetas/historico')}>
                Ver histórico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ============ 2 PAINÉIS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)] min-h-[560px]">
          {/* --------- FORMULÁRIO --------- */}
          <main className="min-h-0 overflow-y-auto max-h-[calc(100vh-260px)]" aria-label="Editor de modelo de etiqueta">
            <div className="p-4 md:p-5 space-y-4">
              <Accordion type="multiple" defaultValue={['content', 'style', 'vars']} className="space-y-3">
                <AccordionItem value="content" className="border border-border/60 rounded-lg bg-background/40 overflow-hidden">
                  <AccordionTrigger className="px-4 py-2.5 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" /> Conteúdo
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 space-y-3">
                    <FormField id="nome" label="Nome do modelo">
                      <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Romaneio Expedição Padrão" />
                    </FormField>
                    <FormField id="categoria" label="Categoria">
                      <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaEtiqueta)}>
                        <SelectTrigger id="categoria"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((c) => (<SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="style" className="border border-border/60 rounded-lg bg-background/40 overflow-hidden">
                  <AccordionTrigger className="px-4 py-2.5 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sliders className="h-4 w-4 text-primary" /> Estilo
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 space-y-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Dimensões</div>
                      <div className="grid grid-cols-2 gap-3 max-w-xs">
                        <FormField id="larg" label="Largura (mm)">
                          <Input id="larg" type="number" inputMode="numeric" min={20} max={300} value={largura}
                            onChange={(e) => setLargura(parseInt(e.target.value, 10) || 0)} className="font-mono" />
                        </FormField>
                        <FormField id="alt" label="Altura (mm)">
                          <Input id="alt" type="number" inputMode="numeric" min={20} max={400} value={altura}
                            onChange={(e) => setAltura(parseInt(e.target.value, 10) || 0)} className="font-mono" />
                        </FormField>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Logo</div>
                      <div className="flex items-center gap-3 border border-border/60 rounded-lg p-3 bg-background/60">
                        <div className="h-14 w-24 rounded border border-border/60 bg-white flex items-center justify-center overflow-hidden shrink-0">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-primary hover:underline">
                            <Upload className="h-3.5 w-3.5" />
                            {logoUrl ? 'Trocar imagem' : 'Fazer upload'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && onLogoUpload(e.target.files[0])}
                            />
                          </label>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Substitui o texto no bloco <code className="font-mono">{`{{logo}}`}</code>. PNG/JPG/SVG.
                          </p>
                        </div>
                        {logoUrl && (
                          <Button variant="ghost" size="icon" onClick={clearLogo} aria-label="Remover logo" className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                      Tipografia, padding, alinhamento e borda são definidos diretamente no layout ZPL — use o preview interativo à direita para arrastar e ajustar cada bloco.
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>
          </main>

          {/* --------- PREVIEW --------- */}
          <aside className="flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-border/60 bg-muted/20" aria-label="Pré-visualização da etiqueta">
            <div className="shrink-0 border-b border-border/60 bg-card/50 backdrop-blur px-3 py-2 flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-md border border-border/60 bg-background overflow-hidden">
                <PreviewToggleBtn active={previewMode === 'interativo'} onClick={() => setPreviewMode('interativo')}>
                  <MousePointer2 className="h-3.5 w-3.5" /> Preview
                </PreviewToggleBtn>
                <PreviewToggleBtn active={previewMode === 'zpl'} onClick={() => setPreviewMode('zpl')}>
                  <Code2 className="h-3.5 w-3.5" /> ZPL
                </PreviewToggleBtn>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                {previewMode === 'interativo' && (
                  <div className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-background overflow-hidden mr-1">
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('text')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Adicionar texto"><Type className="h-3 w-3" /></button>
                    </TooltipTrigger><TooltipContent>Adicionar texto</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('qr')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Adicionar QR"><QrCode className="h-3 w-3" /></button>
                    </TooltipTrigger><TooltipContent>Adicionar QR Code</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('barcode')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Adicionar código de barras"><Barcode className="h-3 w-3" /></button>
                    </TooltipTrigger><TooltipContent>Adicionar código de barras</TooltipContent></Tooltip>
                    <div className="w-px bg-border/60 self-stretch" />
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('line-h')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Linha horizontal"><Minus className="h-3 w-3" /></button>
                    </TooltipTrigger><TooltipContent>Linha horizontal</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('line-v')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Linha vertical"><Minus className="h-3 w-3 rotate-90" /></button>
                    </TooltipTrigger><TooltipContent>Linha vertical</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('rect')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Retângulo"><SquareDashed className="h-3 w-3" /></button>
                    </TooltipTrigger><TooltipContent>Retângulo</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('box-filled')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Box preenchido"><Square className="h-3 w-3 fill-current" /></button>
                    </TooltipTrigger><TooltipContent>Box preenchido</TooltipContent></Tooltip>
                  </div>
                )}
                <Tooltip><TooltipTrigger asChild>
                  <button
                    onClick={() => setShowPreviewValues((v) => !v)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-border/60',
                      showPreviewValues ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:text-foreground',
                    )}
                    aria-label="Valores de teste"
                  >
                    <FlaskConical className="h-3 w-3" />
                  </button>
                </TooltipTrigger><TooltipContent>Valores fictícios para preview</TooltipContent></Tooltip>
                <Badge variant="outline" className="font-mono text-[10px] h-5 gap-1">
                  <Ruler className="h-2.5 w-2.5" /> {largura}×{altura}mm
                </Badge>
              </div>
            </div>

            {showPreviewValues && (
              <div className="shrink-0 border-b border-border/60 bg-background/60 px-3 py-2 space-y-1.5 max-h-40 overflow-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Valores de teste (só preview)</span>
                  {Object.keys(previewOverrides).length > 0 && (
                    <button onClick={() => setPreviewOverrides({})} className="text-[10px] text-muted-foreground hover:text-destructive">Limpar</button>
                  )}
                </div>
                {variaveis.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">Defina variáveis para testá-las aqui.</p>
                ) : variaveis.map((v) => (
                  <div key={v.chave} className="grid grid-cols-[110px_1fr] gap-2 items-center">
                    <span className="font-mono text-[10px] text-muted-foreground truncate" title={v.label}>{`{{${v.chave}}}`}</span>
                    <Input
                      value={previewOverrides[v.chave] ?? ''}
                      onChange={(e) => setPreviewOverrides((prev) => ({ ...prev, [v.chave]: e.target.value }))}
                      placeholder={v.label}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto p-4 flex items-start justify-center">
              {previewMode === 'zpl' ? (
                <pre className="w-full text-[11px] font-mono leading-relaxed p-3 rounded-md border border-border/60 bg-background overflow-auto whitespace-pre-wrap break-all text-foreground/90 select-all">
                  {zpl || '// Layout ZPL vazio'}
                </pre>
              ) : (
                <div className="w-full max-w-[360px]">
                  <div
                    className="relative bg-white shadow-sm overflow-hidden"
                    style={{
                      aspectRatio: `${largura} / ${altura}`,
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <InteractiveZPLEditor
                      zpl={zpl}
                      onChange={setZpl}
                      valores={valoresExemplo}
                      dimensoes={{ largura, altura }}
                      variaveis={variaveis.map((v) => ({ chave: v.chave, label: v.label }))}
                      logoUrl={logoUrl}
                      lineThickness={previewLineThickness}
                      lineStyle={previewLineStyle}
                      lineColor={previewLineColor}
                      fontFamily={previewFontFamily}
                      borderWidth={previewBorderWidth}
                      borderStyle={previewBorderStyle}
                      borderRadius={previewBorderRadius}
                      padding={previewPadding}
                      offsetX={previewOffsetX}
                      offsetY={previewOffsetY}
                    />
                  </div>
                  {previewBorderStyle !== 'none' && previewBorderWidth > 0 && (
                    <p className="mt-2 text-[10px] text-muted-foreground text-center">
                      Borda ativa: {previewBorderWidth}px {previewBorderStyle} · padding {previewPadding}px · raio {previewBorderRadius}px
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border/60 bg-card/40 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <Package className="h-3 w-3" />
              {previewMode === 'interativo' ? (
                <>
                  <span>Arraste · duplo-clique edita ·</span>
                  <kbd className="px-1 rounded border border-border/60 bg-background font-mono text-[10px]">←↑↓→</kbd>
                  <span>move</span>
                  <span>·</span>
                  <kbd className="px-1 rounded border border-border/60 bg-background font-mono text-[10px]">Del</kbd>
                  <span>remove</span>
                  <span>·</span>
                  <kbd className="px-1 rounded border border-border/60 bg-background font-mono text-[10px]">Ctrl+Z/Y</kbd>
                  <span>desfaz</span>
                </>
              ) : (
                <span>Código ZPL enviado à impressora.</span>
              )}
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function FormField({
  id, label, hint, children,
}: {
  id?: string;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PreviewToggleBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  );
}

function SaveIndicator({ dirty, saving }: { dirty: boolean; saving: boolean }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-current" /> Não salvo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Salvo
    </span>
  );
}

/**
 * Editor de modelo de etiqueta — layout 2 painéis estilo BarTender.
 * Esquerda: formulário em coluna única (Conteúdo / Estilo / Variáveis).
 * Direita: preview sticky sempre visível com toggle Visual | ZPL.
 * Barra fixa no topo com Modelo/Dimensões · Salvar · Imprimir ▾.
 * Preserva 100% o comportamento de geração/persistência de ZPL.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, Plus, Printer, Package, Wand2, ChevronDown,
  AlertTriangle, Eye, Code2, CheckCircle2, Loader2, Ruler, Sparkles, Layers,
  Sliders, Variable, ExternalLink, MousePointer2, Upload, ImageIcon, X, Type, QrCode, Barcode,
  Minus, Square, SquareDashed, FlaskConical,
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAtualizarTemplate, useEtiqueta } from '@/hooks/useEtiquetas';
import { AutoCompleteZPL } from '@/components/etiquetas/AutoCompleteZPL';
import { LiveZPLPreview } from '@/components/etiquetas/LiveZPLPreview';
import { InteractiveZPLEditor, appendZplBlock, createNewBlock } from '@/components/etiquetas/InteractiveZPLEditor';
import {
  PRESETS_TAMANHO,
  VARIAVEIS_INTELIGENTES,
  type CategoriaEtiqueta,
  type TipoVariavel,
  type VariavelTemplate,
} from '@/types/etiquetas';
import { cn } from '@/lib/utils';

const TIPOS: TipoVariavel[] = ['text', 'select', 'date', 'barcode', 'qr', 'auto'];

const CATEGORIAS: { key: CategoriaEtiqueta; label: string }[] = [
  { key: 'expedicao', label: 'Expedição' },
  { key: 'conferencia', label: 'Conferência' },
  { key: 'devolucao', label: 'Devolução' },
  { key: 'custom', label: 'Personalizada' },
];

// Extrai chaves {{xxx}} referenciadas no ZPL.
function extractReferencedVars(zpl: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(zpl)) !== null) set.add(m[1]);
  return Array.from(set);
}

export default function EditarEtiquetaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: template, isLoading } = useEtiqueta(id);
  const atualizar = useAtualizarTemplate();
  useDocumentTitle(template ? `Editar · ${template.nome}` : 'Editar Etiqueta');

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaEtiqueta>('expedicao');
  const [largura, setLargura] = useState(100);
  const [altura, setAltura] = useState(150);
  const [zpl, setZpl] = useState('');
  const [variaveis, setVariaveis] = useState<VariavelTemplate[]>([]);
  const [previewMode, setPreviewMode] = useState<'interativo' | 'zpl'>('interativo');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [dirty, setDirty] = useState(false);
  const skipDirtyRef = useRef(true);

  // Persistência do logo por template (localStorage — imagem não vai para o ZPL).
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`etiqueta-logo-${id}`);
    if (saved) setLogoUrl(saved);
  }, [id]);

  const onLogoUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      setLogoUrl(url);
      if (id) localStorage.setItem(`etiqueta-logo-${id}`, url);
      // Auto-injeta {{logo}} no ZPL se não existir — garante que apareça no preview.
      setZpl((prev) => (/\{\{\s*logo\s*\}\}/i.test(prev) ? prev : appendZplBlock(prev, createNewBlock('logo', { largura, altura }))));
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoUrl('');
    if (id) localStorage.removeItem(`etiqueta-logo-${id}`);
  };

  const addElement = (tipo: 'text' | 'qr' | 'barcode' | 'line-h' | 'line-v' | 'rect' | 'box-filled') => {
    setZpl((prev) => appendZplBlock(prev, createNewBlock(tipo, { largura, altura })));
  };

  // Overrides do preview — usuário injeta valores fictícios para testar tamanhos.
  const [previewOverrides, setPreviewOverrides] = useState<Record<string, string>>({});
  const [showPreviewValues, setShowPreviewValues] = useState(false);

  useEffect(() => {
    if (!template) return;
    skipDirtyRef.current = true;
    setNome(template.nome);
    setCategoria(template.categoria);
    setLargura(template.dimensoes.largura);
    setAltura(template.dimensoes.altura);
    setZpl(template.zpl);
    setVariaveis(template.variaveis);
    // libera o marcador após o próximo tick
    queueMicrotask(() => { skipDirtyRef.current = false; setDirty(false); });
  }, [template]);

  // marcador de "não salvo"
  useEffect(() => {
    if (skipDirtyRef.current) return;
    setDirty(true);
  }, [nome, categoria, largura, altura, zpl, variaveis]);

  const salvar = useCallback(async () => {
    if (!id) return;
    await atualizar.mutateAsync({
      id,
      data: {
        nome: nome.trim(),
        categoria,
        dimensoes: { largura, altura },
        zpl,
        variaveis,
      },
    });
    setDirty(false);
  }, [id, nome, categoria, largura, altura, zpl, variaveis, atualizar]);

  // Ctrl+S / Ctrl+P
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        salvar();
      } else if (k === 'p') {
        e.preventDefault();
        if (template) navigate(`/expedicao/etiquetas/${template.id}/imprimir`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [salvar, navigate, template]);

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

  // valores de exemplo para o preview vivo (overrides do usuário têm precedência)
  const valoresExemplo = useMemo(() => {
    const v: Record<string, string> = {};
    variaveis.forEach((x) => {
      if (x.tipo === 'barcode') v[x.chave] = 'RO-2024-001234';
      else if (x.tipo === 'date') v[x.chave] = new Date().toLocaleDateString('pt-BR');
      else v[x.chave] = x.label;
    });
    return { ...v, ...previewOverrides };
  }, [variaveis, previewOverrides]);

  // variáveis referenciadas no ZPL mas não definidas
  const referenced = useMemo(() => extractReferencedVars(zpl), [zpl]);
  const definidasSet = useMemo(() => new Set(variaveis.map((v) => v.chave)), [variaveis]);
  const naoDefinidas = useMemo(() => referenced.filter((k) => !definidasSet.has(k)), [referenced, definidasSet]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando modelo...
      </div>
    );
  }
  if (!template) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">Template não encontrado.</p>
        <Button onClick={() => navigate('/expedicao/etiquetas')}>Voltar</Button>
      </div>
    );
  }

  const presetAtual = PRESETS_TAMANHO.find((p) => p.largura === largura && p.altura === altura);

  return (
    <TooltipProvider delayDuration={200}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <html lang="pt-BR" />
      </Helmet>

      <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">
        {/* ============ BARRA SUPERIOR FIXA ============ */}
        <div className="shrink-0 h-14 border-b border-border/60 bg-card/60 backdrop-blur flex items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/expedicao/etiquetas')} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate max-w-[220px]" title={nome}>{nome || 'Sem nome'}</h1>
            <SaveIndicator dirty={dirty} saving={atualizar.isPending} />
          </div>

          <div className="mx-2 h-6 w-px bg-border/60" />

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

          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 h-8 hidden md:inline-flex" disabled>
                  <Wand2 className="h-3.5 w-3.5" /> Preencher com picking
                </Button>
              </TooltipTrigger>
              <TooltipContent>Popula o preview com dados reais do picking (em breve).</TooltipContent>
            </Tooltip>

            <Button variant="outline" size="sm" onClick={salvar} disabled={atualizar.isPending || !dirty} className="gap-1.5 h-8">
              {atualizar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8">
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                  <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate(`/expedicao/etiquetas/${template.id}/imprimir`)}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir agora
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/expedicao/etiquetas/${template.id}/imprimir?modo=teste`)}>
                  <Sparkles className="mr-2 h-4 w-4" /> Impressão de teste
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/expedicao/etiquetas/${template.id}/imprimir?modo=lote`)}>
                  <Layers className="mr-2 h-4 w-4" /> Impressão em lote
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/expedicao/etiquetas/historico')}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Ver histórico
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ============ 2 PAINÉIS ============ */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px] overflow-hidden">
          {/* --------- FORMULÁRIO (esquerda) --------- */}
          <main className="min-h-0 overflow-y-auto bg-background" aria-label="Editor de modelo de etiqueta">
            <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
              <div className="sr-only">
                <h2>Configuração do modelo de etiqueta</h2>
              </div>

              <Accordion type="multiple" defaultValue={['content', 'style', 'vars']} className="space-y-3">
                {/* ---- CONTEÚDO ---- */}
                <AccordionItem value="content" className="border border-border/60 rounded-xl bg-card overflow-hidden data-[state=open]:shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Conteúdo
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 space-y-4">
                    <FormField id="nome" label="Nome do modelo">
                      <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Romaneio Expedição Padrão" />
                    </FormField>

                    <FormField id="categoria" label="Categoria">
                      <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaEtiqueta)}>
                        <SelectTrigger id="categoria"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map((c) => (
                            <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    {/* Editor ZPL textual removido — edição via preview interativo. */}
                  </AccordionContent>
                </AccordionItem>

                {/* ---- ESTILO ---- */}
                <AccordionItem value="style" className="border border-border/60 rounded-xl bg-card overflow-hidden data-[state=open]:shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sliders className="h-4 w-4 text-primary" />
                      Estilo
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

                    {/* Logo (imagem) */}
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
                      Tipografia, padding, alinhamento e borda são definidos diretamente no layout ZPL acima. Use o editor visual avançado para ajustes drag-and-drop.
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                      const el = document.getElementById('advanced-editor-anchor');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                      <Layers className="h-3.5 w-3.5" /> Abrir editor visual avançado
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* ---- VARIÁVEIS ---- */}
                <AccordionItem value="vars" className="border border-border/60 rounded-xl bg-card overflow-hidden data-[state=open]:shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Variable className="h-4 w-4 text-primary" />
                      Variáveis
                      {variaveis.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4 ml-1">{variaveis.length}</Badge>
                      )}
                      {naoDefinidas.length > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-4 gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" /> {naoDefinidas.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 space-y-4">
                    {/* Validação: variáveis referenciadas mas não definidas */}
                    {naoDefinidas.length > 0 && (
                      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-destructive">
                              {naoDefinidas.length === 1
                                ? '1 variável usada no layout, mas não definida'
                                : `${naoDefinidas.length} variáveis usadas no layout, mas não definidas`}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                              Defina-as abaixo para poder preencher no momento da impressão.
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {naoDefinidas.map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => {
                                    const inteligente = VARIAVEIS_INTELIGENTES.find((v) => v.chave === k);
                                    if (inteligente) {
                                      importInteligente(k);
                                    } else {
                                      setVariaveis((prev) => [...prev, {
                                        chave: k, label: k, tipo: 'text', obrigatorio: false, ordem: prev.length,
                                      }]);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-destructive/40 bg-background hover:bg-destructive/10 font-mono text-[10px] text-destructive transition-colors"
                                >
                                  <Plus className="h-2.5 w-2.5" /> {`{{${k}}}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={addVar} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Adicionar variável
                      </Button>
                      <Select onValueChange={importInteligente}>
                        <SelectTrigger className="w-56 h-9">
                          <SelectValue placeholder="Importar sugestão…" />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIAVEIS_INTELIGENTES.map((v) => (
                            <SelectItem key={v.chave} value={v.chave} disabled={definidasSet.has(v.chave)}>
                              <span className="flex items-center gap-2">
                                <span>{v.label}</span>
                                <span className="font-mono text-[10px] text-muted-foreground">{`{{${v.chave}}}`}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lista */}
                    {variaveis.length === 0 ? (
                      <div className="text-center p-6 border border-dashed border-border/60 rounded-lg bg-muted/20">
                        <Variable className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm font-medium mb-1">Nenhuma variável definida</p>
                        <p className="text-xs text-muted-foreground mb-3 max-w-xs mx-auto">
                          Variáveis permitem preencher partes dinâmicas no momento da impressão (romaneio, cliente, código…).
                        </p>
                        <Button size="sm" variant="secondary" onClick={addVar} className="gap-1.5">
                          <Plus className="h-3.5 w-3.5" /> Adicionar primeira variável
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {variaveis.map((v, i) => (
                          <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_auto_auto] gap-2 items-end border border-border/60 rounded-lg p-3 bg-background/60">
                            <FormField id={`var-chave-${i}`} label="Chave">
                              <Input id={`var-chave-${i}`} value={v.chave}
                                onChange={(e) => updateVar(i, { chave: e.target.value })}
                                className="font-mono text-sm" />
                            </FormField>
                            <FormField id={`var-label-${i}`} label="Rótulo">
                              <Input id={`var-label-${i}`} value={v.label}
                                onChange={(e) => updateVar(i, { label: e.target.value })} />
                            </FormField>
                            <FormField id={`var-tipo-${i}`} label="Tipo">
                              <Select value={v.tipo} onValueChange={(val) => updateVar(i, { tipo: val as TipoVariavel })}>
                                <SelectTrigger id={`var-tipo-${i}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </FormField>
                            <div className="flex items-center gap-2 pb-2">
                              <Switch checked={v.obrigatorio} onCheckedChange={(c) => updateVar(i, { obrigatorio: c })} aria-label="Obrigatório" />
                              <span className="text-[11px] text-muted-foreground">Obrig.</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeVar(i)} aria-label={`Remover variável ${v.chave}`} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Âncora para editor visual avançado */}
              <div id="advanced-editor-anchor" />
            </div>
          </main>

          {/* --------- PREVIEW STICKY (direita) --------- */}
          <aside
            className="hidden lg:flex flex-col min-h-0 border-l border-border/60 bg-muted/20"
            aria-label="Pré-visualização da etiqueta"
          >
            <div className="shrink-0 border-b border-border/60 bg-card/50 backdrop-blur px-3 py-2 flex items-center gap-2">
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
                      <button onClick={() => addElement('line-h')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Adicionar linha horizontal"><Minus className="h-3 w-3" /></button>
                    </TooltipTrigger><TooltipContent>Linha horizontal</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('line-v')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Adicionar linha vertical"><Minus className="h-3 w-3 rotate-90" /></button>
                    </TooltipTrigger><TooltipContent>Linha vertical</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('rect')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Adicionar retângulo"><SquareDashed className="h-3 w-3" /></button>
                    </TooltipTrigger><TooltipContent>Retângulo</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <button onClick={() => addElement('box-filled')} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent" aria-label="Adicionar box preenchido"><Square className="h-3 w-3 fill-current" /></button>
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
                <div
                  className="bg-white border border-border rounded-md shadow-sm overflow-hidden w-full max-w-[360px]"
                  style={{ aspectRatio: `${largura} / ${altura}` }}
                >
                  <InteractiveZPLEditor
                    zpl={zpl}
                    onChange={setZpl}
                    valores={valoresExemplo}
                    dimensoes={{ largura, altura }}
                    variaveis={variaveis.map((v) => ({ chave: v.chave, label: v.label }))}
                    logoUrl={logoUrl}
                  />
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border/60 bg-card/40 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3 w-3" />
              {previewMode === 'interativo'
                ? 'Arraste para mover · duplo-clique para ajustar variáveis, fonte, largura e alinhamento.'
                : 'Código ZPL enviado à impressora.'}
            </div>
          </aside>

          {/* Preview colapsado mobile */}
          <aside className="lg:hidden border-t border-border/60 bg-card/40 p-3" aria-label="Pré-visualização">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex rounded-md border border-border/60 bg-background overflow-hidden">
                <PreviewToggleBtn active={previewMode === 'interativo'} onClick={() => setPreviewMode('interativo')}>
                  <MousePointer2 className="h-3.5 w-3.5" /> Preview
                </PreviewToggleBtn>
                <PreviewToggleBtn active={previewMode === 'zpl'} onClick={() => setPreviewMode('zpl')}>
                  <Code2 className="h-3.5 w-3.5" /> ZPL
                </PreviewToggleBtn>
              </div>
            </div>
            {previewMode === 'zpl' ? (
              <pre className="text-[10px] font-mono p-2 rounded-md border border-border/60 bg-background overflow-auto whitespace-pre-wrap break-all max-h-64">
                {zpl}
              </pre>
            ) : (
              <div className="bg-white border border-border rounded-md overflow-hidden mx-auto max-w-[260px]" style={{ aspectRatio: `${largura} / ${altura}` }}>
                <InteractiveZPLEditor
                  zpl={zpl}
                  onChange={setZpl}
                  valores={valoresExemplo}
                  dimensoes={{ largura, altura }}
                  variaveis={variaveis.map((v) => ({ chave: v.chave, label: v.label }))}
                  logoUrl={logoUrl}
                />
              </div>
            )}
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

/**
 * Central de Etiquetas — página unificada /expedicao/etiquetas.
 *
 * Duas abas:
 *  - Operação: importar XML em lote, fila de impressão e histórico recente.
 *  - Layout etiqueta: edição completa do template ativo (dimensões, ZPL,
 *    variáveis, preview interativo) + ajustes finos globais de impressão.
 */
import { memo, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  History, Plus, Settings2, Layers, FileText, Loader2, Printer,
  ExternalLink, ChevronDown, SlidersHorizontal, Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  useEtiquetas, useEtiquetaHistorico, useDuplicarTemplate, useCriarTemplate,
} from '@/hooks/useEtiquetas';
import { usePrintQueue } from '@/hooks/usePrintQueue';
import { XmlBatchImporter } from './XmlBatchImporter';
import { PrintQueue } from './PrintQueue';
import { TemplateEditorInline } from './TemplateEditorInline';
import { ExpedicaoLayoutSection } from '@/components/settings/LabelLayoutPanel';
import {
  PRESETS_TAMANHO, VARIAVEIS_INTELIGENTES, VARIAVEIS_PADRAO, ZPL_PADRAO,
  type VariavelTemplate,
} from '@/types/etiquetas';

const ACTIVE_KEY = 'etiqueta:active-template-id';

export const CentralEtiquetas = memo(function CentralEtiquetas() {
  useDocumentTitle('Etiquetas · Expedição');
  const navigate = useNavigate();

  const { data: templates, isLoading } = useEtiquetas();
  const { data: historico } = useEtiquetaHistorico();
  const duplicar = useDuplicarTemplate();
  const criar = useCriarTemplate();

  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));
  const [tab, setTab] = useState<'operacao' | 'layout'>('operacao');
  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);

  const queue = usePrintQueue();

  useEffect(() => {
    if (!templates || templates.length === 0) return;
    const stillExists = activeId && templates.some((t) => t.id === activeId);
    if (!stillExists) {
      setActiveId(templates[0].id);
      localStorage.setItem(ACTIVE_KEY, templates[0].id);
    }
  }, [templates, activeId]);

  const activeTemplate = useMemo(
    () => templates?.find((t) => t.id === activeId) ?? null,
    [templates, activeId],
  );

  const changeActive = (id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  };

  const criarNovoModelo = async () => {
    const preset = PRESETS_TAMANHO[0];
    const variaveis: VariavelTemplate[] = VARIAVEIS_PADRAO.map((v, i) => {
      const inteligente = VARIAVEIS_INTELIGENTES.find((x) => x.chave === v.chave);
      return {
        ...v,
        opcoes: inteligente?.opcoes ? [...inteligente.opcoes] : v.opcoes,
        padrao: inteligente?.padrao ?? v.padrao,
        descricao: inteligente?.desc ?? v.descricao,
        ordem: i,
      };
    });
    const criado = await criar.mutateAsync({
      nome: `Modelo ${new Date().toLocaleDateString('pt-BR')}`,
      categoria: 'expedicao',
      dimensoes: { largura: preset.largura, altura: preset.altura },
      zpl: ZPL_PADRAO,
      variaveis,
    });
    setActiveId(criado.id);
    localStorage.setItem(ACTIVE_KEY, criado.id);
    setTab('layout');
  };

  const editarAtivo = () => {
    if (!activeTemplate) return;
    setTab('layout');
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <html lang="pt-BR" />
      </Helmet>

      <main
        className="p-4 md:p-6 space-y-5"
        aria-label="Central de etiquetas de expedição"
      >
        {/* ============ Header ============ */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Central de Etiquetas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Importe XMLs em lote, edite o layout e imprima etiquetas de expedição.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="min-w-[220px]">
              <Select
                value={activeId ?? undefined}
                onValueChange={changeActive}
                disabled={isLoading || !templates?.length}
              >
                <SelectTrigger className="h-9" aria-label="Modelo ativo">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                    <SelectValue placeholder="Selecione o modelo ativo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[220px]">{t.nome}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {t.dimensoes.largura}×{t.dimensoes.altura}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 h-9">
                  <Settings2 className="h-3.5 w-3.5" /> Modelos <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={criarNovoModelo} disabled={criar.isPending}>
                  <Plus className="mr-2 h-4 w-4" /> Novo modelo
                </DropdownMenuItem>
                {activeTemplate && (
                  <>
                    <DropdownMenuItem onClick={editarAtivo}>
                      <SlidersHorizontal className="mr-2 h-4 w-4" /> Editar modelo ativo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicar.mutate(activeTemplate.id)}>
                      <FileText className="mr-2 h-4 w-4" /> Duplicar modelo ativo
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/expedicao/etiquetas/historico')}>
                  <History className="mr-2 h-4 w-4" /> Histórico completo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ============ Tabs ============ */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'operacao' | 'layout')}>
          <TabsList>
            <TabsTrigger value="operacao">Operação</TabsTrigger>
            <TabsTrigger value="layout" className="gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Layout etiqueta
            </TabsTrigger>
          </TabsList>

          {/* ============ OPERAÇÃO ============ */}
          <TabsContent value="operacao" className="space-y-5 mt-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando modelos...
              </div>
            ) : !templates?.length ? (
              <EmptyTemplates onCreate={criarNovoModelo} loading={criar.isPending} />
            ) : (
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
                <XmlBatchImporter onImport={queue.addMany} />
                <PrintQueue
                  items={queue.items}
                  activeTemplateId={activeId}
                  onRemove={queue.remove}
                  onClear={queue.clear}
                  onPatch={queue.patch}
                />
              </div>
            )}

            {/* Histórico recente */}
            <section className="border border-border/60 rounded-xl bg-card overflow-hidden">
              <header className="flex items-center justify-between p-3 border-b border-border/60">
                <h2 className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Histórico de impressões
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => navigate('/expedicao/etiquetas/historico')}
                >
                  Ver tudo <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </header>
              {!historico || historico.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma impressão registrada ainda.
                </p>
              ) : (
                <ul className="divide-y divide-border/60 max-h-[320px] overflow-y-auto">
                  {historico.slice(0, 20).map((h) => {
                    const nf = h.variaveis_usadas?.nf;
                    const titulo = nf ? `NF ${nf}` : h.template_nome;
                    return (
                      <li key={h.id} className="flex items-center gap-3 p-3 hover:bg-muted/30">
                        <Printer className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.criado_em).toLocaleString('pt-BR')}
                            {h.usuario_nome ? ` · ${h.usuario_nome}` : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {h.quantidade}×
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </TabsContent>

          {/* ============ LAYOUT ETIQUETA ============ */}
          <TabsContent value="layout" className="space-y-4 mt-4">
            {/* Editor inline (preview + edição) */}
            {!templates?.length ? (
              <EmptyTemplates onCreate={criarNovoModelo} loading={criar.isPending} />
            ) : (
              <TemplateEditorInline templateId={activeId} onCreateNew={criarNovoModelo} />
            )}

            {/* Ajustes finos globais (colapsável) */}
            <Collapsible open={layoutSettingsOpen} onOpenChange={setLayoutSettingsOpen}>
              <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <Palette className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Ajustes finos de impressão (globais)</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Offset X/Y, borda e padding aplicados a todos os templates ZPL desta central.
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${layoutSettingsOpen ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border/60 p-4">
                    <ExpedicaoLayoutSection />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
});
CentralEtiquetas.displayName = 'CentralEtiquetas';

function EmptyTemplates({ onCreate, loading }: { onCreate: () => void; loading?: boolean }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Plus className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-lg font-medium mb-1">Nenhum modelo cadastrado</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Crie um modelo de etiqueta para começar a importar XMLs e imprimir.
      </p>
      <Button onClick={onCreate} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Criar primeiro modelo
      </Button>
    </div>
  );
}

import { memo, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { History, Plus, Search, ArrowUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDeletarTemplate, useDuplicarTemplate, useEtiquetas } from '@/hooks/useEtiquetas';
import type { EtiquetaTemplate } from '@/types/etiquetas';
import { CategoryTabs, type CategoriaFiltro } from './CategoryTabs';
import { TemplateCard, TemplateCardSkeleton } from './TemplateCard';

type SortKey = 'recent' | 'name' | 'category';

const SORT_LABEL: Record<SortKey, string> = {
  recent: 'Atualizado recentemente',
  name: 'Nome (A → Z)',
  category: 'Categoria',
};

export const EtiquetaDashboard = memo(function EtiquetaDashboard() {
  useDocumentTitle('Etiquetas · Expedição');
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todas');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  const { data: templates, isLoading } = useEtiquetas({
    categoria: categoria === 'todas' ? undefined : categoria,
  });
  const duplicar = useDuplicarTemplate();
  const deletar = useDeletarTemplate();

  const counts = useMemo(() => {
    const c: Partial<Record<CategoriaFiltro, number>> = { todas: templates?.length ?? 0 };
    templates?.forEach((t) => {
      c[t.categoria] = (c[t.categoria] ?? 0) + 1;
    });
    return c;
  }, [templates]);

  const visiveis = useMemo(() => {
    if (!templates) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? templates.filter(
          (t) =>
            t.nome.toLowerCase().includes(q) ||
            t.categoria.toLowerCase().includes(q),
        )
      : templates.slice();

    filtered.sort((a, b) => {
      if (sort === 'name') return a.nome.localeCompare(b.nome, 'pt-BR');
      if (sort === 'category') return a.categoria.localeCompare(b.categoria, 'pt-BR');
      return new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime();
    });
    return filtered;
  }, [templates, query, sort]);

  // Atalho: "N" = nova etiqueta (fora de inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/expedicao/etiquetas/nova');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const handleDelete = (t: EtiquetaTemplate) => {
    if (window.confirm(`Excluir "${t.nome}"? Templates excluídos podem ser restaurados posteriormente.`)) {
      deletar.mutate(t.id);
    }
  };

  const hasTemplates = !!templates && templates.length > 0;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <html lang="pt-BR" />
      </Helmet>

      <main
        className="p-4 md:p-6 space-y-5"
        aria-label="Templates de etiquetas de expedição"
      >
        {/* ============ Barra superior ============ */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Etiquetas de Expedição
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie modelos e imprima etiquetas de expedição, conferência e devolução.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate('/expedicao/etiquetas/historico')}
              aria-label="Ver histórico de impressões"
            >
              <History className="mr-2 h-4 w-4" aria-hidden="true" /> Histórico
            </Button>
            <Button
              onClick={() => navigate('/expedicao/etiquetas/nova')}
              aria-label="Criar nova etiqueta (atalho N)"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Nova etiqueta
            </Button>
          </div>
        </header>

        {/* ============ Filtros: categoria + busca + ordenação ============ */}
        <section aria-label="Filtros" className="space-y-3">
          <CategoryTabs value={categoria} onChange={setCategoria} counts={counts} />

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Buscar por nome ou categoria..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 pr-8 h-9"
                aria-label="Buscar templates"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-9" aria-label="Ordenar templates">
                  <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{SORT_LABEL[sort]}</span>
                  <span className="sm:hidden">Ordenar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Ordenar por
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <DropdownMenuRadioItem value="recent">{SORT_LABEL.recent}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name">{SORT_LABEL.name}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="category">{SORT_LABEL.category}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* ============ Grid / estados ============ */}
        {isLoading ? (
          <div
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-busy="true"
            aria-label="Carregando templates"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <TemplateCardSkeleton key={i} />
            ))}
          </div>
        ) : !hasTemplates ? (
          <EmptyState onCreate={() => navigate('/expedicao/etiquetas/nova')} />
        ) : visiveis.length === 0 ? (
          <NoResults query={query} onClear={() => { setQuery(''); setCategoria('todas'); }} />
        ) : (
          <div
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            role="list"
            aria-label={`${visiveis.length} template${visiveis.length === 1 ? '' : 's'}`}
          >
            {visiveis.map((t) => (
              <div key={t.id} role="listitem">
                <TemplateCard
                  template={t}
                  onPrint={() => navigate(`/expedicao/etiquetas/${t.id}/imprimir`)}
                  onEdit={() => navigate(`/expedicao/etiquetas/${t.id}/editar`)}
                  onDuplicate={() => duplicar.mutate(t.id)}
                  onDelete={() => handleDelete(t)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
});
EtiquetaDashboard.displayName = 'EtiquetaDashboard';

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-medium mb-1">Nenhuma etiqueta cadastrada</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Crie seu primeiro modelo para começar a imprimir etiquetas de expedição.
      </p>
      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Criar primeira etiqueta
      </Button>
    </div>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-10 text-center bg-card">
      <h2 className="text-base font-medium mb-1">Nenhum resultado</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {query
          ? <>Não encontramos templates para <span className="font-medium text-foreground">"{query}"</span>.</>
          : 'Nenhum template nesta categoria.'}
      </p>
      <Button variant="outline" size="sm" onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  );
}

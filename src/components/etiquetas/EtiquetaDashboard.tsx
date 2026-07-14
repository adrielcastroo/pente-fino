import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDeletarTemplate, useDuplicarTemplate, useEtiquetas } from '@/hooks/useEtiquetas';
import type { EtiquetaTemplate } from '@/types/etiquetas';
import { CategoryTabs, type CategoriaFiltro } from './CategoryTabs';
import { TemplateCard, TemplateCardSkeleton } from './TemplateCard';

export const EtiquetaDashboard = memo(function EtiquetaDashboard() {
  useDocumentTitle('Etiquetas · Expedição');
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todas');
  const { data: templates, isLoading } = useEtiquetas({ categoria: categoria === 'todas' ? undefined : categoria });
  const duplicar = useDuplicarTemplate();
  const deletar = useDeletarTemplate();

  const counts = useMemo(() => {
    const c: Partial<Record<CategoriaFiltro, number>> = { todas: templates?.length ?? 0 };
    templates?.forEach((t) => {
      c[t.categoria] = (c[t.categoria] ?? 0) + 1;
    });
    return c;
  }, [templates]);

  const handleDelete = (t: EtiquetaTemplate) => {
    if (window.confirm(`Excluir "${t.nome}"? Templates excluídos podem ser restaurados posteriormente.`)) {
      deletar.mutate(t.id);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Etiquetas de Expedição</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie templates e imprima etiquetas de expedição, conferência e devolução.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate('/expedicao/etiquetas/historico')}>
            <History className="mr-2 h-4 w-4" /> Histórico
          </Button>
          <Button onClick={() => navigate('/expedicao/etiquetas/nova')}>
            <Plus className="mr-2 h-4 w-4" /> Nova Etiqueta
          </Button>
        </div>
      </header>

      <CategoryTabs value={categoria} onChange={setCategoria} counts={counts} />

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card">
          <h2 className="text-lg font-medium mb-1">Nenhuma etiqueta cadastrada</h2>
          <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro template para começar a imprimir.</p>
          <Button onClick={() => navigate('/expedicao/etiquetas/nova')}>
            <Plus className="mr-2 h-4 w-4" /> Criar primeira etiqueta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onPrint={() => navigate(`/expedicao/etiquetas/${t.id}/imprimir`)}
              onEdit={() => navigate(`/expedicao/etiquetas/${t.id}/editar`)}
              onDuplicate={() => duplicar.mutate(t.id)}
              onDelete={() => handleDelete(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
EtiquetaDashboard.displayName = 'EtiquetaDashboard';

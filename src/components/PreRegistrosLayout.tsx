import { ReactNode, useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import RightPanel from '@/components/RightPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, SlidersHorizontal, X, Package } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PreRegistrosLayoutProps {
  /** Form (LeftPanel) rendered inside the "Adicionar Registro" modal */
  children: ReactNode;
  /** Page title shown in left header (e.g. "PréRegistros", "Madeira", "Motor / Controle") */
  title?: string;
  /** Subtitle for the filters card */
  filtersTitle?: string;
}

/**
 * New layout inspired by the "PréRegistros" mockup:
 * - Left sidebar with filters (search + item/lote/largura)
 * - Main area with KPIs and registro table (RightPanel)
 * - Floating "+ Adicionar Registro" button opens the existing bipage form in a Dialog
 *
 * All existing business logic (LeftPanel, RightPanel, store) is preserved.
 */
export default function PreRegistrosLayout({
  children,
  title = 'PréRegistros',
  filtersTitle = 'Filtros de PréRegistro',
}: PreRegistrosLayoutProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { searchQuery, setSearchQuery, registros } = useAppStore(
    useShallow(s => ({
      searchQuery: s.searchQuery,
      setSearchQuery: s.setSearchQuery,
      registros: s.registros,
    }))
  );

  // Local extra filters (item / lote / largura) — feed into the global searchQuery
  const [fItem, setFItem] = useState('');
  const [fLargura, setFLargura] = useState('');
  const [fLote, setFLote] = useState('');
  const [fMlinear, setFMlinear] = useState('');
  const [fLoteSistema, setFLoteSistema] = useState('');

  const totalFiltros = useMemo(
    () => [fItem, fLargura, fLote, fMlinear, fLoteSistema].filter(v => v.trim().length > 0).length,
    [fItem, fLargura, fLote, fMlinear, fLoteSistema]
  );

  const applyFilters = () => {
    // Combine the most discriminating filter into searchQuery (RightPanel searches item/endereco/lote/loteSistema)
    const q = fItem.trim() || fLote.trim() || fLoteSistema.trim();
    setSearchQuery(q);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFItem(''); setFLargura(''); setFLote(''); setFMlinear(''); setFLoteSistema('');
    setSearchQuery('');
  };

  const FiltersCard = (
    <aside className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground tracking-tight">{filtersTitle}</h3>
        <button
          onClick={clearFilters}
          className="text-[11px] font-bold text-destructive hover:text-destructive/80 transition-colors"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Item / Referência" value={fItem} onChange={setFItem} placeholder="Ex.: SRC-3003-05-3" />
        <Field label="Largura do tecido (m)" value={fLargura} onChange={setFLargura} placeholder="Ex.: 2.80" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Metragem (m linear)" value={fMlinear} onChange={setFMlinear} placeholder="Ex.: 75.00" />
          <Field label="Lote / Batch" value={fLote} onChange={setFLote} placeholder="Ex.: Lote..." />
        </div>
        <Field label="Lote sistema" value={fLoteSistema} onChange={setFLoteSistema} placeholder="Ex.: —" />
      </div>

      <div className="mt-auto pt-2">
        <Button onClick={applyFilters} className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Aplicar filtros {totalFiltros > 0 && <span className="ml-1 bg-white/20 px-1.5 rounded">{totalFiltros}</span>}
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="h-full w-full flex flex-col gap-3 sm:gap-4 overflow-hidden">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-2 flex-shrink-0 px-1">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">{title}</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
              {registros.length} registro{registros.length !== 1 ? 's' : ''} na sessão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(true)}
              className="h-10 rounded-xl gap-1.5 text-xs font-bold"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros {totalFiltros > 0 && <span className="bg-primary text-primary-foreground px-1.5 rounded text-[10px]">{totalFiltros}</span>}
            </Button>
          )}
          <Button
            onClick={() => setOpen(true)}
            className="h-10 sm:h-11 rounded-xl gap-1.5 font-bold text-xs sm:text-sm bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Adicionar Registro</span>
            <span className="xs:hidden">Adicionar</span>
          </Button>
        </div>
      </div>

      {/* Body: filters + table */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[clamp(240px,22vw,320px)_1fr] gap-3 sm:gap-4">
        {!isMobile && <div className="min-w-0 h-full overflow-hidden">{FiltersCard}</div>}
        <div className="min-w-0 h-full overflow-hidden">
          <RightPanel />
        </div>
      </div>

      {/* Mobile filters drawer */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-md w-[95vw] p-0 gap-0">
          <DialogHeader className="px-5 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="w-4 h-4" />
              {filtersTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">{FiltersCard}</div>
        </DialogContent>
      </Dialog>

      {/* Add Registro Modal — wraps the existing form (LeftPanel / MotorControle form) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(720px,95vw)] w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-5 py-4 border-b bg-card/60 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="w-4 h-4 text-primary" />
              Adicionar Registro
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-lg border border-border/60 bg-muted/30 px-3 text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-background outline-none transition-colors placeholder:text-muted-foreground/40"
      />
    </div>
  );
}

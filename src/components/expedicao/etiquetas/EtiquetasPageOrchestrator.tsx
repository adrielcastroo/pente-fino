// ============================================================================
// Orchestrator: Print-First — layout, atalhos, state cross-component.
// ============================================================================
import { useCallback, useEffect, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEtiquetaTemplates } from './hooks/useEtiquetaTemplates';
import { useEtiquetaVariables } from './hooks/useEtiquetaVariables';
import { useEtiquetaPrint } from './hooks/useEtiquetaPrint';
import { useEtiquetaPresets } from './hooks/useEtiquetaPresets';
import EtiquetaToolbar from './components/EtiquetaToolbar';
import EtiquetaPreview from './components/EtiquetaPreview';
import EtiquetaEditor from './components/EtiquetaEditor';
import HistoryDrawer from './components/HistoryDrawer';
import TestPrintDialog from './components/TestPrintDialog';
import BatchPrintDialog from './components/BatchPrintDialog';
import AdvancedSettingsDrawer from './components/AdvancedSettingsDrawer';
import { toast } from 'sonner';
import type { PickingLike, Template } from './types/etiqueta';
import type { PrintHistoryEntry } from './utils/etiquetaHistory';

export default function EtiquetasPageOrchestrator() {
  useDocumentTitle('Etiquetas · Expedição');

  const templates = useEtiquetaTemplates();
  const variables = useEtiquetaVariables(templates.active, templates.patchActive);
  const print = useEtiquetaPrint({ active: templates.active, mergedVars: variables.mergedVars });
  const presets = useEtiquetaPresets();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'browser' | 'zpl'>('browser');

  // Preset apply
  const applyPreset = useCallback((id: string, opts?: { print?: boolean }) => {
    const patch = presets.apply(id);
    if (!patch) return;
    templates.patchActive(patch);
    if (opts?.print) setTimeout(() => print.print(), 100);
  }, [presets, templates, print]);

  const saveCurrentAsPreset = useCallback(() => {
    if (!templates.active) return;
    const label = prompt('Nome do preset:', `Preset ${new Date().toLocaleDateString('pt-BR')}`);
    if (!label?.trim()) return;
    presets.createCustomFromTemplate(templates.active, label.trim());
  }, [templates.active, presets]);

  const onSelectPicking = useCallback((p: PickingLike) => {
    variables.applyPicking(p);
  }, [variables]);

  const onReprintHistory = useCallback((entry: PrintHistoryEntry) => {
    // Se o snapshot existir, reimprime com o template original
    const snap = entry.snapshot as { template?: Template } | undefined;
    if (snap?.template) {
      void print.print({ template: snap.template, method: entry.method, copies: entry.copies });
      return;
    }
    // Senão, tenta imprimir o template ativo com as vars atuais
    void print.print({ method: entry.method, copies: entry.copies });
  }, [print]);

  // Keyboard shortcuts globais
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); void print.print();
        return;
      }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); setTestOpen(true); return;
      }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault(); setBatchOpen(true); return;
      }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault(); setHistoryOpen(true); return;
      }
      if (ctrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault(); setAdvOpen(true); return;
      }
      if (ctrl && e.key.toLowerCase() === 'd' && !typing) {
        if (templates.active) { e.preventDefault(); templates.duplicate(templates.active.id); toast.success('Template duplicado.'); }
        return;
      }
      if (e.key === 'Escape') {
        setHistoryOpen(false); setTestOpen(false); setBatchOpen(false); setAdvOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [print, templates]);

  const t = templates.active;

  return (
    <div className="space-y-3 min-w-0">
      <EtiquetaToolbar
        templates={templates}
        presets={presets.presets}
        onApplyPreset={applyPreset}
        onSaveCurrentAsPreset={saveCurrentAsPreset}
        onRemoveCustomPreset={presets.removeCustom}
        onSelectPicking={onSelectPicking}
        print={print.print}
        isPrinting={print.isPrinting}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenAdvanced={() => setAdvOpen(true)}
        onOpenTestPrint={() => setTestOpen(true)}
        onOpenBatchPrint={() => setBatchOpen(true)}
        active={t}
      />

      {!t ? (
        <EmptyState onCreate={() => templates.create()} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 min-w-0 lg:h-[calc(100vh-180px)] lg:overflow-hidden">
          <div className="border border-border/60 rounded-lg overflow-hidden bg-card min-w-0 flex flex-col">
            <div className="print:hidden flex items-center justify-between px-3 py-1.5 border-b border-border/60 text-[11px] text-muted-foreground">
              <span>Preview</span>
              <div className="flex gap-1">
                <button
                  className={`px-2 py-0.5 rounded-sm ${previewMode === 'browser' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => setPreviewMode('browser')}
                >Navegador</button>
                <button
                  className={`px-2 py-0.5 rounded-sm ${previewMode === 'zpl' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => setPreviewMode('zpl')}
                >ZPL</button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <EtiquetaPreview template={t} vars={variables.mergedVars} mode={previewMode} />
            </div>
          </div>

          <div className="min-w-0 lg:h-full overflow-auto lg:overflow-hidden">
            <EtiquetaEditor template={t} patch={templates.patchActive} variables={variables} />
          </div>
        </div>
      )}

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} onReprint={onReprintHistory} />
      <TestPrintDialog open={testOpen} onClose={() => setTestOpen(false)} testPrint={print.testPrint} currentVars={variables.mergedVars} isPrinting={print.isPrinting} />
      <BatchPrintDialog open={batchOpen} onClose={() => setBatchOpen(false)} batchPrint={print.batchPrint} isPrinting={print.isPrinting} />
      <AdvancedSettingsDrawer open={advOpen} onClose={() => setAdvOpen(false)} template={t} vars={variables.mergedVars} patch={templates.patchActive} />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-8 text-center bg-card">
      <p className="text-sm text-muted-foreground mb-3">Nenhum modelo de etiqueta ainda.</p>
      <button className="primary-btn" onClick={onCreate}>Criar primeiro modelo</button>
    </div>
  );
}

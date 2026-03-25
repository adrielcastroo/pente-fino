import { useAppStore, formatML, type Conference } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, ChevronDown, ChevronRight, Package, Clock, Trash2, User } from 'lucide-react';
import { useState, useEffect } from 'react';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ConferenceCard({ conf, onDelete }: { conf: Conference; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const totalML = conf.registros.reduce((a, r) => a + r.mLinear, 0);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center">
        <button onClick={() => setOpen(!open)} className="flex-1 px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
          <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{conf.name}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Clock className="w-3 h-3" />
              {formatDate(conf.date)} · {conf.registros.length} rolos · {formatML(totalML)}
              {conf.conferente && (
                <span className="flex items-center gap-0.5">
                  <User className="w-3 h-3" /> {conf.conferente}
                </span>
              )}
            </div>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Remover esta conferência do histórico?')) onDelete(); }}
          className="p-2.5 mr-2 rounded-md hover:bg-muted transition-colors"
          title="Remover conferência"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-border overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="surface-2-bg">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Item</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">M²</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">M Lin</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Largura</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Endereço</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Lote Sist.</th>
                  </tr>
                </thead>
                <tbody>
                  {conf.registros.map((r, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-3 py-1.5 font-semibold">{r.item}</td>
                      <td className="px-3 py-1.5 font-mono">{r.m2 > 0 ? r.m2.toFixed(1) : '—'}</td>
                      <td className="px-3 py-1.5 font-mono">{formatML(r.mLinear)}</td>
                      <td className="px-3 py-1.5 font-mono">{r.largura > 0 ? r.largura.toFixed(2) : '—'}</td>
                      <td className="px-3 py-1.5 font-mono">{r.endereco}</td>
                      <td className="px-3 py-1.5 font-mono">{r.loteSistema || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HistoryPanel() {
  const { history, loadHistory, deleteConference, clearHistory } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClearAll = async () => {
    if (!history.length) return;
    if (confirm(`Limpar todo o histórico (${history.length} conferências)?`)) {
      await clearHistory();
      addToast('Histórico limpo', 'warn');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-hidden bg-background"
    >
      <div className="px-4 py-3 border-b border-border flex-shrink-0 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Conferências</span>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-md transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Limpar tudo
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <div className="text-sm font-medium text-foreground/60 mb-1">Nenhuma conferência arquivada</div>
            <div className="text-xs text-muted-foreground">Ao exportar o Excel, a conferência será salva aqui</div>
          </div>
        ) : (
          history.map(conf => (
            <ConferenceCard
              key={conf.id}
              conf={conf}
              onDelete={async () => {
                await deleteConference(conf.id);
                addToast('Conferência removida', 'ok');
              }}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

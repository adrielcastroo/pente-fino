import { useAppStore, formatML, type Conference } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, ChevronDown, ChevronRight, Package, Clock } from 'lucide-react';
import { useState } from 'react';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ConferenceCard({ conf }: { conf: Conference }) {
  const [open, setOpen] = useState(false);
  const totalML = conf.registros.reduce((a, r) => a + r.mLinear, 0);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
        <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{conf.name}</div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatDate(conf.date)} · {conf.registros.length} rolos · {formatML(totalML)}
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="surface-2-bg">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Item</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">M Lin</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Largura</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Endereço</th>
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Lote</th>
                  </tr>
                </thead>
                <tbody>
                  {conf.registros.map((r, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-3 py-1.5 font-semibold">{r.item}</td>
                      <td className="px-3 py-1.5 font-mono">{formatML(r.mLinear)}</td>
                      <td className="px-3 py-1.5 font-mono">{r.largura > 0 ? r.largura.toFixed(2) : '—'}</td>
                      <td className="px-3 py-1.5 font-mono">{r.endereco}</td>
                      <td className="px-3 py-1.5 font-mono">{r.lote || '—'}</td>
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
  const { history } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full overflow-hidden bg-background"
    >
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Conferências</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <div className="text-sm font-medium text-foreground/60 mb-1">Nenhuma conferência arquivada</div>
            <div className="text-xs text-muted-foreground">Ao exportar o Excel, a conferência será salva aqui</div>
          </div>
        ) : (
          history.map(conf => <ConferenceCard key={conf.id} conf={conf} />)
        )}
      </div>
    </motion.div>
  );
}

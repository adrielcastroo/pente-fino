import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/hooks/use-performance';

const shortcuts = [
  { key: 'B', label: 'Focar campo de bipagem' },
  { key: '/', label: 'Focar busca da página' },
  { key: '?', label: 'Abrir esta lista de atalhos' },
  { key: 'CTRL + N', label: 'Nova conferência (Tecido)' },
  { key: 'CTRL + K', label: 'Paleta de atalhos' },
  { key: 'CTRL + ,', label: 'Configurações' },
  { key: 'CTRL + Z', label: 'Desfazer último registro' },
  { key: 'CTRL + F', label: 'Focar filtro' },
  { key: 'ALT + T', label: 'Modo Tecido' },
  { key: 'ALT + M', label: 'Modo Madeira' },
  { key: 'ALT + K', label: 'Modo Motor' },
  { key: 'ALT + E', label: 'Estoque' },
  { key: 'ALT + S', label: 'Saída' },
  { key: 'ALT + H', label: 'Histórico' },
  { key: 'ALT + I', label: 'Dashboard' },
  { key: 'ALT + C', label: 'Configurações' },
  { key: 'ESC', label: 'Fechar modais / parar câmera' },
];

export default function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isLow } = usePerformance();
  
  if (!open) return null;

  if (isLow) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-card w-full max-w-md rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">Atalhos do Sistema</h2>
          <div className="space-y-2">
            {shortcuts.map(s => (
              <div key={s.key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono font-bold border border-border shadow-sm">{s.key}</kbd>
              </div>
            ))}
          </div>
          <div className="h-px bg-border my-4" />
          <button onClick={onClose} className="w-full border border-border rounded-lg py-2 text-sm hover:bg-surface-2">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card w-full max-w-md rounded-2xl p-6 border border-border shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-4">Atalhos do Sistema</h2>
            <div className="space-y-2">
              {shortcuts.map(s => (
                <div key={s.key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono font-bold border border-border shadow-sm">{s.key}</kbd>
                </div>
              ))}
            </div>
            <div className="h-px bg-border my-4" />
            <button onClick={onClose} className="w-full border border-border rounded-lg py-2 text-sm hover:bg-surface-2 transition-colors">Fechar</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

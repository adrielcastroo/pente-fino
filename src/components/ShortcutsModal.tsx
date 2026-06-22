import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/hooks/use-performance';

const shortcutGroups: { title: string; items: { key: string; label: string }[] }[] = [
  {
    title: 'Fluxo de bipagem (Tecido)',
    items: [
      { key: 'B', label: 'Focar campo de bipagem' },
      { key: 'ENTER', label: 'Confirmar registro / próximo campo' },
      { key: 'TAB', label: 'Avançar para o próximo campo' },
      { key: 'SHIFT + TAB', label: 'Voltar ao campo anterior' },
      { key: 'CTRL + Z', label: 'Desfazer último registro' },
      { key: 'CTRL + N', label: 'Nova conferência (Tecido)' },
      { key: 'ESC', label: 'Fechar modais / parar câmera' },
    ],
  },
  {
    title: 'Busca & paleta',
    items: [
      { key: '/', label: 'Focar busca da página' },
      { key: 'CTRL + F', label: 'Focar filtro' },
      { key: 'CTRL + K', label: 'Paleta de atalhos' },
      { key: '?', label: 'Abrir esta lista de atalhos' },
    ],
  },
  {
    title: 'Navegação',
    items: [
      { key: 'ALT + T', label: 'Modo Tecido' },
      { key: 'ALT + M', label: 'Modo Madeira' },
      { key: 'ALT + K', label: 'Modo Motor' },
      { key: 'ALT + E', label: 'Estoque' },
      { key: 'ALT + S', label: 'Saída' },
      { key: 'ALT + H', label: 'Histórico' },
      { key: 'ALT + I', label: 'Dashboard' },
      { key: 'ALT + C', label: 'Configurações' },
      { key: 'CTRL + ,', label: 'Configurações' },
    ],
  },
];

function ShortcutList() {
  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
      {shortcutGroups.map(group => (
        <section key={group.title}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {group.title}
          </h3>
          <div className="space-y-1">
            {group.items.map(s => (
              <div
                key={group.title + s.key}
                className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0"
              >
                <span className="text-sm font-medium text-foreground/90">{s.label}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono font-bold border border-border shadow-sm shrink-0 ml-3">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isLow } = usePerformance();
  
  if (!open) return null;

  if (isLow) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-card w-full max-w-md rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">Atalhos do Sistema</h2>
          <ShortcutList />

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
            <ShortcutList />

            <div className="h-px bg-border my-4" />
            <button onClick={onClose} className="w-full border border-border rounded-lg py-2 text-sm hover:bg-surface-2 transition-colors">Fechar</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

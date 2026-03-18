import { motion, AnimatePresence } from 'framer-motion';

const shortcuts = [
  { desc: 'Processar IA', keys: ['Enter'] },
  { desc: 'Adicionar rolo', keys: ['Ctrl', 'Enter'] },
  { desc: 'Colar imagem', keys: ['Ctrl', 'V'] },
  { desc: 'Limpar formulário', keys: ['Esc'] },
  { desc: 'Desfazer remoção', keys: ['Ctrl', 'Z'] },
  { desc: 'Copiar Lote', keys: ['Ctrl', 'L'] },
  { desc: 'Exportar Excel', keys: ['Ctrl', 'E'] },
  { desc: 'Focar busca', keys: ['Ctrl', 'F'] },
];

export default function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="surface-bg rounded-2xl p-7 w-[480px] max-w-[92vw] shadow-2xl"
          >
            <h2 className="text-base font-semibold mb-4">Atalhos de Teclado</h2>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map(s => (
                <div key={s.desc} className="flex items-center justify-between px-3 py-2 surface-2-bg rounded-md">
                  <span className="text-xs text-muted-foreground">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map(k => <span key={k} className="kbd">{k}</span>)}
                  </div>
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

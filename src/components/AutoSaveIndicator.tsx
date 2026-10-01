import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { onAutoSaved } from '@/lib/conferencia-autosave';

/** Tempo que o indicador fica visível após cada salvamento. */
export const AUTOSAVE_INDICATOR_MS = 1500;

/**
 * Indicador fixo no topo da página exibido sempre que o pré-save da
 * conferência é gravado (a cada bipagem). Não usa o Toaster do sonner porque
 * ele está limitado a 1 toast visível e seria sobrescrito pelos toasts de bip.
 */
export default function AutoSaveIndicator() {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const off = onAutoSaved(() => {
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), AUTOSAVE_INDICATOR_MS);
    });
    return () => {
      off();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center"
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="autosave"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span>Salvamento automático realizado</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

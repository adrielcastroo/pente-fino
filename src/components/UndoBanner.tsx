import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';

const DURATION_MS = 5000;

export default function UndoBanner() {
  const lastDeletedAt = useAppStore(s => s.lastDeletedAt);
  const undo = useAppStore(s => s.undo);
  const clearLastDeleted = useAppStore(s => s.clearLastDeleted);
  const [remaining, setRemaining] = useState(DURATION_MS);

  useEffect(() => {
    if (!lastDeletedAt) return;
    setRemaining(DURATION_MS);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, DURATION_MS - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        clearLastDeleted();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [lastDeletedAt, clearLastDeleted]);

  const handleRestore = () => {
    undo();
  };

  const progress = (remaining / DURATION_MS) * 100;
  const seconds = Math.ceil(remaining / 1000);

  return (
    <AnimatePresence>
      {lastDeletedAt && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,520px)]"
        >
          <div className="relative overflow-hidden rounded-md border border-destructive/30 bg-card/95 backdrop-blur-md shadow-2xl shadow-destructive/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
                <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Você removeu um registro
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Deseja restaurar? <span className="font-mono tabular-nums">({seconds}s)</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={handleRestore}
                className="h-8 px-3 gap-1.5 font-semibold"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Restaurar
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={clearLastDeleted}
                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-0.5 bg-destructive/10">
              <motion.div
                className="h-full bg-destructive"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

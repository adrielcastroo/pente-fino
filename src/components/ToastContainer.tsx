import { useToastStore } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);

  const borderColors = {
    ok: 'hsl(155, 40%, 53%)',
    warn: 'hsl(38, 72%, 67%)',
    err: 'hsl(14, 72%, 51%)',
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.22 }}
            className="navy-bg text-primary-foreground rounded-lg px-4 py-3 text-sm shadow-lg min-w-[240px] max-w-[340px]"
            style={{ borderLeft: `3px solid ${borderColors[t.type]}` }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

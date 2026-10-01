import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, description?: string, options?: { duration?: number }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalAddToast: ((type: ToastType, title: string, description?: string, options?: { duration?: number }) => void) | null = null;
let globalDismissToast: ((id: string) => void) | null = null;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export const toastAPI = {
  success: (title: string, description?: string, options?: { duration?: number }) => {
    if (globalAddToast) {
      globalAddToast('success', title, description, options);
    }
  },
  error: (title: string, description?: string, options?: { duration?: number }) => {
    if (globalAddToast) {
      globalAddToast('error', title, description, options);
    }
  },
  warning: (title: string, description?: string, options?: { duration?: number }) => {
    if (globalAddToast) {
      globalAddToast('warning', title, description, options);
    }
  },
  info: (title: string, description?: string, options?: { duration?: number }) => {
    if (globalAddToast) {
      globalAddToast('info', title, description, options);
    }
  },
  loading: (title: string, description?: string, options?: { duration?: number }) => {
    if (globalAddToast) {
      globalAddToast('loading', title, description, options);
    }
  },
  dismiss: (id: string) => {
    if (globalDismissToast) globalDismissToast(id);
  },
  remove: (id: string) => {
    if (globalDismissToast) globalDismissToast(id);
  },
  removeAll: () => {},
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string, options?: { duration?: number }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duration = options?.duration ?? 4000;
    const toast: Toast = { id, type, title, description, duration };
    // Substitui qualquer toast anterior — apenas o mais recente fica visível
    setToasts([toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    globalDismissToast = dismissToast;
    return () => {
      globalAddToast = null;
      globalDismissToast = null;
    };
  }, [addToast, dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { type, title, description, id } = toast;

  const styles = {
    success: 'border-emerald-500/30 bg-background/95 text-foreground dark:bg-background/95 dark:text-foreground',
    error: 'border-red-500/30 bg-background/95 text-foreground dark:bg-background/95 dark:text-foreground',
    warning: 'border-amber-500/30 bg-background/95 text-foreground dark:bg-background/95 dark:text-foreground',
    info: 'border-blue-500/30 bg-background/95 text-foreground dark:bg-background/95 dark:text-foreground',
    loading: 'border-slate-500/30 bg-background/95 text-foreground dark:bg-background/95 dark:text-foreground',
  };

  const iconColor = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
    loading: 'text-slate-500',
  };

  const icons = {
    success: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    loading: (
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    ),
  };

  return (
    <div className={`
      flex items-center gap-2 rounded-full border shadow-lg backdrop-blur
      animate-slide-in
      ${styles[type]}
    `} role="alert">
      <span className={`ml-3 ${iconColor[type]}`}>
        {icons[type]}
      </span>
      <span className="text-sm font-medium">{title}</span>
      {description && <span className="text-xs opacity-70">{description}</span>}
      <button
        onClick={() => onDismiss(id)}
        className="mr-2 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export function Toaster({ position = 'bottom-center', ...props }: { position?: string; [key: string]: any }) {
  const { toasts, dismissToast } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

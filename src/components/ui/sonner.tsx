// Wrapper que roteia todas as chamadas do sonner para nosso sistema customizado
import { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  createdAt: number;
}

const ToastContext = createContext<{
  addToast: (type: ToastType, title: string, description?: string, duration?: number) => void;
  removeToast: (id: string) => void;
} | null>(null);

// Singleton para acessibilidade global (fora do React tree)
let _toasts: ToastItem[] = [];
let _listeners: Set<() => void> = new Set();
let _nextId = 0;

export const toastAPI = {
  success: (title: string, description?: string, options?: { duration?: number }) => {
    const id = `toast_${++_nextId}`;
    const duration = options?.duration ?? 4000;
    _toasts = [{ id, type: 'success', title, description, duration, createdAt: Date.now() }, ..._toasts];
    _listeners.forEach(fn => fn());
    if (duration > 0) setTimeout(() => toastAPI.dismiss(id), duration);
    return id;
  },
  error: (title: string, description?: string, options?: { duration?: number }) => {
    const id = `toast_${++_nextId}`;
    const duration = options?.duration ?? 6000;
    _toasts = [{ id, type: 'error', title, description, duration, createdAt: Date.now() }, ..._toasts];
    _listeners.forEach(fn => fn());
    if (duration > 0) setTimeout(() => toastAPI.dismiss(id), duration);
    return id;
  },
  warning: (title: string, description?: string, options?: { duration?: number }) => {
    const id = `toast_${++_nextId}`;
    const duration = options?.duration ?? 4000;
    _toasts = [{ id, type: 'warning', title, description, duration, createdAt: Date.now() }, ..._toasts];
    _listeners.forEach(fn => fn());
    if (duration > 0) setTimeout(() => toastAPI.dismiss(id), duration);
    return id;
  },
  info: (title: string, description?: string, options?: { duration?: number }) => {
    const id = `toast_${++_nextId}`;
    const duration = options?.duration ?? 4000;
    _toasts = [{ id, type: 'info', title, description, duration, createdAt: Date.now() }, ..._toasts];
    _listeners.forEach(fn => fn());
    if (duration > 0) setTimeout(() => toastAPI.dismiss(id), duration);
    return id;
  },
  loading: (title: string, description?: string, options?: { duration?: number }) => {
    const id = `toast_${++_nextId}`;
    _toasts = [{ id, type: 'loading', title, description, duration: 0, createdAt: Date.now() }, ..._toasts];
    _listeners.forEach(fn => fn());
    return id;
  },
  dismiss: (id: string) => {
    _toasts = _toasts.filter(t => t.id !== id);
    _listeners.forEach(fn => fn());
  },
  remove: (id: string) => toastAPI.dismiss(id),
  removeAll: () => {
    _toasts = [];
    _listeners.forEach(fn => fn());
  },
};

// Hook para componentes React
export function useToastManager() {
  const [toasts, setToasts] = useState<ToastItem[]>(_toasts);

  const addToast = useCallback((type: ToastType, title: string, description?: string, duration?: number) => {
    const id = toastAPI[type as keyof typeof toastAPI](title, description, { duration }) as string;
    setToasts(prev => [{ id, type, title, description, duration: duration ?? 4000, createdAt: Date.now() }, ...prev]);
  }, []);

  const removeToast = useCallback((id: string) => {
    toastAPI.dismiss(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// Toaster component que renderiza todas as notificações
export function Toaster({ position = 'top-center', ...props }: any) {
  const { toasts, removeToast } = useToastManager();

  if (toasts.length === 0) return null;

  const containerClass = position === 'top-center'
    ? 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4'
    : 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm';

  return (
    <div className={containerClass} {...props}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const { type, title, description } = toast;

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-100',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-100',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100',
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-100',
    loading: 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-100',
  };

  const iconColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    loading: 'bg-slate-500',
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

  const elapsed = Date.now() - toast.createdAt;
  const progress = toast.duration > 0 ? Math.min((elapsed / toast.duration) * 100, 100) : 0;

  return (
    <div className={`
      relative flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border
      animate-slide-in
      ${styles[type]}
    `} role="alert">
      <div className={`
        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white
        ${iconColors[type]}
      `}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs mt-0.5 opacity-80">{description}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10 rounded-b-lg overflow-hidden">
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${100 - progress}%`,
              backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'info' ? '#3b82f6' : '#64748b',
            }}
          />
        </div>
      )}
    </div>
  );
}

// Re-export toast API for compatibility
export const toast = toastAPI;

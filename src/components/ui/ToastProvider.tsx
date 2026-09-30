import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  createdAt: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string, options?: { duration?: number }) => string;
    error: (title: string, description?: string, options?: { duration?: number }) => string;
    warning: (title: string, description?: string, options?: { duration?: number }) => string;
    info: (title: string, description?: string, options?: { duration?: number }) => string;
    loading: (title: string, description?: string, options?: { duration?: number }) => string;
    dismiss: (id: string) => void;
    removeAll: () => void;
  };
}

// Icons
const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, description?: string, options?: { duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? 4000;

    const toast: ToastItem = {
      id,
      type,
      title,
      description,
      duration,
      createdAt: Date.now(),
    };

    setToasts(prev => [toast, ...prev]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (title: string, description?: string, options?: { duration?: number }) =>
      addToast('success', title, description, options),
    error: (title: string, description?: string, options?: { duration?: number }) =>
      addToast('error', title, description, options),
    warning: (title: string, description?: string, options?: { duration?: number }) =>
      addToast('warning', title, description, options),
    info: (title: string, description?: string, options?: { duration?: number }) =>
      addToast('info', title, description, options),
    loading: (title: string, description?: string, options?: { duration?: number }) =>
      addToast('loading', title, description, options),
    dismiss: removeToast,
    removeAll: () => setToasts([]),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context.toast;
}

// Toast Item Component
function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const { type, title, description, createdAt } = toast;
  const elapsed = Date.now() - createdAt;
  const progress = Math.min((elapsed / (toast.duration || 4000)) * 100, 100);

  const typeStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-100',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-100',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100',
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-100',
    loading: 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950/30 dark:border-slate-800 dark:text-slate-100',
  };

  const iconColors = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-blue-500 text-white',
    loading: 'bg-slate-500 text-white',
  };

  const icon = {
    success: <CheckIcon />,
    error: <XIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />,
    loading: <LoaderIcon />,
  };

  return (
    <div
      className={`
        relative flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border
        animate-slide-in
        ${typeStyles[type]}
      `}
      role="alert"
    >
      {/* Icon */}
      <div className={`
        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
        ${iconColors[type]}
      `}>
        {icon[type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs mt-0.5 opacity-80">{description}</p>}
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fechar notificação"
      >
        <CloseIcon />
      </button>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10 rounded-b-lg overflow-hidden">
          <div
            className={`h-full ${type === 'loading' ? 'animate-pulse' : ''}`}
            style={{
              width: `${100 - progress}%`,
              backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'info' ? '#3b82f6' : '#64748b',
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      )}
    </div>
  );
}

// Container Component
function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// Toast utility that works with or without context
// This file provides a fallback for when ToastProvider is not in the React tree
// (e.g., during SSR or if component renders before provider)

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions {
  duration?: number;
  id?: string;
}

// Global fallback storage (for non-React contexts)
let fallbackToasts: Array<{ id: string; type: ToastType; title: string; description?: string; duration?: number }> = [];
let fallbackListener: (() => void) | null = null;

// Fallback render function - shows browser alert as last resort
const showFallback = (type: ToastType, title: string, description?: string) => {
  // In browser, we could inject into DOM, but for now just log
  console.log(`[Toast ${type}] ${title}${description ? ` - ${description}` : ''}`);
};

// Create a toast API compatible with sonner's API
const createToast = () => {
  const api = {
    success: (title: string, description?: string, options?: ToastOptions) => {
      console.log(`[Toast success] ${title}${description ? ` - ${description}` : ''}`);
      showFallback('success', title, description);
      return options?.id || '';
    },
    error: (title: string, description?: string, options?: ToastOptions) => {
      console.log(`[Toast error] ${title}${description ? ` - ${description}` : ''}`);
      showFallback('error', title, description);
      return options?.id || '';
    },
    warning: (title: string, description?: string, options?: ToastOptions) => {
      console.log(`[Toast warning] ${title}${description ? ` - ${description}` : ''}`);
      showFallback('warning', title, description);
      return options?.id || '';
    },
    info: (title: string, description?: string, options?: ToastOptions) => {
      console.log(`[Toast info] ${title}${description ? ` - ${description}` : ''}`);
      showFallback('info', title, description);
      return options?.id || '';
    },
    loading: (title: string, description?: string, options?: ToastOptions) => {
      console.log(`[Toast loading] ${title}${description ? ` - ${description}` : ''}`);
      return options?.id || '';
    },
    dismiss: (id: string) => {
      console.log(`[Toast dismiss] ${id}`);
    },
    remove: (id: string) => {
      console.log(`[Toast remove] ${id}`);
    },
  };
  return api;
};

// Export a singleton instance
export const toast = createToast();

// Export types for consumers
export type { ToastType };

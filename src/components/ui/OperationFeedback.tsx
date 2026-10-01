import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type FeedbackType = 'success' | 'error';

interface FeedbackState {
  open: boolean;
  type: FeedbackType;
  title?: string;
  message?: string;
}

interface OperationFeedbackContextType {
  show: (type: FeedbackType, title?: string, message?: string) => void;
  hide: () => void;
}

const OperationFeedbackContext = createContext<OperationFeedbackContextType | undefined>(undefined);

let globalShowFeedback: ((type: FeedbackType, title?: string, message?: string) => void) | null = null;
let globalHideFeedback: (() => void) | null = null;

export function useOperationFeedback() {
  const context = useContext(OperationFeedbackContext);
  if (!context) {
    throw new Error('useOperationFeedback must be used within OperationFeedbackProvider');
  }
  return context;
}

export const operationFeedbackAPI = {
  success: (title?: string, message?: string) => {
    if (globalShowFeedback) globalShowFeedback('success', title, message);
  },
  error: (title?: string, message?: string) => {
    if (globalShowFeedback) globalShowFeedback('error', title, message);
  },
  hide: () => {
    if (globalHideFeedback) globalHideFeedback();
  },
};

export function OperationFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FeedbackState>({
    open: false,
    type: 'success',
    title: undefined,
    message: undefined,
  });

  const show = useCallback((type: FeedbackType, title?: string, message?: string) => {
    setState({ open: true, type, title, message });
  }, []);

  const hide = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    globalShowFeedback = show;
    globalHideFeedback = hide;
    return () => {
      globalShowFeedback = null;
      globalHideFeedback = null;
    };
  }, [show, hide]);

  return (
    <OperationFeedbackContext.Provider value={{ show, hide }}>
      {children}
      <OperationFeedbackModal state={state} onClose={hide} />
    </OperationFeedbackContext.Provider>
  );
}

interface ModalProps {
  state: FeedbackState;
  onClose: () => void;
}

const DURATION = 1500;

function OperationFeedbackModal({ state, onClose }: ModalProps) {
  useEffect(() => {
    if (!state.open) return;
    const timer = setTimeout(onClose, DURATION);
    return () => clearTimeout(timer);
  }, [state.open, onClose]);

  if (!state.open) return null;

  const config = {
    success: {
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      title: state.title || 'Sucesso!',
      ring: 'bg-emerald-100 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    error: {
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ),
      title: state.title || 'Erro!',
      ring: 'bg-red-100 dark:bg-red-950/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const c = config[state.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border rounded-lg p-8 shadow-lg animate-in zoom-in duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-full ${c.ring} flex items-center justify-center`}>
            <span className={c.iconColor}>{c.icon}</span>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">{c.title}</div>
            {state.message && (
              <div className="text-sm text-muted-foreground mt-1">{state.message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
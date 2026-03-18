import { create } from 'zustand';

export interface ToastItem {
  id: number;
  message: string;
  type: 'ok' | 'warn' | 'err';
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: 'ok' | 'warn' | 'err') => void;
  removeToast: (id: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'ok') => {
    const id = Date.now() + Math.random();
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface KeyboardShortcutsOptions {
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  configOpen: boolean;
  setConfigOpen: (open: boolean) => void;
}

export function useKeyboardShortcuts({
  shortcutsOpen,
  setShortcutsOpen,
  configOpen,
  setConfigOpen,
}: KeyboardShortcutsOptions) {
  const undo = useAppStore(s => s.undo);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isTyping = 
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' || 
        activeElement?.isContentEditable;

      // Handle Escape to close modals
      if (e.key === 'Escape') {
        if (shortcutsOpen || configOpen) {
          setShortcutsOpen(false);
          setConfigOpen(false);
          return;
        }
      }

      if (shortcutsOpen || configOpen) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key.toLowerCase() === 'z') { 
        e.preventDefault(); 
        const r = undo(); 
        if (r) toast.success('Rolo restaurado'); 
      }
      
      if (cmdKey && e.key.toLowerCase() === 'f' && !isTyping) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[placeholder*="Filtrar"]')?.focus();
      }
      
      if (cmdKey && e.key.toLowerCase() === 'k') { 
        e.preventDefault(); 
        setShortcutsOpen(true); 
      }
      
      if (cmdKey && e.key === ',') { 
        e.preventDefault(); 
        setConfigOpen(true); 
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, configOpen, shortcutsOpen, setShortcutsOpen, setConfigOpen]);
}

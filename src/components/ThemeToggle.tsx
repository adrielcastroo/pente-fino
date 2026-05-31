import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const ThemeToggle = () => {
  const theme = useAppStore(s => s.dashboardDialogTheme);
  const setTheme = useAppStore(s => s.setDashboardDialogTheme);

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-xl transition-all border border-border/20 flex items-center justify-center hover:bg-muted/50"
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
    </button>
  );
};

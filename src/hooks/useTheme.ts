import { useState, useLayoutEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('pf_theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pf_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      // Apply immediately for better responsiveness
      const root = document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

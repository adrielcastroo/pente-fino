import { useState, useEffect } from 'react';

export type PerformanceLevel = 'low' | 'high';

export function usePerformance() {
  const [level, setLevel] = useState<PerformanceLevel>('low');

  useEffect(() => {
    // Allow manual override via localStorage
    const override = localStorage.getItem('performance-mode');
    if (override === 'high') {
      setLevel('high');
      return;
    }

    // Default is 'low' (lightweight mode). Only upgrade to 'high' on powerful desktops.
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop && cores >= 8 && memory >= 8) {
      setLevel('high');
    }
  }, []);

  return { level, isLow: level === 'low', setLevel };
}

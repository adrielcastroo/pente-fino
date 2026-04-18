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

    if (override === 'low') {
      setLevel('low');
      return;
    }

    // Default is 'low' (lightweight mode).
    // Professional/Industrial apps should prioritize performance on most devices.
    // Only upgrade to 'high' on very powerful desktop environments.
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isDesktop = window.innerWidth >= 1280; // Only large desktops

    if (isDesktop && cores >= 8 && memory >= 12) {
      setLevel('high');
    } else {
      setLevel('low');
    }
    
    // Auto-apply class to body for CSS optimizations
    if (level === 'low') {
      document.body.classList.add('low-perf');
    } else {
      document.body.classList.remove('low-perf');
    }
  }, [level]);

  return { level, isLow: level === 'low', setLevel };
}

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

    // Default is 'low' (lightweight mode) but upgrade if resources are decent.
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isDesktop = window.innerWidth >= 1024;

    // Relaxed criteria: 4 cores and 4GB memory is enough for high mode on desktop
    if (isDesktop && cores >= 4 && memory >= 4) {
      setLevel('high');
    }
  }, []);

  return { level, isLow: level === 'low', setLevel };
}

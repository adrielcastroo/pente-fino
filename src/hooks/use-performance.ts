import { useState, useEffect } from 'react';

export type PerformanceLevel = 'low' | 'high';

/**
 * Detecta se o aparelho é de baixo desempenho.
 * Critérios (qualquer um → low):
 *  - RAM ≤ 4GB
 *  - CPU ≤ 4 núcleos
 *  - Rede 2g/slow-2g/3g
 *  - Save-Data habilitado pelo usuário
 *  - Viewport < 1024px (tablet/mobile)
 */
export function detectLowEndDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;

  const cores = navigator.hardwareConcurrency || 8;
  const memory = (navigator as any).deviceMemory || 8;
  const connection = (navigator as any).connection;
  const effectiveType: string | undefined = connection?.effectiveType;
  const saveData: boolean = !!connection?.saveData;
  const isMobileViewport = window.innerWidth < 1024;

  const lowMemory = memory <= 4;
  const lowCPU = cores <= 4;
  const slowNetwork = effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g';

  return lowMemory || lowCPU || slowNetwork || saveData || isMobileViewport;
}

export function usePerformance() {
  const [level, setLevel] = useState<PerformanceLevel>(() => {
    if (typeof window === 'undefined') return 'low';
    const override = localStorage.getItem('performance-mode');
    if (override === 'high' || override === 'low') return override;
    return detectLowEndDevice() ? 'low' : 'high';
  });

  useEffect(() => {
    if (level === 'low') {
      document.body.classList.add('low-perf');
    } else {
      document.body.classList.remove('low-perf');
    }
  }, [level]);

  const updateLevel = (next: PerformanceLevel | 'auto') => {
    if (next === 'auto') {
      localStorage.removeItem('performance-mode');
      setLevel(detectLowEndDevice() ? 'low' : 'high');
    } else {
      localStorage.setItem('performance-mode', next);
      setLevel(next);
    }
  };

  const isAuto = typeof window !== 'undefined' && !localStorage.getItem('performance-mode');

  return { level, isLow: level === 'low', isAuto, setLevel: updateLevel };
}

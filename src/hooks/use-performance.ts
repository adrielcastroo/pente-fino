import { useState, useEffect } from 'react';

export type PerformanceLevel = 'low' | 'high';

export function usePerformance() {
  const [level, setLevel] = useState<PerformanceLevel>('high');

  useEffect(() => {
    const checkPerformance = () => {
      // 1. Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 4;
      
      // 2. Check device memory (RAM) - Not supported in all browsers
      const memory = (navigator as any).deviceMemory || 8;
      
      // 3. Check connection (if available)
      const connection = (navigator as any).connection;
      const isSlowConn = connection && (connection.saveData || ['slow-2g', '2g', '3g'].includes(connection.effectiveType));

      // 4. Heuristic for "low" performance
      if (cores < 4 || memory < 4 || isSlowConn) {
        setLevel('low');
      } else {
        setLevel('high');
      }
    };

    checkPerformance();
    
    // Optional: Allow manual override via localStorage
    const override = localStorage.getItem('performance-mode');
    if (override === 'low' || override === 'high') {
      setLevel(override as PerformanceLevel);
    }
  }, []);

  const isLow = level === 'low';

  return { level, isLow, setLevel };
}

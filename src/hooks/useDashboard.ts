import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { computeStats } from '@/lib/dashboard-utils';
import { exportToExcel } from '@/lib/export-utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export function useDashboard() {
  const history = useAppStore(s => s.history);
  const setFormData = useAppStore(s => s.setFormData);
  
  const stats = useMemo(() => computeStats(history), [history]);
  const [detailChart, setDetailChart] = useState<{ title: string; data: any[]; type: 'pie' | 'bar' } | null>(null);

  const handleStatClick = useCallback((tab: any) => {
    setFormData({ activeTab: tab });
  }, [setFormData]);

  const handleExport = useCallback((data: any[], fileName: string) => {
    exportToExcel(data, fileName);
  }, []);

  return {
    history,
    stats,
    detailChart,
    setDetailChart,
    handleStatClick,
    handleExport,
    containerVariants,
    itemVariants
  };
}
import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { computeStats } from '@/lib/dashboard-utils';
import { exportToExcel, exportDashboardToPDF, exportDashboardToExcel } from '@/lib/export-utils';

export function useDashboard() {
  const history = useAppStore(s => s.history);
  const isHistoryLoading = useAppStore(s => s.isHistoryLoading);
  const historyError = useAppStore(s => s.historyError);
  const loadHistory = useAppStore(s => s.loadHistory);
  const setFormData = useAppStore(s => s.setFormData);
  
  const stats = useMemo(() => computeStats(history), [history]);
  const [detailChart, setDetailChart] = useState<{ title: string; data: any[]; type: 'pie' | 'bar' } | null>(null);

  const handleStatClick = useCallback((tab: any) => {
    setFormData({ activeTab: tab });
  }, [setFormData]);

  const handleExport = useCallback((data: any[], fileName: string) => {
    exportToExcel(data, fileName);
  }, []);

  const handleExportPDF = useCallback((elementId: string, fileName: string) => {
    exportDashboardToPDF(elementId, fileName);
  }, []);

  const handleFullExport = useCallback((stats: any, history: any[], fileName: string) => {
    exportDashboardToExcel(stats, history, fileName);
  }, []);

  return {
    history,
    isHistoryLoading,
    historyError,
    loadHistory,
    stats,
    detailChart,
    setDetailChart,
    handleStatClick,
    handleExport,
    handleExportPDF,
    handleFullExport,
  };
}
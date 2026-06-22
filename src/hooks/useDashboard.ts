import { useMemo, useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { computeStats } from '@/lib/dashboard-utils';
import { exportToExcel, exportDashboardToPDF, exportDashboardToExcel } from '@/lib/export-utils';
import { supabase } from '@/integrations/supabase/client';
import { TOTAL_SLOTS } from '@/lib/app-utils';

export function useDashboard() {
  const history = useAppStore(s => s.history);
  const isHistoryLoading = useAppStore(s => s.isHistoryLoading);
  const historyError = useAppStore(s => s.historyError);
  const loadHistory = useAppStore(s => s.loadHistory);
  const setFormData = useAppStore(s => s.setFormData);
  
  const [dbStats, setDbStats] = useState<any>(null);
  const [cadastroMap, setCadastroMap] = useState<Map<string, string>>(new Map());

  const fetchDbStats = useCallback(async () => {
    try {
      const [{ data: posicoes, error: e1 }, { data: cadastro, error: e2 }] = await Promise.all([
        supabase.from('estoque_posicoes').select('status'),
        supabase.from('itens_cadastro').select('codigo, descricao'),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const stats = {
        tecido: { used: 0, total: TOTAL_SLOTS, reserved: 0, blocked: 0 },
        madeira: { used: 0, total: 1000, reserved: 0, blocked: 0 }
      };
      posicoes?.forEach(p => {
        if (p.status === 'ocupado') stats.tecido.used++;
        else if (p.status === 'reservado') stats.tecido.reserved++;
        else if (p.status === 'bloqueado') stats.tecido.blocked++;
      });
      setDbStats(stats);

      const map = new Map<string, string>();
      cadastro?.forEach((c: any) => {
        if (c.codigo && c.descricao) map.set(String(c.codigo).trim(), c.descricao);
      });
      setCadastroMap(map);
    } catch (e) {
      console.error('Error fetching dashboard DB stats:', e);
    }
  }, []);

  useEffect(() => {
    fetchDbStats();
  }, [fetchDbStats]);

  const stats = useMemo(() => computeStats(history, dbStats, cadastroMap), [history, dbStats, cadastroMap]);
  const [detailChart, setDetailChart] = useState<{ title: string; data: any[]; type: 'pie' | 'bar' | 'area' } | null>(null);

  const handleStatClick = useCallback((id: string) => {
    // If it's a specific tab identifier from our cards
    const tabMap: Record<string, import('@/types').AppTab> = {
      'conferentes': 'inicio',
      'conferences': 'history',
      'registros': 'reservas'
    };
    
    if (tabMap[id]) {
      setFormData({ activeTab: tabMap[id] });
    }
  }, [setFormData]);

  const handleExport = useCallback((data: any[], fileName: string) => {
    exportToExcel(data, fileName);
  }, []);

  const handleExportPDF = useCallback((elementId: string, fileName: string) => {
    exportDashboardToPDF(elementId, fileName, stats);
  }, [stats]);

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
    refreshDbStats: fetchDbStats
  };
}

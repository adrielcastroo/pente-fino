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
    // Run independently so one failure doesn't kill the other (was: codigo column
    // didn't exist and threw, leaving dbStats null → tecido.used = 0 → 0%).
    try {
      const { data: posicoes, error: e1 } = await supabase
        .from('estoque_posicoes')
        .select('status, item, estrutura');
      if (e1) throw e1;

      const stats = {
        // Tecido = apenas estruturas do padrão TECxx (mapa 2D).
        tecido: { used: 0, total: TOTAL_SLOTS, reserved: 0, blocked: 0 },
        // CHÃO = área livre, sem limite → métrica separada.
        chao: { used: 0 },
        // Madeira ainda não tem fonte real → mantemos null para ocultar o card.
        madeira: null as null | { used: number; total: number; reserved: number; blocked: number },
      };
      posicoes?.forEach((p: any) => {
        const estrutura = String(p.estrutura ?? '').trim().toUpperCase();
        const isTec = /^TEC/i.test(estrutura);
        const isChao = estrutura === 'CHÃO' || estrutura === 'CHAO';
        const occupied = p.status === 'ocupado' || (p.item && String(p.item).trim() !== '');
        if (isChao) {
          if (occupied) stats.chao.used++;
          return;
        }
        if (!isTec) return;
        if (p.status === 'reservado') stats.tecido.reserved++;
        else if (p.status === 'bloqueado') stats.tecido.blocked++;
        else if (occupied) stats.tecido.used++;
      });
      setDbStats(stats);
    } catch (e) {
      console.error('Error fetching estoque stats:', e);
    }

    try {
      const { data: cadastro, error: e2 } = await supabase
        .from('itens_cadastro')
        .select('codigo_interno, codigo_fornecedor, codigos_fornecedor, descricao');
      if (e2) throw e2;
      const map = new Map<string, string>();
      const addKey = (raw: any, desc: string) => {
        const k = String(raw ?? '').trim();
        if (!k) return;
        map.set(k, desc);
        map.set(k.toUpperCase(), desc);
      };
      cadastro?.forEach((c: any) => {
        if (!c.descricao) return;
        addKey(c.codigo_interno, c.descricao);
        addKey(c.codigo_fornecedor, c.descricao);
        if (Array.isArray(c.codigos_fornecedor)) {
          c.codigos_fornecedor.forEach((cf: any) => addKey(cf, c.descricao));
        }
      });
      setCadastroMap(map);
    } catch (e) {
      console.error('Error fetching cadastro map:', e);
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

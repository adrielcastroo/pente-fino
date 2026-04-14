import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Registro } from '@/types';

const SORT_MAP: Record<string, (a: any, b: any) => number> = {
  'item': (a, b) => (a.item || '').localeCompare(b.item || ''),
  'ml-d': (a, b) => (b.mLinear || 0) - (a.mLinear || 0),
  'ml-a': (a, b) => (a.mLinear || 0) - (b.mLinear || 0),
  'end': (a, b) => (a.endereco || '').localeCompare(b.endereco || ''),
};

export function useRightPanelTable() {
  const {
    registros, currentMode, searchQuery, setSearchQuery, sortBy, setSortBy,
    deleteRegistro, undo, undoStack, updateRegistro, clearAll
  } = useAppStore(useShallow(s => ({
    registros: s.registros,
    currentMode: s.currentMode,
    searchQuery: s.searchQuery,
    setSearchQuery: s.setSearchQuery,
    sortBy: s.sortBy,
    setSortBy: s.setSortBy,
    deleteRegistro: s.deleteRegistro,
    undo: s.undo,
    undoStack: s.undoStack,
    updateRegistro: s.updateRegistro,
    clearAll: s.clearAll
  })));

  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredRows = useMemo(() => {
    let result = [...registros];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(r =>
        (r.item || '').toLowerCase().includes(q) ||
        (r.endereco || '').toLowerCase().includes(q) ||
        (r.lote || '').toLowerCase().includes(q) ||
        (r.loteSistema || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [registros, searchQuery]);

  const sortedRows = useMemo(() => {
    let result = [...filteredRows];
    if (sortBy && SORT_MAP[sortBy]) {
      result.sort(SORT_MAP[sortBy]);
    }
    return result;
  }, [filteredRows, sortBy]);

  const totals = useMemo(() => {
    return filteredRows.reduce((acc, r) => ({
      ml: acc.ml + r.mLinear,
      m2: acc.m2 + r.m2,
      qtd: acc.qtd + (r.quantidade || 0)
    }), { ml: 0, m2: 0, qtd: 0 });
  }, [filteredRows]);

  const startEdit = useCallback((rowId: string, key: string, currentValue: string) => {
    setEditingCell({ rowId, key });
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { rowId, key } = editingCell;
    const numericKeys = ['m2', 'mLinear', 'largura'];
    const intKeys = ['quantidade'];
    const parsedValue = numericKeys.includes(key)
      ? parseFloat(editValue) || 0
      : intKeys.includes(key)
        ? parseInt(editValue, 10) || 0
        : editValue;
    updateRegistro(rowId, { [key]: parsedValue });
    setEditingCell(null);
    toast.success('Registro atualizado com sucesso.');
  }, [editingCell, editValue, updateRegistro]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleClearAll = useCallback(() => {
    if (!registros.length) return;
    toast.error('Limpar todos os registros?', {
      action: {
        label: 'Limpar Agora',
        onClick: () => {
          clearAll();
          toast.success('A tabela foi limpa com sucesso.');
        }
      },
      duration: 5000,
    });
  }, [registros.length, clearAll]);

  return {
    registros,
    currentMode,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortedRows,
    totals,
    deleteRegistro,
    undo,
    undoStack,
    editingCell,
    editValue,
    setEditValue,
    startEdit,
    commitEdit,
    cancelEdit,
    handleClearAll
  };
}

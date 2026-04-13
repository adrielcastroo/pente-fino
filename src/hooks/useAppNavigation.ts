import { useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AppTab } from '@/types';

export function useAppNavigation() {
  const setMode = useAppStore(s => s.setMode);
  const currentMode = useAppStore(s => s.currentMode);
  const activeTab = useAppStore(s => s.formData.activeTab);
  const setFormData = useAppStore(s => s.setFormData);
  
  const handleTabChange = useCallback((tab: AppTab) => {
    setFormData({ activeTab: tab });
    
    // Sync mode with tab for better consistency
    if (tab === 'tecido') {
      if (currentMode === 'madeira' || currentMode === 'motor' || currentMode === 'controle') {
        setMode('manual');
      }
    } else if (tab === 'madeira') {
      setMode('madeira');
    } else if (tab === 'motor') {
      // Restore submode from formData when entering motor tab
      const state = useAppStore.getState();
      setMode(state.formData.motorSubMode || 'motor');
    }
  }, [currentMode, setMode, setFormData]);

  return {
    activeTab,
    handleTabChange
  };
}
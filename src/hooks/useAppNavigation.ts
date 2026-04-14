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
      if (!['manual', 'openrouter', 'diversos'].includes(currentMode)) {
        setMode('manual');
      }
    } else if (tab === 'madeira') {
      setMode('madeira');
    } else if (tab === 'motor') {
      const state = useAppStore.getState();
      const targetMode = state.formData.motorSubMode || 'motor';
      if (currentMode !== targetMode) {
        setMode(targetMode);
      }
    } else if (tab === 'inicio') {
       // Optional: reset to a default mode when going home
    }
  }, [currentMode, setMode, setFormData]);

  return {
    activeTab,
    handleTabChange
  };
}
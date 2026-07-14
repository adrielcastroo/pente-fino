// ============================================================================
// Hook: presets built-in + custom (localStorage) + aplicação com/sem impressão.
// ============================================================================
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Preset, Template } from '../types/etiqueta';
import { BUILT_IN_PRESETS, loadCustomPresets, saveCustomPresets, templateToPreset } from '../utils/etiquetaPresets';

export interface UsePresetsReturn {
  presets: Preset[];
  customPresets: Preset[];
  apply: (id: string) => Partial<Template> | null;
  createCustomFromTemplate: (t: Template, label: string, description?: string) => string;
  removeCustom: (id: string) => void;
}

export function useEtiquetaPresets(): UsePresetsReturn {
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => loadCustomPresets());

  const presets = useMemo(() => [...BUILT_IN_PRESETS, ...customPresets], [customPresets]);

  const apply = useCallback((id: string): Partial<Template> | null => {
    const p = presets.find((x) => x.id === id);
    if (!p) return null;
    toast.success(`Preset "${p.label}" aplicado.`);
    return p.patch;
  }, [presets]);

  const createCustomFromTemplate = useCallback((t: Template, label: string, description?: string) => {
    const preset = templateToPreset(t, label, description);
    const next = [preset, ...customPresets];
    setCustomPresets(next);
    saveCustomPresets(next);
    toast.success(`Preset "${label}" salvo.`);
    return preset.id;
  }, [customPresets]);

  const removeCustom = useCallback((id: string) => {
    const next = customPresets.filter((p) => p.id !== id);
    setCustomPresets(next);
    saveCustomPresets(next);
  }, [customPresets]);

  return { presets, customPresets, apply, createCustomFromTemplate, removeCustom };
}

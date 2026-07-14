// ============================================================================
// Hook: variáveis globais + template + auto-fill via picking.
// ============================================================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Vars, PickingLike, Template } from '../types/etiqueta';
import { loadGlobalVars, saveGlobalVars } from '../utils/etiquetaStorage';

export interface UseVariablesReturn {
  globalVars: Vars;
  setGlobalVars: (v: Vars) => void;
  patchGlobalVars: (patch: Vars) => void;
  templateVars: Vars;
  setTemplateVars: (v: Vars) => void;
  mergedVars: Vars;
  applyPicking: (p: PickingLike) => void;
  clearTemplateVars: () => void;
}

export function useEtiquetaVariables(
  active: Template | null,
  updateActive: (patch: Partial<Template>) => void,
): UseVariablesReturn {
  const [globalVars, _setGlobalVars] = useState<Vars>(() => loadGlobalVars());

  useEffect(() => {
    const id = setTimeout(() => saveGlobalVars(globalVars), 200);
    return () => clearTimeout(id);
  }, [globalVars]);

  const setGlobalVars = useCallback((v: Vars) => _setGlobalVars(v), []);
  const patchGlobalVars = useCallback((patch: Vars) => {
    _setGlobalVars((cur) => ({ ...cur, ...patch }));
  }, []);

  const templateVars = active?.templateVars ?? {};

  const setTemplateVars = useCallback((v: Vars) => {
    if (!active) return;
    updateActive({ templateVars: v });
  }, [active, updateActive]);

  const clearTemplateVars = useCallback(() => {
    if (!active) return;
    updateActive({ templateVars: {} });
  }, [active, updateActive]);

  const applyPicking = useCallback((p: PickingLike) => {
    const nf = p.nfe_numero ?? '';
    const patch: Vars = {
      romaneio: p.numero,
      nf: String(nf),
      cliente: p.cliente,
      transportadora: p.transportadora?.nome ?? '',
      data: new Date().toLocaleDateString('pt-BR'),
    };
    _setGlobalVars((cur) => ({ ...cur, ...patch }));
    toast.success(`Variáveis preenchidas com picking ${p.numero}`);
  }, []);

  const mergedVars = useMemo<Vars>(() => ({ ...globalVars, ...templateVars }), [globalVars, templateVars]);

  return { globalVars, setGlobalVars, patchGlobalVars, templateVars, setTemplateVars, mergedVars, applyPicking, clearTemplateVars };
}

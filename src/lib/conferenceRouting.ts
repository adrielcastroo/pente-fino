import type { Conference, AppMode } from '@/types';

/**
 * Decide qual página operacional abrir ao retomar uma conferência arquivada
 * a partir do botão "Incluir Item" em /historico.
 */
export function routeForConference(conf: Conference): string {
  const modos = new Set(conf.registros.map(r => r.modoOrigem || ''));
  if (modos.has('motor') || modos.has('controle')) return '/estoque/motor';
  if (modos.has('madeira')) return '/estoque/madeira';
  return '/estoque/tecido';
}

/**
 * Modo predominante da conferência (para configurar currentMode ao retomar).
 */
export function inferConferenceMode(conf: Conference): AppMode {
  const first = conf.registros.find(r => r.modoOrigem)?.modoOrigem;
  if (first === 'motor' || first === 'controle' || first === 'madeira' ||
      first === 'diversos' || first === 'openrouter' || first === 'etiq_pronta' ||
      first === 'manual') {
    return first as AppMode;
  }
  return 'manual';
}

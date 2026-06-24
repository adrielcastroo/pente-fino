/**
 * Validação automatizada de persistência das configurações de /configuracoes.
 *
 * Garante que os campos editáveis na página de configurações (labelSettings e
 * dashboardDialogTheme) sobrevivem a:
 *   1. Um reload da página (re-hydration do Zustand a partir do localStorage)
 *   2. Reabrir o app em uma nova sessão do navegador (mesma chave persistida)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const STORAGE_KEY = 'cft4-registros';

describe('persistência das configurações (/configuracoes)', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    // Remove timers de debounce pendentes do persister
    (window as any)._persisterTimer = null;
    (window as any)._persisterValue = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persiste labelSettings e dashboardDialogTheme no localStorage e re-hidrata após reload', async () => {
    // 1ª sessão: monta a store, altera configurações
    let mod = await import('./useAppStore');
    mod.useAppStore.getState().setLabelSettings({
      fontSize: 22,
      showSku: false,
      printOffsetXMm: -8,
    });
    mod.useAppStore.getState().setDashboardDialogTheme('dark');

    // Persister tem debounce de 1s
    vi.advanceTimersByTime(1500);

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.labelSettings.fontSize).toBe(22);
    expect(parsed.state.labelSettings.showSku).toBe(false);
    expect(parsed.state.labelSettings.printOffsetXMm).toBe(-8);
    expect(parsed.state.dashboardDialogTheme).toBe('dark');

    // 2ª sessão: simula reload / reabrir o navegador re-importando o módulo.
    // O localStorage é preservado entre resetModules, então o middleware persist
    // deve re-hidratar os valores.
    vi.resetModules();
    mod = await import('./useAppStore');
    const rehydrated = mod.useAppStore.getState();

    expect(rehydrated.labelSettings.fontSize).toBe(22);
    expect(rehydrated.labelSettings.showSku).toBe(false);
    expect(rehydrated.labelSettings.printOffsetXMm).toBe(-8);
    expect(rehydrated.dashboardDialogTheme).toBe('dark');
  });
});

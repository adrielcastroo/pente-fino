/**
 * Feedback sensorial para evento de bipagem bem-sucedida.
 * - Som curto via WebAudio (sem assets externos).
 * - Vibração no dispositivo (mobile).
 * Falhas são silenciosas: o som/vibração é progressive enhancement.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

const STORAGE_KEY = 'bip-sound-enabled';

// Restaura preferência do usuário
try {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === '0') soundEnabled = false;
} catch { /* ignore */ }

export function setBipSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch { /* ignore */ }
}

export function isBipSoundEnabled(): boolean {
  return soundEnabled;
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Beep curto (estilo leitor de código de barras). */
export function playBipSound(variant: 'success' | 'error' = 'success'): void {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = variant === 'success' ? 880 : 220;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch { /* ignore */ }
}

/** Helper único: vibração + som de sucesso. */
export function bipSuccess(): void {
  try { navigator.vibrate?.(60); } catch { /* ignore */ }
  playBipSound('success');
}

export function bipError(): void {
  try { navigator.vibrate?.([100, 50, 100, 50, 100]); } catch { /* ignore */ }
  playBipSound('error');
}

/** Item já bipado (duplicado). Vibração dupla longa. */
export function bipDuplicate(): void {
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignore */ }
  playBipSound('error');
}

/** Feedback de bipagem por tipo de resultado. */
export type ScanResult = 'success' | 'error' | 'duplicate';
export function vibrateOnScan(result: ScanResult): void {
  if (result === 'success') return bipSuccess();
  if (result === 'duplicate') return bipDuplicate();
  return bipError();
}

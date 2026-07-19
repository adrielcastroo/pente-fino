// ============================================================
// Expedição — SLA helpers (Fase 10)
// Thresholds em minutos por status. Calculados client-side a
// partir de created_at; sem alterações de schema.
// ============================================================
import type { PickingStatus } from '@/hooks/expedicao/useExpedicaoData';

export interface SlaThreshold {
  warn: number;
  late: number;
}

export const SLA_THRESHOLDS: Partial<Record<PickingStatus, SlaThreshold>> = {
  aguardando:     { warn: 30, late: 60 },
  em_separacao:   { warn: 60, late: 120 },
  em_conferencia: { warn: 30, late: 60 },
};

export type SlaLevel = 'ok' | 'warn' | 'late' | 'none';

export interface SlaInfo {
  level: SlaLevel;
  minutes: number;
  label: string;
  cls: string;
}

const FINAL: PickingStatus[] = ['conferido', 'faturado', 'cancelado'];

export function computeSla(status: PickingStatus, createdAt: string): SlaInfo {
  if (FINAL.includes(status)) {
    return { level: 'none', minutes: 0, label: '—', cls: '' };
  }
  const th = SLA_THRESHOLDS[status];
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (!th) return { level: 'ok', minutes, label: formatMinutes(minutes), cls: '' };

  if (minutes >= th.late) {
    return {
      level: 'late',
      minutes,
      label: `Atrasado · ${formatMinutes(minutes)}`,
      cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    };
  }
  if (minutes >= th.warn) {
    return {
      level: 'warn',
      minutes,
      label: `Atenção · ${formatMinutes(minutes)}`,
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    };
  }
  return {
    level: 'ok',
    minutes,
    label: `No prazo · ${formatMinutes(minutes)}`,
    cls: 'bg-emerald-50 text-success dark:bg-emerald-950 dark:text-emerald-300',
  };
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h${String(r).padStart(2, '0')}`;
}

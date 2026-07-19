/**
 * Mapa único de cores para badges por tipo de item / modo de conferência.
 * Fonte de verdade compartilhada entre módulos (Estoque, Expedição, …).
 * Usa cores raw (blue/purple/…) por ser semântica *categorial*, não de status.
 */
export const BADGE_COLOR_MAP: Record<string, string> = {
  Motor:              'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  Controle:           'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  Cortina:            'bg-amber-500/10 text-warning dark:text-warning border border-amber-500/20',
  Coulisse:           'bg-emerald-500/10 text-success dark:text-success border border-emerald-500/20',
  Rolo:               'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  Madeira:            'bg-orange-500/10 text-warning dark:text-warning border border-orange-500/20',
  'Celular/Plissada': 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
  'IA Vision':        'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20',
  Diversos:           'bg-muted text-muted-foreground border border-border',
};

export const BADGE_FALLBACK = 'bg-muted text-muted-foreground border border-border';

export function getBadgeClass(type: string): string {
  return BADGE_COLOR_MAP[type] ?? BADGE_FALLBACK;
}

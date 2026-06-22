import { Conference, AppStats } from '@/types';
import { TOTAL_SLOTS } from './app-utils';

/**
 * Formata um intervalo de datas em PT-BR.
 * Ex.: formatPeriodLabel(7) → "Últimos 7 dias (15/06 – 22/06)"
 */
export function formatPeriodLabel(days: number, end: Date = new Date()): string {
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `Últimos ${days} dias (${fmt(start)} – ${fmt(end)})`;
}

// Normaliza nome do conferente: trim, colapsa espaços, Title Case sensível a acentos
export const normalizeConferente = (raw: string | null | undefined): string => {
  const cleaned = (raw || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Anônimo';
  return cleaned
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map(w => w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1))
    .join(' ');
};

export const computeStats = (
  history: Conference[],
  stats_estoque: any,
  cadastroMap: Map<string, string> = new Map()
): AppStats => {
  const totalConferentes = new Set(history.map(h => normalizeConferente(h.conferente))).size;
  const totalConferencias = history.length;
  const totalRegistros = history.reduce((acc, h) => acc + h.registros.length, 0);
  
  // Calculate average duration — filter outliers (sessions > 12h are almost
  // always forgotten/abandoned ones that inflate the mean).
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  const allDurations = history
    .filter(h => h.startedAt && h.finishedAt)
    .map(h => Math.abs(new Date(h.finishedAt!).getTime() - new Date(h.startedAt!).getTime()));
  const durations = allDurations.filter(d => d > 0 && d <= TWELVE_HOURS_MS);

  const avgMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const avgMinsTotal = Math.floor(avgMs / 60000);
  const avgHours = Math.floor(avgMinsTotal / 60);
  const avgMins = avgMinsTotal % 60;
  const avgDurationStr = avgMs === 0
    ? '—'
    : avgHours > 0 ? `${avgHours}h ${avgMins}min` : avgMinsTotal < 1 ? '< 1min' : `${avgMins}min`;

  // Timeline (last 7 sessions) — include date + conferente for richer cards
  const timeline = history.slice(0, 7).reverse().map(h => {
    const d = h.date ? new Date(h.date) : null;
    const dStr = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : '';
    const conf = normalizeConferente(h.conferente).split(' ')[0] || '—';
    const proc = (h.processo || h.name || '').slice(0, 8);
    return {
      name: `${dStr} ${conf} ${proc}`.trim(),
      total: h.registros.length,
    };
  });

  // Top Conferentes (sorted) — usa nome normalizado para deduplicar
  const conferenteMap = new Map<string, number>();
  history.forEach(h => {
    const key = normalizeConferente(h.conferente);
    conferenteMap.set(key, (conferenteMap.get(key) || 0) + h.registros.length);
  });

  const topConferentes = Array.from(conferenteMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Setores — carga de trabalho = nº de registros por setor (não conferências)
  let regTecido = 0, regMadeira = 0, regMotor = 0;
  history.forEach(h => h.registros.forEach(r => {
    if (r.modoOrigem === 'tecido') regTecido++;
    else if (r.modoOrigem === 'madeira') regMadeira++;
    else if (r.modoOrigem === 'motor') regMotor++;
  }));
  const categorias = [
    { name: `Tecidos (${regTecido})`, value: regTecido },
    { name: `Madeira (${regMadeira})`, value: regMadeira },
    { name: `Motores (${regMotor})`, value: regMotor },
  ];

  // Tipos de Materiais — resolve código → descrição quando disponível
  const tiposMap = new Map<string, number>();
  history.flatMap(h => h.registros).forEach(r => {
    const codigo = (r.item || '').trim();
    const descricao = cadastroMap.get(codigo) || cadastroMap.get(codigo.toUpperCase());
    const display = descricao ? `${descricao}` : (codigo || 'Outros');
    const current = tiposMap.get(display) || 0;
    tiposMap.set(display, current + 1);
  });

  const tipos = Array.from(tiposMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Conferente Details — chaveia pelo nome normalizado
  const conferenteDetails = Array.from(conferenteMap.entries()).map(([name, total]) => {
    const sessions = history.filter(h => normalizeConferente(h.conferente) === name);
    return {
      name,
      total,
      conferences: sessions.length,
      lastDate: sessions[0]?.date || ''
    };
  });

  return {
    totalConferentes,
    totalConferencias,
    totalRegistros,
    avgDuration: avgDurationStr,
    timeline,
    topConferentes,
    categorias,
    tipos,
    conferenteDetails,
    occupation: {
      tecido: {
        used: stats_estoque?.tecido?.used || 0,
        total: stats_estoque?.tecido?.total || TOTAL_SLOTS,
        reserved: stats_estoque?.tecido?.reserved || 0,
        blocked: stats_estoque?.tecido?.blocked || 0,
      },
      madeira: {
        used: stats_estoque?.madeira?.used || 0,
        total: stats_estoque?.madeira?.total || 0,
        reserved: stats_estoque?.madeira?.reserved || 0,
        blocked: stats_estoque?.madeira?.blocked || 0,
      }
    }
  };
};

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

  // Timeline — agrupa registros por DIA dos últimos 7 dias (inclui o hoje).
  // Dias sem movimentação aparecem com total = 0 para preservar a linha temporal.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayBuckets: { name: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    dayBuckets.push({ name: label, total: 0 });
  }
  const idxByLabel = new Map(dayBuckets.map((b, i) => [b.name, i]));
  history.forEach(h => {
    if (!h.date) return;
    const d = new Date(h.date);
    if (isNaN(d.getTime())) return;
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diffDays < 0 || diffDays > 6) return;
    const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const idx = idxByLabel.get(label);
    if (idx !== undefined) dayBuckets[idx].total += h.registros.length;
  });
  const timeline = dayBuckets;

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

  // Setores — mapeia modo_origem real do banco para os setores operacionais.
  // "Outros" captura registros com modo_origem desconhecido/vazio para não perder linhas.
  const TECIDO_MODES = new Set(['manual', 'diversos', 'etiq_pronta', 'openrouter', 'tecido']);
  const MADEIRA_MODES = new Set(['madeira']);
  const MOTOR_MODES = new Set(['motor', 'controle']);
  let regTecido = 0, regMadeira = 0, regMotor = 0, regOutros = 0;
  history.forEach(h => h.registros.forEach(r => {
    const m = String(r.modoOrigem || '').toLowerCase();
    if (TECIDO_MODES.has(m)) regTecido++;
    else if (MADEIRA_MODES.has(m)) regMadeira++;
    else if (MOTOR_MODES.has(m)) regMotor++;
    else regOutros++;
  }));
  const categorias = [
    { name: `Tecidos (${regTecido})`, value: regTecido },
    { name: `Madeira (${regMadeira})`, value: regMadeira },
    { name: `Motor/Controle (${regMotor})`, value: regMotor },
    ...(regOutros > 0 ? [{ name: `Outros (${regOutros})`, value: regOutros }] : []),
  ];

  // Tipos de Materiais — resolve código → descrição (codigo_interno, codigo_fornecedor
  // ou codigos_fornecedor[]). Itens sem match ficam rotulados como "(sem cadastro)"
  // e agora aparecem no gráfico para expor a lacuna de cadastro (antes eram filtrados).
  const truncate = (s: string, n = 32) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const tiposMap = new Map<string, number>();
  history.flatMap(h => h.registros).forEach(r => {
    const codigo = (r.item || '').trim();
    if (!codigo) {
      tiposMap.set('(sem item)', (tiposMap.get('(sem item)') || 0) + 1);
      return;
    }
    const descricao = cadastroMap.get(codigo) || cadastroMap.get(codigo.toUpperCase());
    const display = descricao ? truncate(descricao) : `${truncate(codigo, 24)} (sem cadastro)`;
    tiposMap.set(display, (tiposMap.get(display) || 0) + 1);
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
      chao: {
        used: stats_estoque?.chao?.used || 0,
      },
      // Sem fonte real → null. A UI oculta o card quando null.
      madeira: stats_estoque?.madeira
        ? {
            used: stats_estoque.madeira.used || 0,
            total: stats_estoque.madeira.total || 0,
            reserved: stats_estoque.madeira.reserved || 0,
            blocked: stats_estoque.madeira.blocked || 0,
          }
        : null,
    }
  };
};

import { Conference } from '@/types';
import { TOTAL_SLOTS } from './app-utils';

// Memoized date formatter to avoid recreation
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

// Bounded LRU-ish cache to avoid unbounded memory growth on long sessions
const dateCache = new Map<string, string>();
const DATE_CACHE_MAX = 500;

function getCachedDate(id: string, raw: string): string {
  const cached = dateCache.get(id);
  if (cached) return cached;
  const d = new Date(raw);
  const value = !isNaN(d.getTime()) ? dateFormatter.format(d) : '??/??';
  if (dateCache.size >= DATE_CACHE_MAX) {
    const firstKey = dateCache.keys().next().value;
    if (firstKey !== undefined) dateCache.delete(firstKey);
  }
  dateCache.set(id, value);
  return value;
}

export function computeStats(history: Conference[], dbStats?: any) {
  const confMap = new Map<string, { name: string; total: number; conferences: number; lastDate: string; items: Set<string> }>();
  const catMap = new Map<string, number>();
  const subMap = new Map<string, number>();
  const tipoMap = new Map<string, number>();
  const timelineMap = new Map<string, { name: string; tecido: number; motor: number; madeira: number; total: number }>();
  
  let totalRegistros = 0;
  let totalDuration = 0;
  let durationCount = 0;

  const DESC_STR = 'Desconhecido';
  const TEC_STR = 'Tecido';
  const COU_STR = 'Coulisse';
  const MAD_STR = 'Madeira';
  const MOT_STR = 'Motor/Controle';

  // Process history in a single pass
  for (let i = 0, len = history.length; i < len; i++) {
    const conference = history[i];
    const name = conference.conferente || DESC_STR;
    const dateStr = getCachedDate(conference.id, conference.date);

    // Timeline processing
    let timelineEntry = timelineMap.get(dateStr);
    if (!timelineEntry) {
      timelineEntry = { name: dateStr, tecido: 0, motor: 0, madeira: 0, total: 0 };
      timelineMap.set(dateStr, timelineEntry);
    }
    timelineEntry.total++;

    // Conferente processing
    let conferenteEntry = confMap.get(name);
    if (!conferenteEntry) {
      conferenteEntry = { name, total: 0, conferences: 0, lastDate: '', items: new Set() };
      confMap.set(name, conferenteEntry);
    }
    conferenteEntry.conferences++;
    if (!conferenteEntry.lastDate || conference.date > conferenteEntry.lastDate) {
      conferenteEntry.lastDate = conference.date;
    }

    // Duration processing
    if (conference.startedAt && conference.finishedAt) {
      const s = new Date(conference.startedAt).getTime();
      const e = new Date(conference.finishedAt).getTime();
      if (!isNaN(s) && !isNaN(e)) {
        const diff = e - s;
        if (diff > 0 && diff < 86400000) { // Limit to 24h to filter out anomalies
          totalDuration += diff;
          durationCount++;
        }
      }
    }
    
    const regs = conference.registros;
    for (let j = 0, regLen = regs.length; j < regLen; j++) {
      const r = regs[j];
      totalRegistros++;
      conferenteEntry.total++;
      
      if (r.nf) conferenteEntry.items.add(`NF:${r.nf}`);
      if (r.processo) conferenteEntry.items.add(`PROC:${r.processo}`);
      
      const modo = r.modoOrigem || 'manual';
      let cat = TEC_STR;
      let sub = COU_STR;

      if (modo === 'madeira') {
        cat = MAD_STR; sub = MAD_STR;
        timelineEntry.madeira++;
      } else if (modo === 'motor' || modo === 'controle') {
        cat = MOT_STR; sub = MOT_STR;
        timelineEntry.motor++;
      } else {
        timelineEntry.tecido++;
        if (modo === 'openrouter') sub = 'IA';
        else if (modo === 'diversos') sub = 'Diversos';
      }
      
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
      
      const tipo = r.tipoTecido || 'Rolo';
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
  }

  const sortByValueDesc = (a: any, b: any) => (b.value || b.count || 0) - (a.value || a.count || 0);

  const avgMins = durationCount > 0 ? Math.round(totalDuration / durationCount / 60000) : 0;
  const avgDurationStr = avgMins >= 60 ? `${Math.floor(avgMins / 60)}h ${avgMins % 60}min` : `${avgMins}min`;

  // Default occupation values if no dbStats provided
  const occupation = dbStats || {
    tecido: { used: 41, total: TOTAL_SLOTS, reserved: 0, blocked: 0 },
    madeira: { used: 0, total: 1000, reserved: 0, blocked: 0 }
  };

  const conferenteDetails = Array.from(confMap.values())
    .map(data => ({ name: data.name, total: data.total, conferences: data.conferences, lastDate: data.lastDate }))
    .sort(sortByTotalDesc);

  return {
    topConferentes: Array.from(confMap.values())
      .map(data => ({ name: data.name, value: data.items.size, total: data.total, conferences: data.conferences, lastDate: data.lastDate }))
      .sort(sortByValueDesc).slice(0, 10),
    conferenteDetails,
    categorias: Array.from(catMap, ([name, value]) => ({ name, value }))
      .sort(sortByValueDesc),
    ferramentas: Array.from(subMap, ([name, value]) => ({ name, value }))
      .sort(sortByValueDesc),
    tipos: Array.from(tipoMap, ([name, value]) => ({ name, value }))
      .sort(sortByValueDesc).slice(0, 8),
    timeline: Array.from(timelineMap.values()).slice(-10),
    totalRegistros,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
    avgDuration: avgDurationStr,
    occupation
  };
}

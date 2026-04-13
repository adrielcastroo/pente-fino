import { Conference } from '@/types';
import { toast } from 'sonner';

export function computeStats(history: Conference[]) {
  const confMap = new Map<string, Set<string>>();
  const catMap = new Map<string, number>();
  const subMap = new Map<string, number>();
  const tipoMap = new Map<string, number>();
  const timelineMap = new Map<string, number>();
  let totalRegistros = 0;

  for (const conference of history) {
    const name = conference.conferente || 'Desconhecido';
    const date = new Date(conference.id).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    timelineMap.set(date, (timelineMap.get(date) || 0) + 1);

    let confSet = confMap.get(name);
    if (!confSet) {
      confSet = new Set();
      confMap.set(name, confSet);
    }
    for (const r of conference.registros) {
      totalRegistros++;
      if (r.nf) confSet.add(`NF:${r.nf}`);
      if (r.processo) confSet.add(`PROC:${r.processo}`);
      const modo = r.modoOrigem || 'manual';
      let cat = 'Tecido';
      if (modo === 'madeira') cat = 'Madeira';
      else if (modo === 'motor' || modo === 'controle') cat = 'Motor/Controle';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
      let sub = 'Coulisse';
      if (modo === 'openrouter') sub = 'IA';
      else if (modo === 'diversos') sub = 'Diversos';
      else if (modo === 'madeira') sub = 'Madeira';
      else if (modo === 'motor' || modo === 'controle') sub = 'Motor/Controle';
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
      const tipo = r.tipoTecido || 'Rolo';
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
  }

  // Get last 7 days for timeline
  const timeline = Array.from(timelineMap.entries())
    .map(([name, value]) => ({ name, value }))
    .slice(-7);

  return {
    topConferentes: Array.from(confMap.entries()).map(([name, set]) => ({ name, count: set.size })).sort((a, b) => b.count - a.count).slice(0, 5),
    categorias: Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    ferramentas: Array.from(subMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    tipos: Array.from(tipoMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
    timeline,
    totalRegistros,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
  };
}

// Note: exportToExcel was moved to @/lib/export-utils for performance (dynamic import)


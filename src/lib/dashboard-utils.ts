import { Conference } from '@/types';
import { toast } from 'sonner';

export function computeStats(history: Conference[]) {
  const confMap = new Map<string, Set<string>>();
  const catMap = new Map<string, number>();
  const subMap = new Map<string, number>();
  const tipoMap = new Map<string, number>();
  const timelineMap = new Map<string, number>();
  let totalRegistros = 0;

  // Pre-create formatter and cache results to avoid expensive operations in the loop
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
  const dateCache = new Map<string, string>();

  for (let i = 0, len = history.length; i < len; i++) {
    const conference = history[i];
    const name = conference.conferente || 'Desconhecido';
    
    let dateStr = dateCache.get(conference.id);
    if (!dateStr) {
      try {
        const d = new Date(conference.date);
        dateStr = !isNaN(d.getTime()) ? dateFormatter.format(d) : '??/??';
        dateCache.set(conference.id, dateStr);
      } catch {
        dateStr = '??/??';
      }
    }

    
    timelineMap.set(dateStr, (timelineMap.get(dateStr) || 0) + 1);

    let confSet = confMap.get(name);
    if (!confSet) {
      confSet = new Set();
      confMap.set(name, confSet);
    }
    
    const regs = conference.registros;
    for (let j = 0, regLen = regs.length; j < regLen; j++) {
      const r = regs[j];
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

  // Get last 7 entries for timeline
  const timeline = Array.from(timelineMap, ([name, value]) => ({ name, value })).slice(-7);

  return {
    topConferentes: Array.from(confMap, ([name, set]) => ({ name, count: set.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    categorias: Array.from(catMap, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    ferramentas: Array.from(subMap, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    tipos: Array.from(tipoMap, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
    timeline,
    totalRegistros,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
  };
}

// Note: exportToExcel was moved to @/lib/export-utils for performance (dynamic import)


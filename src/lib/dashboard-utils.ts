import { Conference } from '@/types';

// Memoized date formatter to avoid recreation
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const dateCache = new Map<string, string>();

export function computeStats(history: Conference[]) {
  const confMap = new Map<string, Set<string>>();
  const catMap = new Map<string, number>();
  const subMap = new Map<string, number>();
  const tipoMap = new Map<string, number>();
  const timelineMap = new Map<string, number>();
  let totalRegistros = 0;

  // Cache some repeated strings to avoid allocations
  const DESC_STR = 'Desconhecido';
  const TEC_STR = 'Tecido';
  const COU_STR = 'Coulisse';
  const MAD_STR = 'Madeira';
  const MOT_STR = 'Motor/Controle';

  for (let i = 0, len = history.length; i < len; i++) {
    const conference = history[i];
    const name = conference.conferente || DESC_STR;
    
    let dateStr = dateCache.get(conference.id);
    if (!dateStr) {
      const d = new Date(conference.date);
      dateStr = !isNaN(d.getTime()) ? dateFormatter.format(d) : '??/??';
      dateCache.set(conference.id, dateStr);
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
      let cat = TEC_STR;
      let sub = COU_STR;

      if (modo === 'madeira') {
        cat = MAD_STR; sub = MAD_STR;
      } else if (modo === 'motor' || modo === 'controle') {
        cat = MOT_STR; sub = MOT_STR;
      } else if (modo === 'openrouter') {
        sub = 'IA';
      } else if (modo === 'diversos') {
        sub = 'Diversos';
      }
      
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
      
      const tipo = r.tipoTecido || 'Rolo';
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
  }

  const sortByValueDesc = (a: any, b: any) => b.value - a.value;
  const sortByCountDesc = (a: any, b: any) => b.count - a.count;

  return {
    topConferentes: Array.from(confMap, ([name, set]) => ({ name, count: set.size }))
      .sort(sortByCountDesc).slice(0, 5),
    categorias: Array.from(catMap, ([name, value]) => ({ name, value }))
      .sort(sortByValueDesc),
    ferramentas: Array.from(subMap, ([name, count]) => ({ name, count }))
      .sort(sortByCountDesc),
    tipos: Array.from(tipoMap, ([name, value]) => ({ name, value }))
      .sort(sortByValueDesc).slice(0, 6),
    timeline: Array.from(timelineMap, ([name, value]) => ({ name, value })).slice(-7),
    totalRegistros,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
  };
}


// Note: exportToExcel was moved to @/lib/export-utils for performance (dynamic import)


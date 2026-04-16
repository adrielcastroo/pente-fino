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

  // Faster loop with local references
  for (let i = 0, len = history.length; i < len; i++) {
    const conference = history[i];
    const name = conference.conferente || 'Desconhecido';
    
    // Reuse date formatting results
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
      
      const nf = r.nf;
      const proc = r.processo;
      if (nf) confSet.add(`NF:${nf}`);
      if (proc) confSet.add(`PROC:${proc}`);
      
      const modo = r.modoOrigem || 'manual';
      let cat = 'Tecido';
      let sub = 'Coulisse';

      // Use object map for faster lookups than switch if possible, but switch is okay here
      switch (modo) {
        case 'madeira': cat = 'Madeira'; sub = 'Madeira'; break;
        case 'motor':
        case 'controle': cat = 'Motor/Controle'; sub = 'Motor/Controle'; break;
        case 'openrouter': sub = 'IA'; break;
        case 'diversos': sub = 'Diversos'; break;
      }
      
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
      
      const tipo = r.tipoTecido || 'Rolo';
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
  }

  // Pre-allocate arrays with known sizes for performance
  const topConferentes = Array.from(confMap, ([name, set]) => ({ name, count: set.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const categorias = Array.from(catMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const ferramentas = Array.from(subMap, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const tipos = Array.from(tipoMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const timeline = Array.from(timelineMap, ([name, value]) => ({ name, value })).slice(-7);

  return {
    topConferentes,
    categorias,
    ferramentas,
    tipos,
    timeline,
    totalRegistros,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
  };
}


// Note: exportToExcel was moved to @/lib/export-utils for performance (dynamic import)


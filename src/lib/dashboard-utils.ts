import { Conference, AppStats } from '@/types';
import { TOTAL_SLOTS } from './app-utils';

export const computeStats = (history: Conference[], stats_estoque: any): AppStats => {
  const totalConferentes = new Set(history.map(h => h.conferente)).size;
  const totalConferencias = history.length;
  const totalRegistros = history.reduce((acc, h) => acc + h.registros.length, 0);
  
  // Calculate real average duration
  const durations = history
    .filter(h => h.startedAt && h.finishedAt)
    .map(h => {
      const start = new Date(h.startedAt!).getTime();
      const end = new Date(h.finishedAt!).getTime();
      return Math.abs(end - start);
    });
  
  const avgMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const avgMinsTotal = Math.floor(avgMs / 60000);
  const avgHours = Math.floor(avgMinsTotal / 60);
  const avgMins = avgMinsTotal % 60;
  const avgDurationStr = avgHours > 0 ? `${avgHours}h ${avgMins}min` : `${avgMins}min`;

  // Timeline (last 7 sessions)
  const timeline = history.slice(0, 7).reverse().map(h => ({
    name: (h.processo || h.name || '').slice(0, 10),
    total: h.registros.length
  }));

  // Top 5 Conferentes
  const conferenteMap = new Map<string, number>();
  history.forEach(h => {
    const current = conferenteMap.get(h.conferente || 'Anônimo') || 0;
    conferenteMap.set(h.conferente || 'Anônimo', current + h.registros.length);
  });

  const topConferentes = Array.from(conferenteMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Categorias (Setores)
  const categorias = [
    { name: 'Tecidos', value: history.filter(h => h.registros.some(r => r.modoOrigem === 'tecido')).length },
    { name: 'Madeira', value: history.filter(h => h.registros.some(r => r.modoOrigem === 'madeira')).length },
    { name: 'Motores', value: history.filter(h => h.registros.some(r => r.modoOrigem === 'motor')).length },
  ].filter(c => c.value > 0);

  // Tipos de Materiais
  const tiposMap = new Map<string, number>();
  history.flatMap(h => h.registros).forEach(r => {
    const item = r.item || 'Outros';
    const current = tiposMap.get(item) || 0;
    tiposMap.set(item, current + 1);
  });

  const tipos = Array.from(tiposMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Conferente Details
  const conferenteDetails = Array.from(conferenteMap.entries()).map(([name, total]) => {
    const sessions = history.filter(h => h.conferente === name);
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

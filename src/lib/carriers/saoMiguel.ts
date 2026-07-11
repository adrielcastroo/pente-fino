import type { CarrierAdapter } from './index';
import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';

const STATUS_MAP: Record<string, TrackingStatus> = {
  ENTREGUE: 'entregue',
  EM_TRANSITO: 'em_transito',
  EM_TRANSITO_A: 'em_transito',
  DESPACHADO: 'despachado',
  COLETADO: 'despachado',
  PENDENTE: 'pendente',
  AGUARDANDO_COLETA: 'pendente',
  ERRO: 'erro',
  EXTRAVIO: 'erro',
  DEVOLVIDO: 'devolvido',
};

const API_URL = import.meta.env.VITE_SAOMIGUEL_API_URL || 'https://api.saomiguel.com.br';
const TOKEN = import.meta.env.VITE_SAOMIGUEL_TOKEN;

export const saoMiguel: CarrierAdapter = {
  name: 'Expresso São Miguel',
  code: 'saomiguel',
  icon: 'truck',
  color: 'bg-amber-700 text-white',
  detect: (c) => /^SM\d{8,12}$/i.test(c.trim()) || /^SAO\d{8,}$/i.test(c.trim()),
  validate: (c) => /^SM\d{8,12}$/i.test(c.trim()) || /^SAO\d{8,}$/i.test(c.trim()),
  async track(code): Promise<TrackResponse> {
    const clean = code.trim().toUpperCase();
    if (!TOKEN) {
      const { melhorEnvio } = await import('./melhorEnvio');
      return melhorEnvio.track(clean);
    }
    try {
      const res = await fetch(`${API_URL}/v1/rastreamento/${encodeURIComponent(clean)}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${TOKEN}`,
          'User-Agent': 'Pente Fino ERP',
        },
      });
      if (!res.ok) throw new Error(`São Miguel HTTP ${res.status}`);
      const data = await res.json();
      const raw = (data.events || data.eventos || data.data || []) as Array<Record<string, unknown>>;
      const events: TrackingEvent[] = raw.map((e) => ({
        timestamp: String(e.datetime || e.timestamp || e.data_hora || new Date().toISOString()),
        status: STATUS_MAP[String(e.status || '').toUpperCase()] || 'pendente',
        location: (e.location || e.city || e.local) as string | undefined,
        description: String(e.description || e.descricao || e.status || ''),
        details: e as Record<string, unknown>,
      }));
      const last = events[events.length - 1];
      return {
        code: clean,
        carrier: 'saomiguel',
        status: last?.status || 'pendente',
        events,
        lastUpdate: last?.timestamp || new Date().toISOString(),
        raw: data,
      };
    } catch {
      const { melhorEnvio } = await import('./melhorEnvio');
      return melhorEnvio.track(clean);
    }
  },
};

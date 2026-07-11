import type { CarrierAdapter } from './index';
import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';

const STATUS_MAP: Record<string, TrackingStatus> = {
  ENTREGUE: 'entregue',
  EM_TRANSITO: 'em_transito',
  DESPACHADO: 'despachado',
  COLETADO: 'despachado',
  PENDENTE: 'pendente',
  ERRO: 'erro',
  DEVOLVIDO: 'devolvido',
};

const API_URL = import.meta.env.VITE_JT_API_URL || 'https://api.jtexpress.com.br';

export const jt: CarrierAdapter = {
  name: 'J&T Express',
  code: 'jt',
  icon: 'truck',
  color: 'bg-orange-600 text-white',
  detect: (c) => /^BR\d{13,}$/i.test(c.trim()),
  validate: (c) => /^BR\d{13,}$/i.test(c.trim()),
  async track(code): Promise<TrackResponse> {
    const clean = code.trim().toUpperCase();
    const res = await fetch(`${API_URL}/track?code=${encodeURIComponent(clean)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`J&T HTTP ${res.status}`);
    const data = await res.json();
    const raw = (data.events || data.data || []) as Array<Record<string, unknown>>;
    const events: TrackingEvent[] = raw.map((e) => ({
      timestamp: String(e.datetime || e.timestamp || e.data_hora || new Date().toISOString()),
      status: STATUS_MAP[String(e.status || '').toUpperCase()] || 'pendente',
      location: (e.location || e.city || e.local) as string | undefined,
      description: String(e.description || e.status || ''),
      details: e as Record<string, unknown>,
    }));
    const last = events[events.length - 1];
    return {
      code: clean,
      carrier: 'jt',
      status: last?.status || 'pendente',
      events,
      lastUpdate: last?.timestamp || new Date().toISOString(),
      raw: data,
    };
  },
};

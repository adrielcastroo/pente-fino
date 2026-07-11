import type { CarrierAdapter } from './index';
import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';

const STATUS_MAP: Record<string, TrackingStatus> = {
  delivered: 'entregue',
  in_transit: 'em_transito',
  dispatched: 'despachado',
  collected: 'despachado',
  pending: 'pendente',
  error: 'erro',
  returned: 'devolvido',
};

export const loggi: CarrierAdapter = {
  name: 'Loggi',
  code: 'loggi',
  icon: 'package',
  color: 'bg-purple-600 text-white',
  detect: (c) => /^LGG\d+$/i.test(c.trim()),
  validate: (c) => /^LGG\d+$/i.test(c.trim()),
  async track(code): Promise<TrackResponse> {
    const token = import.meta.env.VITE_LOGGI_TOKEN;
    if (!token) throw new Error('Token Loggi não configurado (VITE_LOGGI_TOKEN)');
    const clean = code.trim();
    const res = await fetch(`https://api-sandbox.loggi.com/v1/packages/${encodeURIComponent(clean)}`, {
      headers: { Authorization: `ApiKey ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Loggi HTTP ${res.status}`);
    const data = await res.json();
    const raw = (data.events || data.tracking_events || []) as Array<Record<string, unknown>>;
    const events: TrackingEvent[] = raw.map((e) => ({
      timestamp: String(e.timestamp || e.datetime || new Date().toISOString()),
      status: STATUS_MAP[String(e.status || '').toLowerCase()] || 'pendente',
      location: (e.location || e.city) as string | undefined,
      description: String(e.description || e.status || ''),
      details: e as Record<string, unknown>,
    }));
    const last = events[events.length - 1];
    return {
      code: clean,
      carrier: 'loggi',
      status: last?.status || 'pendente',
      events,
      lastUpdate: last?.timestamp || new Date().toISOString(),
      raw: data,
    };
  },
};

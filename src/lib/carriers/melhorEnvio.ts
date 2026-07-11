import type { CarrierAdapter } from './index';
import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';

const STATUS_MAP: Record<string, TrackingStatus> = {
  entregue: 'entregue',
  em_transito: 'em_transito',
  despachado: 'despachado',
  coletado: 'despachado',
  pendente: 'pendente',
  erro: 'erro',
  devolvido: 'devolvido',
  delivered: 'entregue',
  in_transit: 'em_transito',
};

export const melhorEnvio: CarrierAdapter = {
  name: 'Melhor Envio',
  code: 'melhorenvio',
  icon: 'globe',
  color: 'bg-teal-600 text-white',
  detect: () => true,
  validate: () => true,
  async track(code): Promise<TrackResponse> {
    const token = import.meta.env.VITE_MELHOR_ENVIO_TOKEN;
    if (!token) throw new Error('Token Melhor Envio não configurado (VITE_MELHOR_ENVIO_TOKEN)');
    const clean = code.trim();
    const res = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/tracking', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Pente Fino ERP',
      },
      body: JSON.stringify({ codigo: clean }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `Melhor Envio HTTP ${res.status}`);
    }
    const data = await res.json();
    const raw = ((data as { eventos?: unknown[] }).eventos || []) as Array<Record<string, unknown>>;
    const events: TrackingEvent[] = raw.map((e) => ({
      timestamp: String(e.data_hora || e.timestamp || new Date().toISOString()),
      status: STATUS_MAP[String(e.status || '').toLowerCase()] || 'pendente',
      location: (e.local || e.cidade) as string | undefined,
      description: String(e.descricao || e.status || ''),
      details: e as Record<string, unknown>,
    }));
    const last = events[events.length - 1];
    return {
      code: clean,
      carrier: 'melhorenvio',
      status: last?.status || 'pendente',
      events,
      lastUpdate: last?.timestamp || new Date().toISOString(),
      raw: data,
    };
  },
};

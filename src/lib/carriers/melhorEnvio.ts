import type { CarrierAdapter } from './index';
import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';

const STATUS_MAP: Record<string, TrackingStatus> = {
  // Status oficiais do Melhor Envio
  delivered: 'entregue',
  posted: 'em_transito',
  released: 'despachado',
  pending: 'pendente',
  undelivered: 'erro',
  suspended: 'erro',
  canceled: 'devolvido',
  expired: 'devolvido',
  // Aliases PT
  entregue: 'entregue',
  em_transito: 'em_transito',
  despachado: 'despachado',
  coletado: 'despachado',
  pendente: 'pendente',
  erro: 'erro',
  devolvido: 'devolvido',
};

interface MelhorEnvioOrder {
  id?: string;
  status?: string;
  created_at?: string | null;
  paid_at?: string | null;
  generated_at?: string | null;
  posted_at?: string | null;
  delivered_at?: string | null;
  canceled_at?: string | null;
  expired_at?: string | null;
  suspended_at?: string | null;
  updated_at?: string | null;
  agency?: { city?: string | null } | null;
}

export const melhorEnvio: CarrierAdapter = {
  name: 'Melhor Envio',
  code: 'melhorenvio',
  icon: 'globe',
  color: 'bg-teal-600 text-white',
  detect: () => true, // fallback universal (gateway 15+ carriers)
  validate: () => true,
  async track(code): Promise<TrackResponse> {
    const token = import.meta.env.VITE_MELHOR_ENVIO_TOKEN;
    if (!token) throw new Error('Token Melhor Envio não configurado (VITE_MELHOR_ENVIO_TOKEN)');

    const clean = code.trim();
    const baseUrl = import.meta.env.PROD
      ? 'https://melhorenvio.com.br'
      : 'https://sandbox.melhorenvio.com.br';

    const res = await fetch(
      `${baseUrl}/api/v2/me/orders/search?q=${encodeURIComponent(clean)}`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Pente Fino ERP (adrielpompeo@gmail.com)',
        },
      },
    );

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '30';
      throw new Error(`Muitas requisições. Tente novamente em ${retryAfter}s.`);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { message?: string }).message || `Melhor Envio HTTP ${res.status}`,
      );
    }

    const payload = await res.json();
    const orders: MelhorEnvioOrder[] = Array.isArray(payload)
      ? payload
      : (payload?.data ?? []);

    if (!orders.length) {
      throw new Error('Nenhuma etiqueta encontrada com este código');
    }

    const order = orders[0];
    const events: TrackingEvent[] = [];

    const addEvent = (
      timestamp: string | null | undefined,
      statusKey: string,
      description: string,
      location?: string,
    ) => {
      if (!timestamp) return;
      events.push({
        timestamp,
        status: STATUS_MAP[statusKey] || 'pendente',
        location,
        description,
        details: { originalStatus: statusKey },
      });
    };

    addEvent(order.created_at, 'pending', 'Etiqueta criada');
    addEvent(order.paid_at, 'pending', 'Pagamento confirmado');
    addEvent(order.generated_at, 'released', 'Etiqueta gerada/liberada');
    addEvent(order.posted_at, 'posted', 'Objeto postado/coletado', order.agency?.city || undefined);
    addEvent(order.delivered_at, 'delivered', 'Entregue ao destinatário');
    addEvent(order.canceled_at, 'canceled', 'Etiqueta cancelada');
    addEvent(order.expired_at, 'expired', 'Etiqueta expirada');
    addEvent(order.suspended_at, 'suspended', 'Entrega suspensa');

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const currentStatus = STATUS_MAP[String(order.status || '').toLowerCase()] || 'pendente';
    const lastEvent = events[events.length - 1];

    return {
      code: clean,
      carrier: 'melhorenvio',
      status: currentStatus,
      events,
      lastUpdate:
        lastEvent?.timestamp ||
        order.updated_at ||
        order.created_at ||
        new Date().toISOString(),
      raw: order,
    };
  },
};

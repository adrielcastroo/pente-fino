import type { CarrierAdapter } from './index';
import type { TrackResponse, TrackingEvent, TrackingStatus } from '@/types/tracking';

const STATUS_MAP: Record<string, TrackingStatus> = {
  delivered: 'entregue',
  posted: 'em_transito',
  released: 'despachado',
  pending: 'pendente',
  undelivered: 'erro',
  suspended: 'erro',
  canceled: 'devolvido',
  expired: 'devolvido',
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

interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Cache runtime dos tokens (para persistir entre chamadas na mesma sessão)
let runtimeAccessToken: string | null = null;
let runtimeRefreshToken: string | null = null;

function getSandbox(): boolean {
  const v = import.meta.env.VITE_MELHOR_ENVIO_SANDBOX;
  if (v === undefined || v === null || v === '') return import.meta.env.DEV;
  return String(v).toLowerCase() === 'true';
}

function getBaseUrl(): string {
  return getSandbox()
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';
}

async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<TokenRefreshResponse> {
  const res = await fetch(`${getBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Pente Fino ERP (adrielpompeo@gmail.com)',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Token refresh failed: HTTP ${res.status} ${text}`);
  }
  return (await res.json()) as TokenRefreshResponse;
}

export const melhorEnvio: CarrierAdapter = {
  name: 'Melhor Envio',
  code: 'melhorenvio',
  icon: 'globe',
  color: 'bg-teal-600 text-white',
  detect: () => true,
  validate: () => true,
  async track(code): Promise<TrackResponse> {
    let token =
      runtimeAccessToken ||
      (import.meta.env.VITE_MELHOR_ENVIO_TOKEN as string | undefined);
    if (!token) {
      throw new Error(
        'Token Melhor Envio não configurado (VITE_MELHOR_ENVIO_TOKEN)',
      );
    }

    const clientId = import.meta.env.VITE_MELHOR_ENVIO_CLIENT_ID as
      | string
      | undefined;
    const clientSecret = import.meta.env.VITE_MELHOR_ENVIO_CLIENT_SECRET as
      | string
      | undefined;
    const envRefreshToken = import.meta.env.VITE_MELHOR_ENVIO_REFRESH_TOKEN as
      | string
      | undefined;
    const refreshToken = runtimeRefreshToken || envRefreshToken;

    const clean = code.trim();
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/v2/me/orders/search?q=${encodeURIComponent(clean)}`;

    const doFetch = (bearer: string) =>
      fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
          'User-Agent': 'Pente Fino ERP (adrielpompeo@gmail.com)',
        },
      });

    let res = await doFetch(token);

    // Token expirado — tentar refresh automático
    if (res.status === 401 && clientId && clientSecret && refreshToken) {
      try {
        const refreshed = await refreshAccessToken(
          clientId,
          clientSecret,
          refreshToken,
        );
        runtimeAccessToken = refreshed.access_token;
        runtimeRefreshToken = refreshed.refresh_token;
        token = refreshed.access_token;
        res = await doFetch(token);
      } catch (e) {
        throw new Error(
          `Token Melhor Envio expirado e falha na renovação: ${(e as Error).message}`,
        );
      }
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '30';
      throw new Error(`Muitas requisições. Tente novamente em ${retryAfter}s.`);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { message?: string }).message ||
          `Melhor Envio HTTP ${res.status}`,
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
    addEvent(
      order.posted_at,
      'posted',
      'Objeto postado/coletado',
      order.agency?.city || undefined,
    );
    addEvent(order.delivered_at, 'delivered', 'Entregue ao destinatário');
    addEvent(order.canceled_at, 'canceled', 'Etiqueta cancelada');
    addEvent(order.expired_at, 'expired', 'Etiqueta expirada');
    addEvent(order.suspended_at, 'suspended', 'Entrega suspensa');

    events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const currentStatus =
      STATUS_MAP[String(order.status || '').toLowerCase()] || 'pendente';
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

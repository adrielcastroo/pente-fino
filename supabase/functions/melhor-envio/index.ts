// Edge Function: melhor-envio
// Proxy seguro para a API do Melhor Envio. Gerencia OAuth (refresh automático) e rastreio.
// Actions:
//   - authorize_url : retorna URL de autorização OAuth (client)
//   - callback      : troca `code` por access_token + refresh_token e persiste
//   - track         : consulta orders/search para um código de rastreio
//   - status        : indica se há credenciais configuradas

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CLIENT_ID = Deno.env.get('MELHOR_ENVIO_CLIENT_ID')!;
const CLIENT_SECRET = Deno.env.get('MELHOR_ENVIO_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ENV = (Deno.env.get('MELHOR_ENVIO_ENV') || 'production').toLowerCase();
const BASE_URL =
  ENV === 'sandbox' ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';

const UA = 'Pente Fino ERP (adrielpompeo@gmail.com)';

const STATUS_MAP: Record<string, string> = {
  delivered: 'entregue',
  posted: 'em_transito',
  released: 'despachado',
  pending: 'pendente',
  undelivered: 'erro',
  suspended: 'erro',
  canceled: 'devolvido',
  expired: 'devolvido',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadCreds() {
  const { data, error } = await admin()
    .from('melhor_envio_credentials')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(`load creds: ${error.message}`);
  return data as {
    access_token: string | null;
    refresh_token: string | null;
    expires_at: string | null;
  } | null;
}

async function saveCreds(access: string, refresh: string, expiresInSec: number) {
  const expires_at = new Date(Date.now() + (expiresInSec - 60) * 1000).toISOString();
  const { error } = await admin()
    .from('melhor_envio_credentials')
    .upsert({
      id: 1,
      access_token: access,
      refresh_token: refresh,
      expires_at,
      environment: ENV,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(`save creds: ${error.message}`);
}

async function refreshTokens(refreshToken: string) {
  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`refresh failed: HTTP ${res.status} ${JSON.stringify(body)}`);
  await saveCreds(body.access_token, body.refresh_token, body.expires_in);
  return body.access_token as string;
}

async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`exchange failed: HTTP ${res.status} ${JSON.stringify(body)}`);
  await saveCreds(body.access_token, body.refresh_token, body.expires_in);
  return true;
}

async function getValidAccessToken(): Promise<string> {
  const creds = await loadCreds();
  if (!creds?.refresh_token) {
    throw new Error(
      'Melhor Envio não conectado. Autorize o app primeiro (action=authorize_url).',
    );
  }
  const expired =
    !creds.access_token ||
    !creds.expires_at ||
    new Date(creds.expires_at).getTime() < Date.now();
  if (!expired) return creds.access_token!;
  return await refreshTokens(creds.refresh_token);
}

async function trackCode(code: string) {
  let token = await getValidAccessToken();
  const url = `${BASE_URL}/api/v2/me/orders/search?q=${encodeURIComponent(code.trim())}`;

  const doFetch = (bearer: string) =>
    fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${bearer}`,
        'User-Agent': UA,
      },
    });

  let res = await doFetch(token);
  if (res.status === 401) {
    const creds = await loadCreds();
    if (creds?.refresh_token) {
      token = await refreshTokens(creds.refresh_token);
      res = await doFetch(token);
    }
  }
  if (res.status === 429) {
    const retry = res.headers.get('Retry-After') || '30';
    throw new Error(`Rate limit. Retry-After: ${retry}s`);
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (payload as { message?: string }).message || `Melhor Envio HTTP ${res.status}`,
    );
  }
  const orders = Array.isArray(payload) ? payload : (payload?.data ?? []);
  if (!orders.length) throw new Error('Nenhuma etiqueta encontrada com este código');

  const order = orders[0];
  const events: Array<{
    timestamp: string;
    status: string;
    location?: string;
    description: string;
    details?: Record<string, unknown>;
  }> = [];

  const add = (ts: string | null | undefined, key: string, desc: string, loc?: string) => {
    if (!ts) return;
    events.push({
      timestamp: ts,
      status: STATUS_MAP[key] || 'pendente',
      location: loc,
      description: desc,
      details: { originalStatus: key },
    });
  };
  add(order.created_at, 'pending', 'Etiqueta criada');
  add(order.paid_at, 'pending', 'Pagamento confirmado');
  add(order.generated_at, 'released', 'Etiqueta gerada/liberada');
  add(order.posted_at, 'posted', 'Objeto postado/coletado', order.agency?.city || undefined);
  add(order.delivered_at, 'delivered', 'Entregue ao destinatário');
  add(order.canceled_at, 'canceled', 'Etiqueta cancelada');
  add(order.expired_at, 'expired', 'Etiqueta expirada');
  add(order.suspended_at, 'suspended', 'Entrega suspensa');
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const currentStatus = STATUS_MAP[String(order.status || '').toLowerCase()] || 'pendente';
  const last = events[events.length - 1];

  return {
    code: code.trim(),
    carrier: 'melhorenvio',
    status: currentStatus,
    events,
    lastUpdate: last?.timestamp || order.updated_at || order.created_at || new Date().toISOString(),
    raw: order,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return json({ error: 'MELHOR_ENVIO_CLIENT_ID/SECRET não configurados' }, 500);
    }
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    if (action === 'status') {
      const creds = await loadCreds();
      return json({
        connected: !!creds?.refresh_token,
        environment: ENV,
        expiresAt: creds?.expires_at || null,
      });
    }

    if (action === 'authorize_url') {
      const redirectUri = String(body.redirect_uri || '');
      if (!redirectUri) return json({ error: 'redirect_uri obrigatório' }, 400);
      const scope = [
        'cart-read',
        'orders-read',
        'shipping-calculate',
        'shipping-tracking',
      ].join(' ');
      const url =
        `${BASE_URL}/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code&scope=${encodeURIComponent(scope)}`;
      return json({ url });
    }

    if (action === 'callback') {
      const code = String(body.code || '');
      const redirectUri = String(body.redirect_uri || '');
      if (!code || !redirectUri) return json({ error: 'code + redirect_uri obrigatórios' }, 400);
      await exchangeCode(code, redirectUri);
      return json({ ok: true });
    }

    if (action === 'track') {
      const code = String(body.code || '').trim();
      if (!code) return json({ error: 'code obrigatório' }, 400);
      const result = await trackCode(code);
      return json(result);
    }

    return json({ error: `action inválido: ${action}` }, 400);
  } catch (e) {
    const msg = (e as Error).message || 'erro';
    return json({ error: msg }, 500);
  }
});

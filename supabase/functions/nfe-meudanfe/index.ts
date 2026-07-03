// Fallback público por chave: consulta Meu Danfe para obter dados básicos da NF-e
// quando o XML não está disponível. Requer MEUDANFE_API_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body { chave?: string; persist?: boolean }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('MEUDANFE_API_KEY');
    const { chave, persist } = (await req.json().catch(() => ({}))) as Body;
    const clean = (chave ?? '').replace(/\D/g, '');
    if (clean.length !== 44) {
      return new Response(JSON.stringify({ error: 'Chave inválida (44 dígitos).' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        needs_secret: true,
        message: 'Configure MEUDANFE_API_KEY para consultar por chave.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const res = await fetch(`https://ws.meudanfe.com/api/v1/get/nfe/xml/${clean}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    const text = await res.text();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Meu Danfe ${res.status}`, detail: text.slice(0, 400) }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let payload: any;
    try { payload = JSON.parse(text); } catch { payload = { xml: text }; }
    const xml: string | undefined = payload?.xml ?? payload?.data?.xml ?? (typeof payload === 'string' ? payload : undefined);

    if (persist && xml) {
      const auth = req.headers.get('Authorization') ?? '';
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      let userId: string | null = null;
      if (auth.startsWith('Bearer ')) {
        const { data } = await admin.auth.getClaims(auth.replace('Bearer ', ''));
        userId = data?.claims?.sub ?? null;
      }
      const path = `${clean}/nfe.xml`;
      await admin.storage.from('nfe-arquivos').upload(path, new Blob([xml], { type: 'application/xml' }), { upsert: true });
      await admin.from('nfe_entrada').upsert({
        chave_acesso: clean,
        xml_path: path,
        origem: 'meudanfe',
        created_by: userId,
      }, { onConflict: 'chave_acesso' });
    }

    return new Response(JSON.stringify({ ok: true, chave: clean, xml, raw: payload }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Consulta situação de NF-e no SEFAZ.
// Sem certificado A1 configurado, retorna orientação — mantém contrato para futura integração.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Body {
  chave: string;
  nfeId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: uErr } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (uErr || !userData?.claims) return json({ error: 'Unauthorized' }, 401);

    const body = (await req.json()) as Body;
    const chave = (body.chave ?? '').replace(/\D/g, '');
    if (chave.length !== 44) return json({ error: 'Chave inválida (esperado 44 dígitos).' }, 400);

    const cert = Deno.env.get('SEFAZ_A1_CERT_BASE64');
    if (!cert) {
      return json({
        ok: false,
        needs_cert: true,
        message:
          'Consulta SEFAZ requer certificado A1. Configure o secret SEFAZ_A1_CERT_BASE64 (PFX em base64) e SEFAZ_A1_PASSWORD para habilitar. Enquanto isso, registre protocolo/situação manualmente.',
      });
    }

    // Placeholder para futura integração real via NfeConsultaProtocolo4 (mTLS com A1).
    return json({ ok: false, message: 'Integração SEFAZ ainda não implementada.' }, 501);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro interno' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

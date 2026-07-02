// Distribuição DFe + Manifestação Destinatário (SEFAZ)
// Sem certificado A1 configurado, retorna orientação — contrato pronto para integração real.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action = 'consultar-dfe' | 'manifestar';

interface Body {
  action: Action;
  ultNSU?: string;
  nfeEntradaId?: string;
  tipoEvento?: 'ciencia' | 'confirmada' | 'desconhecida' | 'nao_realizada';
  justificativa?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: cErr } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (cErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401);

    const body = (await req.json()) as Body;
    const cert = Deno.env.get('SEFAZ_A1_CERT_BASE64');
    const cnpj = Deno.env.get('SEFAZ_CNPJ');

    if (!cert || !cnpj) {
      return json({
        ok: false,
        needs_cert: true,
        message:
          'Distribuição DFe requer certificado A1 e CNPJ do destinatário. Configure SEFAZ_A1_CERT_BASE64, SEFAZ_A1_PASSWORD e SEFAZ_CNPJ. Enquanto isso, cadastre manualmente as notas recebidas.',
      });
    }

    // Placeholder para integração real (NfeDistribuicaoDFe + EventoManifestacaoDestinatario)
    return json({ ok: false, action: body.action, message: 'Integração SEFAZ ainda não implementada.' }, 501);
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

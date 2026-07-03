// Consulta situação de NF-e no SEFAZ com cache + auditoria.
// Requer certificado A1 (SEFAZ_A1_CERT_BASE64 + SEFAZ_A1_PASSWORD) para consulta real.
// Sem certificado, retorna needs_cert=true — cliente segue no fluxo manual.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Body {
  chave?: string;
  nfeId?: string;
  cnpj?: string;
  tipo?: 'emitido' | 'recebido' | 'chave';
}

const CACHE_TTL_MIN = 30;

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
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: uErr } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    );
    if (uErr || !userData?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.claims.sub as string;
    const userEmail = (userData.claims.email as string | undefined) ?? null;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = (await req.json()) as Body;
    const tipo = body.tipo ?? (body.chave ? 'chave' : null);

    // Consulta por chave (compat com NFeSefazDialog)
    if (tipo === 'chave') {
      const chave = (body.chave ?? '').replace(/\D/g, '');
      if (chave.length !== 44) return json({ error: 'Chave inválida (esperado 44 dígitos).' }, 400);
      const cert = Deno.env.get('SEFAZ_A1_CERT_BASE64');
      await logConsulta(admin, {
        user_id: userId, user_email: userEmail, cnpj: '', tipo: 'chave',
        chave_acesso: chave, status: cert ? 'consultado' : 'sem_cert',
        motivo: cert ? null : 'Certificado A1 não configurado',
        cache_hit: false, detalhes: { nfeId: body.nfeId ?? null },
      });
      if (!cert) {
        return json({
          ok: false, needs_cert: true,
          message: 'Consulta SEFAZ requer certificado A1. Configure os secrets SEFAZ_A1_CERT_BASE64 e SEFAZ_A1_PASSWORD.',
        });
      }
      return json({ ok: false, message: 'Integração SEFAZ (por chave) ainda não implementada.' }, 501);
    }

    // Consulta por CNPJ + tipo (emitido/recebido)
    if (tipo !== 'emitido' && tipo !== 'recebido') {
      return json({ error: "Parâmetro 'tipo' deve ser 'emitido', 'recebido' ou 'chave'." }, 400);
    }
    const cnpj = (body.cnpj ?? '').replace(/\D/g, '');
    if (cnpj.length !== 14) return json({ error: 'CNPJ inválido (esperado 14 dígitos).' }, 400);

    const cacheKey = `${cnpj}:${tipo}`;

    // Verifica cache
    const { data: cached } = await admin
      .from('nfe_cache')
      .select('payload, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      await logConsulta(admin, {
        user_id: userId, user_email: userEmail, cnpj, tipo,
        status: 'cache', motivo: null, cache_hit: true, detalhes: null,
      });
      return json({ ok: true, cache_hit: true, ...(cached.payload as object) });
    }

    const cert = Deno.env.get('SEFAZ_A1_CERT_BASE64');
    if (!cert) {
      await logConsulta(admin, {
        user_id: userId, user_email: userEmail, cnpj, tipo,
        status: 'sem_cert', motivo: 'Certificado A1 não configurado',
        cache_hit: false, detalhes: null,
      });
      return json({
        ok: false, needs_cert: true,
        message: 'Configure os secrets SEFAZ_A1_CERT_BASE64 e SEFAZ_A1_PASSWORD para habilitar a consulta real na SEFAZ.',
      });
    }

    // Placeholder — assinatura XML A1 + SOAP a implementar (NFeDistribuicaoDFe).
    await logConsulta(admin, {
      user_id: userId, user_email: userEmail, cnpj, tipo,
      status: 'nao_implementado', motivo: 'Integração SEFAZ pendente',
      cache_hit: false, detalhes: null,
    });
    return json({ ok: false, message: 'Integração SEFAZ (assinatura XML A1) ainda não implementada.' }, 501);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro interno' }, 500);
  }
});

async function logConsulta(admin: ReturnType<typeof createClient>, row: {
  user_id: string; user_email: string | null; cnpj: string; tipo: string;
  chave_acesso?: string | null; status: string; motivo: string | null;
  cache_hit: boolean; detalhes: Record<string, unknown> | null;
}) {
  try { await admin.from('nfe_consulta_log').insert(row); } catch { /* noop */ }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

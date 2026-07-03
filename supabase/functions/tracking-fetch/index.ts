// Rastreio logístico via SSW (público). Recebe { nfeEntradaId } ou { chave }
// e persiste eventos em nfe_entrada_tracking_eventos + atualiza tracking_status.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type TrackingStatus =
  | 'POSTADO' | 'EM_TRANSITO' | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE' | 'TENTATIVA_FALHA' | 'EXCECAO' | 'DESCONHECIDO';

interface SswEvento {
  data?: string;      // "dd/mm/yyyy hh:mm"
  ocorrencia?: string;
  descricao?: string;
  cidade?: string;
  filial?: string;
  dominio?: string;
}

function normalizeStatus(ocorrencia: string, descricao: string): TrackingStatus {
  const s = `${ocorrencia} ${descricao}`.toLowerCase();
  if (/entregue|entrega efetuada|finalizad/i.test(s)) return 'ENTREGUE';
  if (/saiu para entrega|em rota|em entrega/i.test(s)) return 'SAIU_PARA_ENTREGA';
  if (/tentativa|recusad|ausente|reentrega/i.test(s)) return 'TENTATIVA_FALHA';
  if (/avaria|extraviad|sinistr|devolv|excec/i.test(s)) return 'EXCECAO';
  if (/coletad|postad|emitid|expedid/i.test(s)) return 'POSTADO';
  if (/transit|transferên|em .* filial|manifest/i.test(s)) return 'EM_TRANSITO';
  return 'DESCONHECIDO';
}

function parseSswDate(d?: string): string {
  if (!d) return new Date().toISOString();
  // "dd/mm/yyyy hh:mm" ou ISO
  const iso = /^\d{4}-\d{2}-\d{2}/.test(d);
  if (iso) return new Date(d).toISOString();
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T]?(\d{2})?:?(\d{2})?/);
  if (!m) return new Date().toISOString();
  const [, dd, mm, yyyy, hh = '00', mi = '00'] = m;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00-03:00`).toISOString();
}

async function fetchSSW(chave: string): Promise<{ eventos: SswEvento[]; raw: unknown }> {
  const res = await fetch('https://ssw.inf.br/api/trackingdanfe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ chave_nfe: chave }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message ?? `SSW erro ${res.status}`);
  }
  // SSW normalmente devolve { success: true, documento: { tracking: [...] } }
  const list: SswEvento[] =
    data?.documento?.tracking ??
    data?.tracking ??
    data?.eventos ?? [];
  return { eventos: Array.isArray(list) ? list : [], raw: data };
}

async function fetchSeuRastreio(chave: string): Promise<{ eventos: SswEvento[]; raw: unknown } | null> {
  const token = Deno.env.get('SEURASTREIO_TOKEN');
  if (!token) return null;
  const res = await fetch(`https://api.seurastreio.com.br/v1/rastreios/${chave}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const list = data?.eventos ?? data?.tracking ?? [];
  const eventos: SswEvento[] = (Array.isArray(list) ? list : []).map((e: any) => ({
    data: e.data ?? e.dataHora ?? e.data_hora,
    ocorrencia: e.status ?? e.ocorrencia,
    descricao: e.descricao ?? e.mensagem,
    cidade: e.cidade ?? e.local,
    filial: e.uf ?? '',
  }));
  return { eventos, raw: data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Auth (opcional em cron; se veio JWT, valida)
    if (authHeader.startsWith('Bearer ') && !authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '__x')) {
      const { data, error } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
      if (error || !data?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { nfeEntradaId, chave: chaveInput, all } = body as {
      nfeEntradaId?: string; chave?: string; all?: boolean;
    };

    // Modo "atualizar todas" (para cron): pega até 50 notas não-entregues
    let targets: Array<{ id: string; chave_acesso: string }> = [];
    if (all) {
      const { data, error } = await supabase
        .from('nfe_entrada')
        .select('id, chave_acesso')
        .neq('tracking_status', 'ENTREGUE')
        .order('tracking_last_sync_at', { ascending: true, nullsFirst: true })
        .limit(50);
      if (error) throw error;
      targets = data ?? [];
    } else if (nfeEntradaId) {
      const { data, error } = await supabase
        .from('nfe_entrada')
        .select('id, chave_acesso')
        .eq('id', nfeEntradaId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('NF-e não encontrada');
      targets = [data];
    } else if (chaveInput) {
      const clean = chaveInput.replace(/\D/g, '');
      if (clean.length !== 44) throw new Error('Chave deve ter 44 dígitos');
      const { data } = await supabase
        .from('nfe_entrada').select('id, chave_acesso').eq('chave_acesso', clean).maybeSingle();
      if (!data) throw new Error('NF-e ainda não registrada');
      targets = [data];
    } else {
      throw new Error('Informe nfeEntradaId, chave ou all=true');
    }

    const results: Array<{ id: string; status: TrackingStatus; eventos: number; error?: string }> = [];

    for (const t of targets) {
      try {
        let provider: 'ssw' | 'seurastreio' = 'ssw';
        let { eventos } = await fetchSSW(t.chave_acesso).catch(() => ({ eventos: [] as SswEvento[] }));
        if (eventos.length === 0) {
          const fb = await fetchSeuRastreio(t.chave_acesso);
          if (fb && fb.eventos.length > 0) { eventos = fb.eventos; provider = 'seurastreio'; }
        }
        let latestStatus: TrackingStatus = 'DESCONHECIDO';
        let latestAt = new Date(0);

        for (const ev of eventos) {
          const dataIso = parseSswDate(ev.data);
          const status = normalizeStatus(ev.ocorrencia ?? '', ev.descricao ?? '');
          const dt = new Date(dataIso);
          if (dt > latestAt) { latestAt = dt; latestStatus = status; }

          await supabase.from('nfe_entrada_tracking_eventos').upsert({
            nfe_entrada_id: t.id,
            data_evento: dataIso,
            status,
            local: [ev.cidade, ev.filial].filter(Boolean).join(' - ') || null,
            descricao: [ev.ocorrencia, ev.descricao].filter(Boolean).join(' — ') || null,
            fonte: provider,
            raw: ev as any,
          }, { onConflict: 'nfe_entrada_id,data_evento,status,descricao', ignoreDuplicates: true });
        }


        await supabase.from('nfe_entrada').update({
          tracking_status: latestStatus,
          tracking_provider: provider,
          tracking_last_sync_at: new Date().toISOString(),
        }).eq('id', t.id);

        results.push({ id: t.id, status: latestStatus, eventos: eventos.length });
      } catch (e) {
        // marca sync mesmo em erro para não repetir imediatamente
        await supabase.from('nfe_entrada').update({
          tracking_last_sync_at: new Date().toISOString(),
        }).eq('id', t.id);
        results.push({ id: t.id, status: 'DESCONHECIDO', eventos: 0, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

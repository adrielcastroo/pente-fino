// Recebe XMLs de NF-e do Google Apps Script (e-mail) e importa em nfe_importadas.
// Auth via header `X-Import-Token` (segredo NFE_IMPORT_TOKEN). verify_jwt = false.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Payload {
  xml?: string;
  xmls?: string[];
  filename?: string;
  source?: string; // ex: "gmail:label/NFe"
}

const text = (xml: string, tag: string): string => {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : '';
};
const num = (xml: string, tag: string): number => {
  const v = parseFloat(text(xml, tag));
  return Number.isFinite(v) ? v : 0;
};

function parseNFe(xml: string) {
  const idMatch = xml.match(/<infNFe[^>]*\bId="NFe([^"]+)"/);
  const chave = idMatch?.[1] ?? '';
  if (!chave || chave.length < 40) throw new Error('Chave de acesso inválida');

  const ide = xml.match(/<ide>[\s\S]*?<\/ide>/)?.[0] ?? '';
  const emit = xml.match(/<emit>[\s\S]*?<\/emit>/)?.[0] ?? '';
  const dest = xml.match(/<dest>[\s\S]*?<\/dest>/)?.[0] ?? '';
  const tot = xml.match(/<ICMSTot>[\s\S]*?<\/ICMSTot>/)?.[0] ?? '';
  const transp = xml.match(/<transp>[\s\S]*?<\/transp>/)?.[0] ?? '';
  const vol = xml.match(/<vol>[\s\S]*?<\/vol>/)?.[0] ?? '';
  const transporta = transp.match(/<transporta>[\s\S]*?<\/transporta>/)?.[0] ?? '';

  const itens = Array.from(xml.matchAll(/<det\b[\s\S]*?<\/det>/g)).map((m) => {
    const prod = m[0].match(/<prod>[\s\S]*?<\/prod>/)?.[0] ?? '';
    return {
      codigo: text(prod, 'cProd'),
      descricao: text(prod, 'xProd'),
      quantidade: num(prod, 'qCom'),
      unidade: text(prod, 'uCom'),
      valorUnitario: num(prod, 'vUnCom'),
      valorTotal: num(prod, 'vProd'),
      ncm: text(prod, 'NCM'),
    };
  });

  return {
    chaveAcesso: chave,
    numero: text(ide, 'nNF'),
    serie: text(ide, 'serie'),
    dataEmissao: text(ide, 'dhEmi') || text(ide, 'dEmi'),
    cnpjEmitente: text(emit, 'CNPJ'),
    nomeEmitente: text(emit, 'xNome'),
    cnpjDestinatario: text(dest, 'CNPJ') || text(dest, 'CPF'),
    nomeDestinatario: text(dest, 'xNome'),
    valorTotal: num(tot, 'vNF'),
    valorProdutos: num(tot, 'vProd'),
    valorFrete: num(tot, 'vFrete'),
    transportadora: text(transporta, 'xNome'),
    volumes: num(vol, 'qVol'),
    pesoLiquido: num(vol, 'pesoL'),
    pesoBruto: num(vol, 'pesoB'),
    itens,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const expected = Deno.env.get('NFE_IMPORT_TOKEN');
    const provided = req.headers.get('x-import-token') ?? new URL(req.url).searchParams.get('token');
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Payload;
    const xmls = body.xmls ?? (body.xml ? [body.xml] : []);
    if (xmls.length === 0) {
      return new Response(JSON.stringify({ error: 'no xml provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: Array<{ numero: string; status: 'imported' | 'duplicate' | 'error'; message?: string }> = [];

    for (const xml of xmls) {
      try {
        const nfe = parseNFe(xml);
        const { data: existing } = await supabase
          .from('nfe_importadas')
          .select('id')
          .eq('chave_acesso', nfe.chaveAcesso)
          .maybeSingle();
        if (existing) {
          results.push({ numero: nfe.numero, status: 'duplicate' });
          continue;
        }
        const { error } = await supabase.from('nfe_importadas').insert({
          numero: nfe.numero,
          serie: nfe.serie || null,
          chave_acesso: nfe.chaveAcesso,
          data_emissao: nfe.dataEmissao || null,
          cnpj_emitente: nfe.cnpjEmitente || null,
          nome_emitente: nfe.nomeEmitente || null,
          cnpj_destinatario: nfe.cnpjDestinatario || null,
          nome_destinatario: nfe.nomeDestinatario || null,
          valor_total: nfe.valorTotal,
          valor_produtos: nfe.valorProdutos,
          valor_frete: nfe.valorFrete,
          transportadora: nfe.transportadora || null,
          volumes: nfe.volumes || null,
          peso_liquido: nfe.pesoLiquido || null,
          peso_bruto: nfe.pesoBruto || null,
          itens: nfe.itens,
          xml_raw: xml,
          imported_by: null,
        });
        if (error) throw error;
        results.push({ numero: nfe.numero, status: 'imported' });
      } catch (e) {
        results.push({ numero: '?', status: 'error', message: (e as Error).message });
      }
    }

    const summary = {
      total: results.length,
      imported: results.filter((r) => r.status === 'imported').length,
      duplicates: results.filter((r) => r.status === 'duplicate').length,
      errors: results.filter((r) => r.status === 'error').length,
      source: body.source ?? 'unknown',
      results,
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

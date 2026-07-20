// AI Agent — assistente do Pente Fino com acesso a consultas e ações do app.
import { convertToModelMessages, streamText, type ModelMessage, type UIMessage } from "npm:ai";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function fmtBR(n: number | null | undefined) {
  if (n === null || n === undefined) return "-";
  if (Number(n) === 1) return "1";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));
}

function errorPayload(err: unknown) {
  if (err instanceof Error) return { error: err.message, stack: err.stack };
  return { error: typeof err === "string" ? err : JSON.stringify(err) };
}

function latestUserText(messages: ModelMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const content = last?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (part?.type === "text" && typeof part.text === "string" ? part.text : ""))
      .join(" ")
      .trim();
  }
  return "";
}

function textTokens(text: string) {
  const stop = new Set([
    "qual",
    "quais",
    "quanto",
    "quantos",
    "temos",
    "mais",
    "menos",
    "estoque",
    "item",
    "itens",
    "tecido",
    "tecidos",
    "produto",
    "produtos",
    "cor",
    "cores",
    "codigo",
    "código",
    "para",
    "com",
    "dos",
    "das",
    "que",
    "uma",
    "por",
    "em",
    "no",
    "na",
    "de",
    "do",
    "da",
    "o",
    "a",
    "e",
  ]);
  return Array.from(
    new Set(
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .match(/[a-z0-9]+/g)
        ?.filter((token) => token.length >= 2 && !stop.has(token)) ?? [],
    ),
  ).slice(0, 6);
}

function sanitizePostgrestValue(value: string) {
  return value.replace(/[(),.]/g, " ").trim();
}

async function buildAgentContext(admin: ReturnType<typeof createClient>, text: string) {
  const tokens = textTokens(text);
  const wantsTransfers = /transfer|rascunho|efetiva/i.test(text);
  const wantsMoves = /entrada|sa[ií]da|movimenta|kardex/i.test(text);
  const context: Record<string, unknown> = {
    consulta: text,
    tokens_usados: tokens,
  };

  try {
    let itens: any[] = [];
    if (tokens.length > 0) {
      const itemFilters = tokens.flatMap((token) => {
        const safe = sanitizePostgrestValue(token);
        if (!safe) return [];
        return [
          `descricao.ilike.%${safe}%`,
          `codigo_interno.ilike.%${safe}%`,
          `codigo_fornecedor.ilike.%${safe}%`,
        ];
      });
      if (itemFilters.length > 0) {
        const { data, error } = await admin
          .from("itens_cadastro")
          .select("codigo_interno,descricao,unidade,codigo_fornecedor,pacote_fornecedor,pacote_estocagem")
          .or(itemFilters.join(","))
          .limit(80);
        if (error) context.itens_erro = error.message;
        else itens = data ?? [];
      }
    }

    const codigos = Array.from(
      new Set(
        itens
          .map((item) => String(item.codigo_interno ?? item.codigo_fornecedor ?? "").trim())
          .filter(Boolean),
      ),
    ).slice(0, 80);

    let posicoes: any[] = [];
    if (codigos.length > 0) {
      const [byAuge, byItem] = await Promise.all([
        admin
          .from("estoque_posicoes")
          .select("item,auge_cd_item,lote,lote_sistema,endereco,deposito_atual,status,m_linear_atual,m_linear,m2_atual,m2")
          .in("auge_cd_item", codigos)
          .limit(500),
        admin
          .from("estoque_posicoes")
          .select("item,auge_cd_item,lote,lote_sistema,endereco,deposito_atual,status,m_linear_atual,m_linear,m2_atual,m2")
          .in("item", codigos)
          .limit(500),
      ]);
      if (byAuge.error) context.estoque_erro = byAuge.error.message;
      if (byItem.error) context.estoque_item_erro = byItem.error.message;
      posicoes = [...(byAuge.data ?? []), ...(byItem.data ?? [])];
    }

    const byCodigo = new Map<string, any>();
    for (const item of itens) {
      const codigo = String(item.codigo_interno ?? item.codigo_fornecedor ?? "-");
      byCodigo.set(codigo, {
        codigo,
        descricao: item.descricao ?? "-",
        unidade: item.unidade ?? "-",
        saldo_estimado: 0,
        lotes: 0,
        enderecos: new Set<string>(),
      });
    }
    for (const pos of posicoes) {
      const codigo = String(pos.auge_cd_item ?? pos.item ?? "-");
      const row = byCodigo.get(codigo) ?? {
        codigo,
        descricao: itens.find((item) => item.codigo_interno === codigo || item.codigo_fornecedor === codigo)?.descricao ?? "-",
        unidade: "-",
        saldo_estimado: 0,
        lotes: 0,
        enderecos: new Set<string>(),
      };
      row.saldo_estimado += Number(pos.m_linear_atual ?? pos.m_linear ?? pos.m2_atual ?? pos.m2 ?? 0);
      row.lotes += 1;
      if (pos.endereco) row.enderecos.add(String(pos.endereco));
      byCodigo.set(codigo, row);
    }

    context.itens_encontrados = Array.from(byCodigo.values())
      .map((row) => ({
        ...row,
        saldo_estimado: fmtBR(row.saldo_estimado),
        enderecos: Array.from(row.enderecos).slice(0, 8),
      }))
      .sort((a, b) => Number.parseFloat(String(b.saldo_estimado).replace(/\./g, "").replace(",", ".")) - Number.parseFloat(String(a.saldo_estimado).replace(/\./g, "").replace(",", ".")))
      .slice(0, 20);
    context.posicoes_amostra = posicoes.slice(0, 25);

    if (wantsTransfers) {
      const { data, error } = await admin
        .from("auge_transferencias")
        .select("documento,nr_efetivacao,data_movimento,codigo_produto,descricao_produto,quantidade,deposito_origem,deposito_destino,observacao,usuario_criacao,usuario_efetivacao,ds_efetivacao")
        .order("data_movimento", { ascending: false, nullsFirst: false })
        .limit(15);
      context.transferencias_recentes = error ? { erro: error.message } : data ?? [];
    }

    if (wantsMoves) {
      const { data, error } = await admin
        .from("auge_movimentacoes")
        .select("data_movimento,tipo,codigo_produto,quantidade,deposito,documento,observacao,situacao,ds_situacao")
        .order("data_movimento", { ascending: false, nullsFirst: false })
        .limit(20);
      context.movimentacoes_recentes = error ? { erro: error.message } : data ?? [];
    }
  } catch (err) {
    context.contexto_erro = errorPayload(err);
  }

  return context;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("NVIDIA_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "NVIDIA_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id ?? null;
    const userEmail = userData?.user?.email ?? null;

    // Admin client para operações que precisam bypassar RLS (leitura de tabelas Auge)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const rawMessages: any[] = Array.isArray(body?.messages)
      ? body.messages
      : body?.message
        ? [body.message]
        : [];
    if (rawMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normaliza mensagens vindas de clientes com formatos diferentes:
    // - AI SDK v7 (UIMessage): { role, parts: [{type:'text', text}, ...] }
    // - AI SDK v4/legacy: { role, content: string }
    // Convertemos tudo para ModelMessage[] (o formato aceito pelo streamText).
    const modelMessages: ModelMessage[] = [];
    const hasParts = rawMessages.some((m) => Array.isArray(m?.parts));
    if (hasParts) {
      try {
        const converted = convertToModelMessages(rawMessages as UIMessage[]);
        if (Array.isArray(converted)) modelMessages.push(...converted);
      } catch (e) {
        console.warn("[ai-agent] convertToModelMessages falhou, usando fallback", e);
      }
    }
    if (modelMessages.length === 0) {
      for (const m of rawMessages) {
        const role = m?.role === "assistant" ? "assistant" : m?.role === "system" ? "system" : "user";
        let text = "";
        if (typeof m?.content === "string") text = m.content;
        else if (Array.isArray(m?.parts)) {
          text = m.parts
            .filter((p: any) => p?.type === "text" && typeof p.text === "string")
            .map((p: any) => p.text)
            .join("\n");
        } else if (Array.isArray(m?.content)) {
          text = m.content
            .filter((p: any) => p?.type === "text" && typeof p.text === "string")
            .map((p: any) => p.text)
            .join("\n");
        }
        if (text) modelMessages.push({ role, content: text } as ModelMessage);
      }
    }
    if (modelMessages.length === 0) {
      return new Response(JSON.stringify({ error: "Formato de mensagens não reconhecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("[ai-agent] recebidas", rawMessages.length, "msgs; normalizadas:", modelMessages.length);

    // Provedor: NVIDIA NIM (OpenAI-compatível)
    const nvidia = createOpenAICompatible({
      name: "nvidia",
      baseURL: "https://integrate.api.nvidia.com/v1",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    // Sem tool-loop no provedor NVIDIA: o app consulta o banco antes e injeta
    // contexto ao modelo. Isso evita o bug em que a IA chamava uma ferramenta,
    // encerrava o stream e deixava o usuário sem resposta textual.
    const model = nvidia(Deno.env.get("NVIDIA_MODEL") ?? "meta/llama-3.1-8b-instruct");

    const automaticContext = await buildAgentContext(admin, latestUserText(modelMessages));

    const system = `Você é o Assistente do Pente Fino, um agente de IA integrado ao ERP de estoque da Unilux.
Você tem acesso ao banco de dados do app e pode consultar cadastros, transferências, estoque, movimentações e mais.
Também pode preparar ações de escrita (criar transferência, registrar saída), mas ações que mutam dados exigem confirmação humana.

Regras:
- Responda sempre em português do Brasil, tom profissional e direto (estilo ERP).
- Formate quantidades no padrão BR: "000.000,00". Se o valor for exatamente 1, use "1".
- Use markdown para tabelas e listas quando ajudar a leitura.
- Antes de executar uma ação de escrita, resuma o que será feito e peça confirmação explícita.
- Se o usuário pedir algo fora do escopo do estoque, explique gentilmente que você atende o Pente Fino.
- Ao consultar tabelas, prefira filtrar por códigos exatos quando o usuário informar; caso contrário busque por texto parcial (ilike).
- Use obrigatoriamente o contexto consultado automaticamente abaixo para responder. Se ele vier vazio, diga claramente que não encontrou dados suficientes.
- Nunca finalize com resposta vazia. Mesmo quando não houver dados, explique o que foi consultado e o próximo filtro recomendado.

Usuário atual: ${userEmail ?? "não autenticado"} (id: ${userId ?? "-"}).
Data/hora: ${new Date().toISOString()}.

Contexto consultado automaticamente no Pente Fino/Auge:
${JSON.stringify(automaticContext, null, 2)}`;

    const result = streamText({
      model,
      system,
      messages: modelMessages,
      temperature: 0.2,
      maxOutputTokens: 800,
    });

    return result.toUIMessageStreamResponse({
      headers: corsHeaders,
      onError: (error) => {
        console.error("[ai-agent] stream error", error);
        return error instanceof Error ? error.message : "Falha ao gerar resposta do assistente.";
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai-agent] request error", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

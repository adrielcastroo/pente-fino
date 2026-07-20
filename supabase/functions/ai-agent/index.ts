// AI Agent — assistente do Pente Fino/Auge.
// - Guardrail de escopo: só responde sobre estoque/Pente Fino/Auge.
// - Roteamento por tarefa + fallback em cadeia: Cerebras → Groq → NVIDIA.
import { convertToModelMessages, generateText, streamText, type ModelMessage, type UIMessage } from "npm:ai";
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

const STOPWORDS = new Set([
  "qual","quais","quanto","quantos","temos","mais","menos","estoque","item","itens",
  "tecido","tecidos","produto","produtos","cor","cores","codigo","código","para","com",
  "dos","das","que","uma","por","em","no","na","de","do","da","o","a","e",
]);

function textTokens(text: string) {
  return Array.from(
    new Set(
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .match(/[a-z0-9]+/g)
        ?.filter((token) => token.length >= 2 && !STOPWORDS.has(token)) ?? [],
    ),
  ).slice(0, 6);
}

// ---------- Escopo Pente Fino / Auge ----------
// Vocabulário mínimo do domínio. Se a mensagem for muito curta (saudação) permitimos.
// Se for longa e não contém nenhum termo do domínio, recusamos.
const DOMAIN_TERMS = [
  "pente fino","auge","estoque","cadastro","cadastros","item","itens","itens_cadastro",
  "tecido","tecidos","motor","motores","madeira","componente","componentes",
  "transferencia","transferência","transferencias","transferências","rascunho","efetiva","efetivar",
  "saida","saída","saidas","saídas","entrada","entradas","movimenta","movimentação","movimentacoes",
  "kardex","deposito","depósito","depositos","depósitos","lote","lotes","serie","série","series","séries",
  "endereco","endereço","enderecos","endereços","mapa","posicao","posição","posicoes","posições",
  "conferencia","conferência","conferencias","conferências","romaneio","romaneios","expedicao","expedição",
  "picking","carrinho","carrinhos","nf","nfe","nota","notas","fiscal","fiscais","xml","danfe",
  "reserva","reservas","inventario","inventário","contagem","contagens","operador","conferente",
  "cor","cores","tonalidade","screen","blackout","tecido","metros","m2","m²","peça","pecas","peças",
  "auditoria","reconciliacao","reconciliação","chao","chão","tec","fifo","descricao","descrição",
  "sincroniz","sync","importar","export","relatorio","relatório","dashboard","carga","transportadora",
];

const GREETING_RE = /^\s*(oi|ola|olá|bom dia|boa tarde|boa noite|e ai|eaí|hello|hi|hey|obrigad|valeu|tchau|help|ajuda)\b/i;
const HELP_RE = /(o que voce faz|o que você faz|como usar|ajuda|help|capacidades|comandos)/i;

function isInScope(text: string): { ok: boolean; reason?: string } {
  const t = text.trim();
  if (!t) return { ok: false, reason: "vazio" };
  if (t.length < 12) return { ok: true }; // saudações / curtas
  if (GREETING_RE.test(t) || HELP_RE.test(t)) return { ok: true };
  const norm = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hit = DOMAIN_TERMS.some((term) => norm.includes(term));
  if (hit) return { ok: true };
  return { ok: false, reason: "fora_de_escopo" };
}

function sanitizePostgrestValue(value: string) {
  return value.replace(/[(),.]/g, " ").trim();
}

async function buildAgentContext(admin: ReturnType<typeof createClient>, text: string) {
  const tokens = textTokens(text);
  const wantsTransfers = /transfer|rascunho|efetiva/i.test(text);
  const wantsMoves = /entrada|sa[ií]da|movimenta|kardex/i.test(text);
  const context: Record<string, unknown> = { consulta: text, tokens_usados: tokens };

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
      .sort((a, b) =>
        Number.parseFloat(String(b.saldo_estimado).replace(/\./g, "").replace(",", ".")) -
        Number.parseFloat(String(a.saldo_estimado).replace(/\./g, "").replace(",", ".")),
      )
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

// ---------- Provedores + fallback ----------
type ProviderId = "cerebras" | "groq" | "nvidia";

interface ProviderCfg {
  id: ProviderId;
  apiKey: string | undefined;
  baseURL: string;
  model: string;
  fastModel: string; // usado para tarefas simples
}

function getProviders(): ProviderCfg[] {
  return [
    {
      id: "cerebras",
      apiKey: Deno.env.get("CEREBRAS_API_KEY"),
      baseURL: "https://api.cerebras.ai/v1",
      model: Deno.env.get("CEREBRAS_MODEL") ?? "llama-3.3-70b",
      fastModel: Deno.env.get("CEREBRAS_FAST_MODEL") ?? "llama3.1-8b",
    },
    {
      id: "groq",
      apiKey: Deno.env.get("GROQ_API_KEY"),
      baseURL: "https://api.groq.com/openai/v1",
      model: Deno.env.get("GROQ_MODEL") ?? "llama-3.3-70b-versatile",
      fastModel: Deno.env.get("GROQ_FAST_MODEL") ?? "llama-3.1-8b-instant",
    },
    {
      id: "nvidia",
      apiKey: Deno.env.get("NVIDIA_API_KEY"),
      baseURL: "https://integrate.api.nvidia.com/v1",
      model: Deno.env.get("NVIDIA_MODEL") ?? "meta/llama-3.3-70b-instruct",
      fastModel: Deno.env.get("NVIDIA_FAST_MODEL") ?? "meta/llama-3.1-8b-instruct",
    },
  ];
}

// Classifica a tarefa: "fast" para perguntas curtas/simples; "reasoning" para
// pedidos que envolvam análise, comparação, listagens ou ações.
function classifyTask(text: string): "fast" | "reasoning" {
  const t = text.toLowerCase();
  const heavy = /(analis|compar|resumo|resuma|liste|listar|explique|explicar|por que|porque|planej|sugere|sugir|recomend|estrat|hist[oó]rico|relat|criar transfer|efetivar|preparar|top |mais |menos |ranking|agrup|totaliz)/;
  if (t.length > 140 || heavy.test(t)) return "reasoning";
  return "fast";
}

function pickModel(cfg: ProviderCfg, task: "fast" | "reasoning") {
  return task === "fast" ? cfg.fastModel : cfg.model;
}

/**
 * Testa disponibilidade do provedor com um POST curto (não-stream). Se responder
 * com 2xx num timeout curto, o provedor está saudável. Isso permite fallback
 * automático em cadeia sem quebrar o stream principal.
 */
async function probeProvider(cfg: ProviderCfg, model: string): Promise<boolean> {
  if (!cfg.apiKey) return false;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 4500);
  try {
    const r = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        temperature: 0,
      }),
      signal: ac.signal,
    });
    clearTimeout(t);
    return r.ok;
  } catch (_) {
    clearTimeout(t);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const providers = getProviders().filter((p) => !!p.apiKey);
    if (providers.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum provedor de IA configurado (CEREBRAS_API_KEY, GROQ_API_KEY ou NVIDIA_API_KEY)." }), {
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
          text = m.parts.filter((p: any) => p?.type === "text" && typeof p.text === "string").map((p: any) => p.text).join("\n");
        } else if (Array.isArray(m?.content)) {
          text = m.content.filter((p: any) => p?.type === "text" && typeof p.text === "string").map((p: any) => p.text).join("\n");
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

    const userText = latestUserText(modelMessages);
    const scope = isInScope(userText);
    const task = classifyTask(userText);

    console.log("[ai-agent]", { msgs: modelMessages.length, task, scope: scope.ok, providers: providers.map((p) => p.id) });

    // Guardrail duro: fora de escopo → resposta curta, sem chamar IA.
    if (!scope.ok) {
      const refusal = "Sou o Assistente do Pente Fino e só respondo dúvidas sobre estoque, cadastros, transferências, saídas, entradas, movimentações e demais operações do Pente Fino/Auge. Se sua pergunta for sobre isso, reformule com o produto, lote ou operação que deseja consultar.";
      // Emite como UI Message Stream compatível com useChat.
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const id = crypto.randomUUID();
          const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          send({ type: "start" });
          send({ type: "start-step" });
          send({ type: "text-start", id });
          send({ type: "text-delta", id, delta: refusal });
          send({ type: "text-end", id });
          send({ type: "finish-step" });
          send({ type: "finish" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "x-vercel-ai-ui-message-stream": "v1",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    const automaticContext = await buildAgentContext(admin, userText);

    const system = `Você é o Assistente do Pente Fino, integrado ao ERP de estoque da Unilux (Pente Fino + Auge).

ESCOPO — REGRA DURA:
- Você SOMENTE responde perguntas e executa ações relacionadas ao Pente Fino/Auge:
  cadastros de itens, tecidos, motores, madeira, componentes, estoque, saldo,
  endereços/mapa, lotes, séries, depósitos, transferências, saídas, entradas,
  movimentações, kardex, conferências, romaneios, expedição, NF-e, reservas,
  inventário, auditoria e relatórios do próprio app.
- Se o usuário pedir algo fora desse escopo (receitas, notícias, opinião,
  cultura geral, outro sistema, código não-relacionado etc.), recuse educadamente
  em UMA frase e ofereça exemplos do que você pode fazer aqui. NÃO invente
  respostas fora do domínio.

REGRAS DE RESPOSTA:
- Sempre em português do Brasil, tom profissional e direto (estilo ERP).
- Quantidades no padrão BR: "000.000,00". Se valor for exatamente 1, use "1".
- Use markdown para tabelas/listas quando ajudar a leitura.
- Antes de executar QUALQUER ação de escrita (criar transferência, registrar saída,
  efetivar movimento), resuma o que será feito e peça confirmação explícita.
- Use OBRIGATORIAMENTE o contexto consultado automaticamente abaixo. Se vier vazio,
  informe o que foi pesquisado e sugira um filtro melhor (código, lote, endereço).
- Nunca finalize com resposta vazia.

Usuário atual: ${userEmail ?? "não autenticado"} (id: ${userId ?? "-"}).
Data/hora: ${new Date().toISOString()}.

Contexto consultado automaticamente no Pente Fino/Auge:
${JSON.stringify(automaticContext, null, 2)}`;

    // Cadeia de fallback resiliente: tenta cada provedor com generateText.
    // Se qualquer um falhar (rate limit, token limit, timeout, 5xx), passa para o próximo.
    // Só emite o stream ao cliente depois que UM provedor devolveu texto válido —
    // assim o usuário nunca fica sem resposta por falha de stream no meio.
    const errors: Array<{ provider: string; model: string; error: string }> = [];
    let finalText = "";
    let usedProvider = "";
    let usedModel = "";

    for (const cfg of providers) {
      const modelId = pickModel(cfg, task);
      try {
        const provider = createOpenAICompatible({
          name: cfg.id,
          baseURL: cfg.baseURL,
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
        });
        const model = provider(modelId);
        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 25000);
        try {
          const { text } = await generateText({
            model,
            system,
            messages: modelMessages,
            temperature: 0.2,
            maxOutputTokens: 900,
            abortSignal: ac.signal,
          });
          clearTimeout(timeout);
          const clean = (text ?? "").trim();
          if (clean.length > 0) {
            finalText = clean;
            usedProvider = cfg.id;
            usedModel = modelId;
            console.log(`[ai-agent] ✓ ${cfg.id} / ${modelId} (task=${task}, chars=${clean.length})`);
            break;
          }
          errors.push({ provider: cfg.id, model: modelId, error: "resposta vazia" });
          console.warn(`[ai-agent] ${cfg.id} devolveu vazio, tentando próximo`);
        } finally {
          clearTimeout(timeout);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ provider: cfg.id, model: modelId, error: msg });
        console.error(`[ai-agent] falha em ${cfg.id} (${modelId}): ${msg} — tentando próximo`);
      }
    }

    // Último recurso: tenta o modelo "fast" de cada provedor se o "reasoning" falhou.
    if (!finalText && task === "reasoning") {
      for (const cfg of providers) {
        const modelId = cfg.fastModel;
        try {
          const provider = createOpenAICompatible({
            name: cfg.id,
            baseURL: cfg.baseURL,
            headers: { Authorization: `Bearer ${cfg.apiKey}` },
          });
          const { text } = await generateText({
            model: provider(modelId),
            system,
            messages: modelMessages,
            temperature: 0.2,
            maxOutputTokens: 700,
          });
          const clean = (text ?? "").trim();
          if (clean.length > 0) {
            finalText = clean;
            usedProvider = `${cfg.id}(fast)`;
            usedModel = modelId;
            console.log(`[ai-agent] ✓ fallback fast ${cfg.id} / ${modelId}`);
            break;
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push({ provider: `${cfg.id}(fast)`, model: modelId, error: msg });
        }
      }
    }

    if (!finalText) {
      finalText =
        "Não consegui gerar uma resposta agora — todos os provedores de IA falharam ou estão indisponíveis. " +
        "Tente novamente em alguns segundos ou reformule a pergunta com um código/lote específico.";
      usedProvider = "fallback-local";
      usedModel = "static";
      console.error("[ai-agent] todos os provedores falharam", errors);
    }

    // Emite o texto final como UI Message Stream (mesmo formato do useChat).
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const id = crypto.randomUUID();
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        send({ type: "start" });
        send({ type: "start-step" });
        send({ type: "text-start", id });
        // Emite em pedaços para dar sensação de streaming no cliente.
        const CHUNK = 80;
        for (let i = 0; i < finalText.length; i += CHUNK) {
          send({ type: "text-delta", id, delta: finalText.slice(i, i + CHUNK) });
        }
        send({ type: "text-end", id });
        send({ type: "finish-step" });
        send({ type: "finish" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "x-vercel-ai-ui-message-stream": "v1",
        "Cache-Control": "no-cache, no-transform",
        "x-ai-provider": usedProvider,
        "x-ai-model": usedModel,
        "x-ai-task": task,
        "x-ai-fallbacks": String(errors.length),
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

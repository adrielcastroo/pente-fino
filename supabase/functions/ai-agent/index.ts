// AI Agent — assistente do Pente Fino com acesso a consultas e ações do app.
import { convertToModelMessages, streamText, stepCountIs, tool, type ModelMessage, type UIMessage } from "npm:ai";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { z } from "npm:zod";
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

function clampLimit(value: unknown, fallback: number, max: number) {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(Math.trunc(n), max));
}

function errorPayload(err: unknown) {
  if (err instanceof Error) return { error: err.message, stack: err.stack };
  return { error: typeof err === "string" ? err : JSON.stringify(err) };
}

const numberLikeInput = z.union([z.number(), z.string()]);
const optionalNumberInput = numberLikeInput.optional();
const requiredNumberInput = numberLikeInput;

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
    // Modelo com tool calling robusto — 8B é fraco demais para 7 ferramentas.
    // 70B do Llama 3.3 é o padrão NVIDIA NIM com melhor custo/qualidade para agentes.
    const model = nvidia("meta/llama-3.3-70b-instruct");

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

Usuário atual: ${userEmail ?? "não autenticado"} (id: ${userId ?? "-"}).
Data/hora: ${new Date().toISOString()}.`;

    const tools = {
      consultar_itens: tool({
        description: "Consulta o cadastro de itens (itens_cadastro). Filtra por código exato ou trecho da descrição. Retorna até 20 registros.",
        inputSchema: z.object({
          codigo: z.string().optional().describe("Código exato do item (opcional)"),
          descricao: z.string().optional().describe("Trecho da descrição para busca ilike (opcional)"),
          limit: optionalNumberInput.describe("Quantidade máxima de registros"),
        }),
        execute: async ({ codigo, descricao, limit }) => {
          try {
            const safeLimit = clampLimit(limit, 20, 50);
            const codigoNormalizado = codigo?.trim();
            let q = admin
              .from("itens_cadastro")
              .select(
                "codigo_interno,descricao,unidade,codigo_fornecedor,codigos_fornecedor,pacote_fornecedor,pacote_estocagem",
              )
              .limit(safeLimit);
            if (codigoNormalizado) {
              q = q.or(
                `codigo_interno.eq.${codigoNormalizado},codigo_interno_normalizado.eq.${codigoNormalizado},codigo_fornecedor.eq.${codigoNormalizado},codigo_fornecedor_normalizado.eq.${codigoNormalizado}`,
              );
            }
            if (descricao) q = q.ilike("descricao", `%${descricao.trim()}%`);
            const { data, error } = await q;
            if (error) return { error: error.message };
            return { count: data?.length ?? 0, items: data ?? [] };
          } catch (err) {
            return errorPayload(err);
          }
        },
      }),

      consultar_saldo_estoque: tool({
        description: "Consulta saldo de um item nas posições do estoque (estoque_posicoes). Informe o código do item.",
        inputSchema: z.object({
          codigo: z.string().describe("Código do item"),
        }),
        execute: async ({ codigo }) => {
          try {
            const codigoNormalizado = codigo.trim();
            const { data, error } = await admin
              .from("estoque_posicoes")
              .select("endereco,item,auge_cd_item,lote,lote_sistema,deposito_atual,status,m_linear_atual,m_linear,m2_atual,m2")
              .or(`item.eq.${codigoNormalizado},auge_cd_item.eq.${codigoNormalizado}`)
              .limit(100);
            if (error) return { error: error.message };
            const total = (data ?? []).reduce(
              (s, r: any) => s + Number(r.m_linear_atual ?? r.m_linear ?? r.m2_atual ?? r.m2 ?? 0),
              0,
            );
            return { codigo, total: fmtBR(total), posicoes: data ?? [] };
          } catch (err) {
            return errorPayload(err);
          }
        },
      }),

      consultar_transferencias: tool({
        description: "Lista transferências recentes do Auge, com filtros opcionais. Retorna até 30 registros ordenados por data desc.",
        inputSchema: z.object({
          produto: z.string().optional().describe("Filtro por código do produto"),
          data_de: z.string().optional().describe("Data inicial YYYY-MM-DD"),
          data_ate: z.string().optional().describe("Data final YYYY-MM-DD"),
          status: z.string().optional(),
          limit: optionalNumberInput.describe("Quantidade máxima de registros"),
        }),
        execute: async ({ produto, data_de, data_ate, status, limit }) => {
          try {
            const safeLimit = clampLimit(limit, 30, 50);
            let q = admin
              .from("auge_transferencias")
              .select(
                "documento,nr_efetivacao,data_movimento,codigo_produto,descricao_produto,quantidade,deposito_origem,deposito_destino,situacao,ds_situacao,observacao,usuario_criacao,usuario_efetivacao,ds_efetivacao",
              )
              .order("data_movimento", { ascending: false, nullsFirst: false })
              .limit(safeLimit);
            if (produto) q = q.eq("codigo_produto", produto.trim());
            if (data_de) q = q.gte("data_movimento", `${data_de}T00:00:00.000Z`);
            if (data_ate) q = q.lte("data_movimento", `${data_ate}T23:59:59.999Z`);
            if (status) q = q.or(`situacao.ilike.%${status.trim()}%,ds_situacao.ilike.%${status.trim()}%`);
            const { data, error } = await q;
            if (error) return { error: error.message };
            return { count: data?.length ?? 0, transferencias: data ?? [] };
          } catch (err) {
            return errorPayload(err);
          }
        },
      }),

      consultar_movimentacoes: tool({
        description: "Consulta movimentações (entradas/saídas) do Auge para um item específico.",
        inputSchema: z.object({
          codigo: z.string(),
          tipo: z.string().optional().describe("entrada, saida ou todos"),
          limit: optionalNumberInput.describe("Quantidade máxima de registros"),
        }),
        execute: async ({ codigo, tipo, limit }) => {
          try {
            const safeLimit = clampLimit(limit, 20, 50);
            const tipoNormalizado = (tipo ?? "todos").toLowerCase();
            let q = admin
              .from("auge_movimentacoes")
              .select(
                "data_movimento,tipo,codigo_produto,quantidade,deposito,documento,observacao,situacao,ds_situacao,usuario_criacao,usuario_efetivacao,ds_efetivacao",
              )
              .eq("codigo_produto", codigo.trim())
              .order("data_movimento", { ascending: false, nullsFirst: false })
              .limit(safeLimit);
            if (tipoNormalizado !== "todos") q = q.ilike("tipo", `%${tipoNormalizado}%`);
            const { data, error } = await q;
            if (error) return { error: error.message };
            return { count: data?.length ?? 0, movimentacoes: data ?? [] };
          } catch (err) {
            return errorPayload(err);
          }
        },
      }),

      consultar_tecidos_sem_espaco: tool({
        description: "Lista lotes de tecidos que não têm endereço alocado no mapa.",
        inputSchema: z.object({
          limit: optionalNumberInput.describe("Quantidade máxima de registros"),
        }),
        execute: async ({ limit }) => {
          try {
            const safeLimit = clampLimit(limit, 30, 100);
            const { data, error } = await admin
              .from("tecidos_sem_espaco")
              .select("item,auge_cd_item,endereco_desejado,estrutura,coluna,nivel,proc,m_linear,largura,m2,lote,lote_sistema")
              .limit(safeLimit);
            if (error) return { error: error.message };
            return { count: data?.length ?? 0, itens: data ?? [] };
          } catch (err) {
            return errorPayload(err);
          }
        },
      }),

      consultar_conferencias_recentes: tool({
        description: "Lista conferências recentes do módulo estoque.",
        inputSchema: z.object({
          limit: optionalNumberInput.describe("Quantidade máxima de registros"),
        }),
        execute: async ({ limit }) => {
          try {
            const safeLimit = clampLimit(limit, 10, 30);
            const { data, error } = await admin
              .from("conferences")
              .select("id,processo,conferente,started_at,finished_at")
              .order("started_at", { ascending: false, nullsFirst: false })
              .limit(safeLimit);
            if (error) return { error: error.message };
            return { count: data?.length ?? 0, conferencias: data ?? [] };
          } catch (err) {
            return errorPayload(err);
          }
        },
      }),

      preparar_transferencia: tool({
        description:
          "Prepara um rascunho de transferência entre depósitos. Esta ferramenta NÃO executa a criação — apenas retorna o payload validado para o usuário confirmar. Depois de confirmado, o app dispara a criação via /estoque/transferencias.",
        inputSchema: z.object({
          produto: z.string(),
          quantidade: requiredNumberInput,
          deposito_origem: z.string(),
          deposito_destino: z.string(),
          lote: z.string().optional(),
          observacao: z.string().optional(),
        }),
        execute: async (input) => {
          return {
            status: "aguardando_confirmacao",
            mensagem:
              "Rascunho de transferência preparado. Confirme os dados na tela /estoque/transferencias para efetivar no Auge.",
            payload: input,
          };
        },
      }),
    };

    const result = streamText({
      model,
      system,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(8),
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

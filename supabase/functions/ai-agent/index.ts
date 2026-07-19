// AI Agent — assistente do Pente Fino com acesso a consultas e ações do app.
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "npm:ai";
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not set" }), {
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

    const { messages }: { messages: UIMessage[] } = await req.json();

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

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
          limit: z.number().min(1).max(50).default(20),
        }),
        execute: async ({ codigo, descricao, limit }) => {
          let q = admin.from("itens_cadastro").select("codigo,descricao,unidade,categoria,ativo").limit(limit);
          if (codigo) q = q.eq("codigo", codigo);
          if (descricao) q = q.ilike("descricao", `%${descricao}%`);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, items: data ?? [] };
        },
      }),

      consultar_saldo_estoque: tool({
        description: "Consulta saldo de um item nas posições do estoque (estoque_posicoes). Informe o código do item.",
        inputSchema: z.object({
          codigo: z.string().describe("Código do item"),
        }),
        execute: async ({ codigo }) => {
          const { data, error } = await admin
            .from("estoque_posicoes")
            .select("endereco,quantidade,lote,deposito,status")
            .eq("codigo", codigo)
            .limit(100);
          if (error) return { error: error.message };
          const total = (data ?? []).reduce((s, r: any) => s + Number(r.quantidade ?? 0), 0);
          return { codigo, total: fmtBR(total), posicoes: data ?? [] };
        },
      }),

      consultar_transferencias: tool({
        description: "Lista transferências recentes do Auge, com filtros opcionais. Retorna até 30 registros ordenados por data desc.",
        inputSchema: z.object({
          produto: z.string().optional().describe("Filtro por código do produto"),
          data_de: z.string().optional().describe("Data inicial YYYY-MM-DD"),
          data_ate: z.string().optional().describe("Data final YYYY-MM-DD"),
          status: z.string().optional(),
          limit: z.number().min(1).max(50).default(30),
        }),
        execute: async ({ produto, data_de, data_ate, status, limit }) => {
          let q = admin
            .from("auge_transferencias")
            .select("numero_rascunho,data,produto,descricao,quantidade,deposito_origem,deposito_destino,status,observacao,usuario")
            .order("data", { ascending: false })
            .limit(limit);
          if (produto) q = q.eq("produto", produto);
          if (data_de) q = q.gte("data", data_de);
          if (data_ate) q = q.lte("data", data_ate);
          if (status) q = q.ilike("status", `%${status}%`);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, transferencias: data ?? [] };
        },
      }),

      consultar_movimentacoes: tool({
        description: "Consulta movimentações (entradas/saídas) do Auge para um item específico.",
        inputSchema: z.object({
          codigo: z.string(),
          tipo: z.enum(["entrada", "saida", "todos"]).default("todos"),
          limit: z.number().min(1).max(50).default(20),
        }),
        execute: async ({ codigo, tipo, limit }) => {
          let q = admin
            .from("auge_movimentacoes")
            .select("data,tipo,quantidade,deposito,lote,documento,observacao")
            .eq("produto", codigo)
            .order("data", { ascending: false })
            .limit(limit);
          if (tipo !== "todos") q = q.ilike("tipo", `%${tipo}%`);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, movimentacoes: data ?? [] };
        },
      }),

      consultar_tecidos_sem_espaco: tool({
        description: "Lista lotes de tecidos que não têm endereço alocado no mapa.",
        inputSchema: z.object({
          limit: z.number().min(1).max(100).default(30),
        }),
        execute: async ({ limit }) => {
          const { data, error } = await admin
            .from("tecidos_sem_espaco")
            .select("codigo,descricao,lote,quantidade,endereco_original")
            .limit(limit);
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, itens: data ?? [] };
        },
      }),

      consultar_conferencias_recentes: tool({
        description: "Lista conferências recentes do módulo estoque.",
        inputSchema: z.object({
          limit: z.number().min(1).max(30).default(10),
        }),
        execute: async ({ limit }) => {
          const { data, error } = await admin
            .from("conferences")
            .select("id,processo,conferente,started_at,finished_at")
            .order("started_at", { ascending: false })
            .limit(limit);
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, conferencias: data ?? [] };
        },
      }),

      preparar_transferencia: tool({
        description:
          "Prepara um rascunho de transferência entre depósitos. Esta ferramenta NÃO executa a criação — apenas retorna o payload validado para o usuário confirmar. Depois de confirmado, o app dispara a criação via /estoque/transferencias.",
        inputSchema: z.object({
          produto: z.string(),
          quantidade: z.number(),
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
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

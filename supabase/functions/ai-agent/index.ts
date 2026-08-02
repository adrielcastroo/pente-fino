// AI Agent — assistente do Pente Fino/Auge.
import { streamText, type ModelMessage, type UIMessage, convertToModelMessages } from "npm:ai@3.1.20";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@0.0.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildTools } from "./tools.ts";
import { getFioCapabilitiesPrompt } from "./capabilities.ts";
import { buildMemoryTools, listarMemorias, memoriesToPromptBlock } from "./memory.ts";
import { parseDocuments } from "./documents.ts";
import { isTransferIntent, buildTransferFormMessage, routeTransferSubmit } from "./transfer-widget.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function errorPayload(err: unknown) {
  if (err instanceof Error) return { error: err.message, stack: err.stack };
  return { error: typeof err === "string" ? err : JSON.stringify(err) };
}

function textStreamResponse(text: string, headers: Record<string, string> = {}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const id = crypto.randomUUID();
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      send({ type: "start" });
      send({ type: "start-step" });
      send({ type: "text-start", id });
      const CHUNK = 80;
      for (let i = 0; i < text.length; i += CHUNK) {
        send({ type: "text-delta", id, delta: text.slice(i, i + CHUNK) });
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
      ...headers,
    },
  });
}

const DOMAIN_TERMS = ["pente fino","auge","estoque","cadastro","item","tecido","transferencia","saida","entrada","lote","serie","conferencia","romaneio","expedicao","reserva","kit","acabamento"];
const GREETING_RE = /^\s*(oi|ola|olá|bom dia|boa tarde|boa noite|ajuda)\b/i;

function isInScope(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length < 12 || GREETING_RE.test(t)) return true;
  return DOMAIN_TERMS.some(term => t.includes(term));
}

function roleLabel(role: string | null) {
  return role || "visitante";
}

const WIDGET_SUBMIT_PREFIX = "__widget_submit__:";
function rewriteWidgetSubmit(text: string): string {
  if (!text.startsWith(WIDGET_SUBMIT_PREFIX)) return text;
  try {
    const p = JSON.parse(text.slice(WIDGET_SUBMIT_PREFIX.length));
    return `[Envio de widget] intent: ${p.intent}, valores: ${JSON.stringify(p.values)}`;
  } catch { return text; }
}

async function buildAgentContext(admin: any, userText: string) {
  const ctx: any = {};
  const codeMatch = userText.match(/\b([A-Z]{2})[\.\s-]?(\d{3})[\.\s-]?(\d{3})\b/);
  if (codeMatch) {
    const code = codeMatch[0];
    const { data } = await admin.from("estoque_posicoes").select("*").or(`auge_cd_item.ilike.%${code}%,item.ilike.%${code}%`).limit(10);
    ctx.estoque_recente = data || [];
  }
  return ctx;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json();
    const threadId = body?.threadId;
    
    const { data: userData } = await createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    }).auth.getUser();
    const userId = userData?.user?.id;
    
    let userRole: string | null = null;
    if (userId) {
      const { data } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
      userRole = data?.role || null;
    }

    const rawMessages = body?.messages;
    const messages = Array.isArray(rawMessages) ? convertToModelMessages(rawMessages) : [];
    
    // Log para depuração de entrada
    console.log(`[ai-agent] Recebidas ${messages.length} mensagens. Thread: ${threadId}`);

    if (messages.length === 0) {
      return textStreamResponse("Olá! Como posso ajudar você hoje?");
    }

    const lastMsg = messages[messages.length - 1];
    const rawLast = (lastMsg && lastMsg.role === "user" && typeof lastMsg.content === "string") ? lastMsg.content : "";

    // Submit de widget de transferência — fluxo determinístico (não passa pelo LLM).
    if (rawLast.startsWith(WIDGET_SUBMIT_PREFIX)) {
      console.log("[ai-agent] Processando submit de widget...");
      let payload: any = null;
      try { payload = JSON.parse(rawLast.slice(WIDGET_SUBMIT_PREFIX.length)); } catch { /* ignora */ }
      const answer = await routeTransferSubmit(payload, authHeader);
      if (answer) return textStreamResponse(answer);
    }

    if (lastMsg && lastMsg.role === "user" && typeof lastMsg.content === "string") {
      lastMsg.content = rewriteWidgetSubmit(lastMsg.content);
    }
    const userText = (lastMsg && typeof lastMsg.content === "string") ? lastMsg.content : "";

    // Documentos anexados (PDF/XLS/XLSX/ODS/CSV) — lidos antes do scope check
    const { docs, promptBlock: documentsBlock } = await parseDocuments(body);

    // Pedido de transferência: devolve o widget de formulário pré-preenchido
    if (!documentsBlock && isTransferIntent(userText)) {
      return textStreamResponse(await buildTransferFormMessage(admin, userText));
    }

    if (!documentsBlock && !isInScope(userText)) {
      return textStreamResponse("Sou o Fio, assistente do Pente Fino. Só respondo sobre estoque e logística.");
    }

    // Memória de longo prazo do usuário
    const { memorias } = await listarMemorias(admin, userId ?? null);
    const memoryBlock = memoriesToPromptBlock(memorias ?? []);

    // Detecção de multimodal (imagens) para troca de modelo
    const hasImages = Array.isArray(messages) && messages.some(m => {
      const content = m.content;
      return Array.isArray(content) && content.some((c: any) => c.type === 'image_url' || c.type === 'image');
    });

    // Ordem de preferência: Groq -> Cerebras -> NVIDIA (fallback em cascata).
    // A chave da Cerebras pode estar salva como CEREBRAS_API_KEY ou OPENAI_API_KEY.
    // Prioridade de provider: Groq (instântaneo) -> Cerebras (inteligente) -> NVIDIA.
    const providers = [
      {
        id: "groq",
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: Deno.env.get("GROQ_API_KEY"),
        model: hasImages ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile"
      },
      {
        id: "cerebras",
        baseURL: "https://api.cerebras.ai/v1",
        apiKey: Deno.env.get("CEREBRAS_API_KEY") ?? Deno.env.get("OPENAI_API_KEY"),
        model: "llama-3.3-70b"
      },
      {
        id: "nvidia",
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: Deno.env.get("NVIDIA_API_KEY"),
        model: hasImages ? "meta/llama-3.2-90b-vision-instruct" : "meta/llama-3.1-405b-instruct"
      }
    ].filter(p => !!p.apiKey);

    // Adiciona fallback extra caso nenhum provider esteja configurado
    if (providers.length === 0) {
      console.error("[ai-agent] ERRO CRÍTICO: Nenhum provider configurado.");
      return textStreamResponse("Sistemas de IA indisponíveis (sem chaves API).");
    }


    return streamWithFallback(providers, messages, admin, userId, threadId, userText, userRole, {
      memoryBlock,
      documentsBlock,
      docCount: docs.length,
    });
  } catch (err) {
    return new Response(JSON.stringify(errorPayload(err)), { status: 500, headers: corsHeaders });
  }
});

type ExtraContext = { memoryBlock?: string; documentsBlock?: string; docCount?: number };

async function streamWithFallback(providers: any[], messages: ModelMessage[], admin: any, userId: any, threadId: any, userText: string, userRole: any, extra: ExtraContext = {}): Promise<Response> {
  const [current, ...rest] = providers;
  if (!current) {
    console.error("ERRO: Nenhum provider de IA configurado (chaves faltando).");
    const msg = "Sistemas de IA indisponíveis no momento. Vou te passar as chaves e vc configura no supabase pra mim.";
    return textStreamResponse(msg);
  }

  try {
    const ctx = await buildAgentContext(admin, userText);
    const system = [
      getFioCapabilitiesPrompt(),
      "Regras visuais: Use markdown rico, tabelas, [[WIDGET]], [[ARTIFACT]] e [[SUGGESTIONS]] conforme documentado.",
      `Perfil do usuário: ${roleLabel(userRole)}.`,
      extra.memoryBlock || "",
      "Quando o usuário revelar uma preferência estável (depósito favorito, formato preferido, apelido de item), chame a tool lembrar_preferencia.",
      extra.documentsBlock || "",
      `Contexto dinâmico: ${JSON.stringify(ctx)}`,
    ].filter(Boolean).join("\n\n");

    const result = await streamText({
      model: createOpenAICompatible({ name: current.id, baseURL: current.baseURL, headers: { Authorization: `Bearer ${current.apiKey}` } })(current.model),
      system,
      messages,
      tools: { ...buildTools(admin), ...buildMemoryTools(admin, userId ?? null) },
      maxSteps: 5
    });

    if (userId && threadId) {
      (async () => {
        try {
          const text = await result.text;
          await admin.from("fio_conversations").upsert({ id: threadId, user_id: userId, title: userText.slice(0, 60), updated_at: new Date().toISOString() });
          await admin.from("fio_messages").insert([
            { conversation_id: threadId, role: "user", content: { text: userText, anexos: extra.docCount ?? 0 } },
            { conversation_id: threadId, role: "assistant", content: { text } }
          ]);
        } catch (e) { console.error("Error persisting:", e); }
      })();
    }
    return result.toDataStreamResponse({ 
      headers: {
        ...corsHeaders,
        "x-fio-provider": current.id,
        "x-fio-model": current.model,
        "x-fio-docs": String(extra.docCount ?? 0)
      } 
    });
  } catch (err) { 
    console.warn(`Fallback from ${current.id}:`, err);
    return streamWithFallback(rest, messages, admin, userId, threadId, userText, userRole, extra); 
  }
}

// AI Agent — assistente do Pente Fino/Auge.
import { streamText, type ModelMessage, type UIMessage, convertToModelMessages } from "npm:ai";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildTools } from "./tools.ts";
import { getFioCapabilitiesPrompt } from "./capabilities.ts";

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

    const messages = convertToModelMessages(body.messages);
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "user" && typeof lastMsg.content === "string") {
      lastMsg.content = rewriteWidgetSubmit(lastMsg.content);
    }
    const userText = (lastMsg && typeof lastMsg.content === "string") ? lastMsg.content : "";

    if (!isInScope(userText)) return textStreamResponse("Sou o Fio, assistente do Pente Fino. Só respondo sobre estoque e logística.");

    // Detecção de multimodal (imagens) para troca de modelo
    const hasImages = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'));

    const providers = [
      { 
        id: "cerebras", 
        baseURL: "https://api.cerebras.ai/v1", 
        apiKey: Deno.env.get("CEREBRAS_API_KEY"), 
        model: "llama-3.3-70b" 
      },
      { 
        id: "nvidia", 
        baseURL: "https://integrate.api.nvidia.com/v1", 
        apiKey: Deno.env.get("NVIDIA_API_KEY"), 
        model: hasImages ? "meta/llama-3.2-90b-vision-instruct" : "meta/llama-3.1-405b-instruct" 
      },
      { 
        id: "groq", 
        baseURL: "https://api.groq.com/openai/v1", 
        apiKey: Deno.env.get("GROQ_API_KEY"), 
        model: hasImages ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile" 
      }
    ].filter(p => !!p.apiKey);

    return streamWithFallback(providers, messages, admin, userId, threadId, userText, userRole);
  } catch (err) {
    return new Response(JSON.stringify(errorPayload(err)), { status: 500, headers: corsHeaders });
  }
});

async function streamWithFallback(providers: any[], messages: ModelMessage[], admin: any, userId: any, threadId: any, userText: string, userRole: any): Promise<Response> {
  const [current, ...rest] = providers;
  if (!current) return textStreamResponse("Sistemas de IA indisponíveis no momento.");

  try {
    const ctx = await buildAgentContext(admin, userText);
    const system = `${getFioCapabilitiesPrompt()}\n\nRegras visuais: Use markdown rico, tabelas, [[WIDGET]], [[ARTIFACT]] e [[SUGGESTIONS]] conforme documentado.\nPerfil do usuário: ${roleLabel(userRole)}.\nContexto dinâmico: ${JSON.stringify(ctx)}`;
    
    const result = await streamText({
      model: createOpenAICompatible({ name: current.id, baseURL: current.baseURL, headers: { Authorization: `Bearer ${current.apiKey}` } })(current.model),
      system,
      messages,
      tools: buildTools(admin),
      maxSteps: 5
    });

    if (userId && threadId) {
      (async () => {
        try {
          const text = await result.text;
          await admin.from("fio_conversations").upsert({ id: threadId, user_id: userId, title: userText.slice(0, 60), updated_at: new Date().toISOString() });
          await admin.from("fio_messages").insert([
            { conversation_id: threadId, role: "user", content: { text: userText } },
            { conversation_id: threadId, role: "assistant", content: { text } }
          ]);
        } catch (e) { console.error("Error persisting:", e); }
      })();
    }
    return result.toDataStreamResponse({ headers: corsHeaders });
  } catch (err) { 
    console.warn(`Fallback from ${current.id}:`, err);
    return streamWithFallback(rest, messages, admin, userId, threadId, userText, userRole); 
  }
}

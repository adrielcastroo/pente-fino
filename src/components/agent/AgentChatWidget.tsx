import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, MessageSquarePlus, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAgentThreads } from "@/store/useAgentThreads";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import logo from "@/assets/ai-agent-logo.png";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

function ChatWindow({ threadId }: { threadId: string }) {
  const thread = useAgentThreads((s) => s.threads.find((t) => t.id === threadId));
  const setMessages = useAgentThreads((s) => s.setMessages);
  const setTitle = useAgentThreads((s) => s.setTitleFromFirstMessage);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAccessToken(data.session?.access_token ?? null));
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${SUPABASE_URL}/functions/v1/ai-agent`,
        headers: {
          apikey: PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken ?? PUBLISHABLE_KEY}`,
        },
      }),
    [accessToken],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: thread?.messages ?? [],
    transport,
    onError: (err) => {
      console.error("[ai-agent] erro no chat", err);
    },
  });

  // Sync back to store
  useEffect(() => {
    setMessages(threadId, messages as UIMessage[]);
  }, [messages, threadId, setMessages]);

  // Focus composer on mount / thread change / after stream
  useEffect(() => {
    composerRef.current?.focus();
  }, [threadId, status]);

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = (msg.text ?? "").trim();
    if (!text || status === "streaming" || status === "submitted") return;
    if (messages.length === 0) setTitle(threadId, text);
    void sendMessage({ parts: [{ type: "text", text }] });
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const isLoading = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasVisibleContent =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((part) => {
      if (part.type === "text") return part.text.trim().length > 0;
      if (part.type?.startsWith("tool-")) {
        const toolPart = part as any;
        return toolPart.state === "output-available" || toolPart.state === "output-error";
      }
      return false;
    });
  const showThinking = isLoading && !lastAssistantHasVisibleContent;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<img src={logo} alt="" width={48} height={48} className="opacity-90" />}
              title="Assistente Pente Fino"
              description="Pergunte sobre itens, transferências, saldo do estoque, movimentações e mais."
            />
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
              <MessageContent
                className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent"}
              >
                {m.parts.map((part, i) => {
                  if (part.type === "text") return <MessageResponse key={i}>{part.text}</MessageResponse>;
                  if (part.type?.startsWith("tool-")) {
                    const p: any = part;
                    return (
                      <Tool key={i} defaultOpen={false}>
                        <ToolHeader type={p.type} state={p.state ?? "output-available"} />
                        <ToolContent>
                          <ToolInput input={p.input} />
                          <ToolOutput output={p.output} errorText={p.errorText} />
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {showThinking && (
            <Message from="assistant">
              <MessageContent className="bg-transparent">
                <Shimmer>Pensando…</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <div className="mx-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              Erro: {error.message}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-2">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea ref={composerRef} placeholder="Pergunte algo ao assistente…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={isLoading} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export function AgentChatWidget() {
  const { user } = useAuth();
  const { open, toggleOpen, threads, activeId, newThread, selectThread, deleteThread } = useAgentThreads();

  // Ensure there's an active thread when opened
  useEffect(() => {
    if (open && !activeId) newThread();
  }, [open, activeId, newThread]);

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Abrir assistente de IA"
          onClick={() => toggleOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/40 transition hover:scale-105 hover:shadow-xl tablet-landscape:bottom-6 desktop:bottom-6"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-xl border bg-background shadow-2xl",
            "inset-x-2 bottom-2 top-14 sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[640px] sm:w-[440px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b bg-card/50 px-3 py-2">
            <img src={logo} alt="" width={24} height={24} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">Assistente Pente Fino</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {threads.find((t) => t.id === activeId)?.title ?? "Nova conversa"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => newThread()}
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => toggleOpen(false)}
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Thread list (compact) */}
          {threads.length > 1 && (
            <div className="flex gap-1 overflow-x-auto border-b bg-muted/30 px-2 py-1.5">
              {threads.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "group flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs",
                    t.id === activeId ? "border-primary bg-primary/10" : "border-transparent hover:bg-accent",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectThread(t.id)}
                    className="max-w-[140px] truncate text-left"
                    title={t.title}
                  >
                    {t.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteThread(t.id)}
                    className="opacity-0 transition group-hover:opacity-70 hover:opacity-100"
                    aria-label="Remover conversa"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => newThread()}
                className="shrink-0"
                aria-label="Nova conversa"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {activeId && <ChatWindow key={activeId} threadId={activeId} />}
        </div>
      )}
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageSquarePlus, Plus, Trash2, X } from "lucide-react";
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
import { AskUserInline, extractAskUser } from "./AskUserDialog";
import logo from "@/assets/fio-logo.png";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

function ChatWindow({ threadId }: { threadId: string }) {
  // Snapshot initial messages ONCE per mount (component is keyed by threadId,
  // so a new thread remounts and re-snapshots). Passing a reactive array from
  // the store as `messages` creates a feedback loop with the sync effect below
  // and stomps the stream mid-flight — that was the cause of "Pensando…" never
  // resolving and the user message flashing twice.
  const initialMessages = useMemo(
    () => useAgentThreads.getState().threads.find((t) => t.id === threadId)?.messages ?? [],
    [threadId],
  );
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
    messages: initialMessages,
    transport,
    onFinish: () => {
      window.dispatchEvent(new CustomEvent("fio:response"));
    },
    onError: (err) => {
      console.error("[ai-agent] erro no chat", err);
    },
  });

  // Sync back to store only when the turn settles — avoids feedback-loop
  // re-renders while tokens are streaming.
  useEffect(() => {
    if (status === "ready" || status === "error") {
      setMessages(threadId, messages as UIMessage[]);
    }
  }, [status, messages, threadId, setMessages]);

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
              icon={<img src={logo} alt="" width={72} height={72} className="rounded-xl opacity-95" />}
              title="Fio · Assistente do Pente Fino"
              description="Sou o Fio. Pergunte sobre itens, transferências, saldo do estoque, movimentações e mais."
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
          <PromptInputTextarea ref={composerRef} placeholder="Pergunte algo ao Fio…" />
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
  const [hasUnread, setHasUnread] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Ensure there's an active thread when opened
  useEffect(() => {
    if (open && !activeId) newThread();
  }, [open, activeId, newThread]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  // Listen for finished responses while minimized
  useEffect(() => {
    const onResponse = () => {
      if (!useAgentThreads.getState().open) setHasUnread(true);
    };
    window.addEventListener("fio:response", onResponse);
    return () => window.removeEventListener("fio:response", onResponse);
  }, []);

  // Click outside to minimize
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        toggleOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, toggleOpen]);

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Abrir Fio (assistente de IA)"
          onClick={() => toggleOpen(true)}
          className="group fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg ring-1 ring-primary/40 transition-all duration-200 hover:shadow-2xl hover:ring-2 hover:ring-primary tablet-landscape:bottom-6 desktop:bottom-6"
        >
          <div className="relative h-full w-full">
            <img
              src={logo}
              alt="Fio"
              className="h-full w-full rounded-2xl object-cover transition-transform duration-300 group-hover:animate-fio-peek"
              style={{ transformOrigin: "bottom center" }}
            />
            {/* Mãozinha acenando — aparece só no hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 -top-3 text-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-fio-wave"
              style={{ transformOrigin: "70% 80%" }}
            >
              👋
            </span>
          </div>
          {hasUnread && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-background" />
            </span>
          )}
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
            Fale com o Fio
          </span>
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-xl border bg-background shadow-2xl",
            "inset-x-2 bottom-2 top-14 sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[640px] sm:w-[440px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b bg-card/50 px-3 py-2">
            <img src={logo} alt="" width={24} height={24} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">Fio</div>
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

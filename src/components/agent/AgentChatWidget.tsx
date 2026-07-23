import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageSquarePlus, PanelRightClose, PanelRightOpen, Plus, Trash2, X } from "lucide-react";
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
import { Suggestions, extractSuggestions } from "./Suggestions";
import { WidgetChip } from "./widgets/WidgetChip";
import { DockedWidgetBar } from "./widgets/DockedWidgetBar";
import { useFloatingWidget } from "@/store/useFloatingWidget";
import { ArtifactChip, ArtifactPanel } from "./artifacts/ArtifactPanel";
import {
  extractArtifacts,
  extractWidgets,
  decodeWidgetSubmit,
  type ArtifactSpec,
} from "@/lib/agent-blocks";
import { useChatPanel } from "@/store/useChatPanel";
import logo from "@/assets/fio-logo.png";


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

type ArtifactMap = Record<string, ArtifactSpec>;

function ChatWindow({
  threadId,
  onArtifact,
  activeArtifactId,
  onSelectArtifact,
}: {
  threadId: string;
  onArtifact: (spec: ArtifactSpec) => void;
  activeArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
}) {
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

  useEffect(() => {
    if (status === "ready" || status === "error") {
      setMessages(threadId, messages as UIMessage[]);
    }
  }, [status, messages, threadId, setMessages]);

  useEffect(() => {
    composerRef.current?.focus();
  }, [threadId, status]);

  const registerFloatingWidget = useFloatingWidget((s) => s.register);

  // Extract all artifacts + widgets from message stream (deduped by id).
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const part of m.parts) {
        if (part.type !== "text") continue;
        const { artifacts } = extractArtifacts(part.text);
        for (const a of artifacts) onArtifact(a);
        const { widgets } = extractWidgets(part.text);
        for (const w of widgets) registerFloatingWidget(w);
      }
    }
  }, [messages, onArtifact, registerFloatingWidget]);

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
    <div className="flex flex-1 flex-col min-h-0 min-w-0">
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
                  if (part.type === "text") {
                    // Hide raw widget-submit payloads on user messages.
                    if (m.role === "user") {
                      const submit = decodeWidgetSubmit(part.text);
                      if (submit) {
                        return (
                          <div key={i} className="text-xs opacity-80">
                            ✓ Formulário enviado
                          </div>
                        );
                      }
                      return <MessageResponse key={i}>{part.text}</MessageResponse>;
                    }

                    const { spec: askSpec, cleaned: afterAsk } = extractAskUser(part.text);
                    const { widgets, cleaned: afterWidgets } = extractWidgets(afterAsk);
                    const { artifacts, cleaned: afterArtifacts } = extractArtifacts(afterWidgets);
                    const { items: suggestions, cleaned } = extractSuggestions(afterArtifacts);
                    const isLastAssistant = m.id === lastMessage?.id;
                    return (
                      <div key={i}>
                        {cleaned && <MessageResponse>{cleaned}</MessageResponse>}
                        {askSpec && (
                          <AskUserInline
                            spec={askSpec}
                            disabled={isLoading}
                            onSubmit={(formatted) =>
                              void sendMessage({ parts: [{ type: "text", text: formatted }] })
                            }
                          />
                        )}
                        {widgets.map((w) => (
                          <WidgetChip key={w.id} spec={w} />
                        ))}
                        {artifacts.map((a) => (
                          <ArtifactChip
                            key={a.id}
                            spec={a}
                            active={a.id === activeArtifactId}
                            onOpen={() => onSelectArtifact(a.id)}
                          />
                        ))}
                        {isLastAssistant && !isLoading && suggestions.length > 0 && (
                          <Suggestions
                            items={suggestions}
                            disabled={isLoading}
                            onPick={(text) =>
                              void sendMessage({ parts: [{ type: "text", text }] })
                            }
                          />
                        )}
                      </div>
                    );
                  }

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

      <DockedWidgetBar
        disabled={isLoading}
        onSend={(text) => void sendMessage({ parts: [{ type: "text", text }] })}
      />

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

  // Artifacts state — accumulated across the active thread and reset on thread change.
  const [artifacts, setArtifacts] = useState<ArtifactMap>({});
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [mobileArtifactVisible, setMobileArtifactVisible] = useState(false);

  useEffect(() => {
    setArtifacts({});
    setActiveArtifactId(null);
    setMobileArtifactVisible(false);
  }, [activeId]);

  const registerArtifact = useCallback((spec: ArtifactSpec) => {
    setArtifacts((prev) => {
      const existing = prev[spec.id];
      if (existing && JSON.stringify(existing) === JSON.stringify(spec)) return prev;
      return { ...prev, [spec.id]: spec };
    });
  }, []);

  const handleSelectArtifact = useCallback((id: string) => {
    setActiveArtifactId(id);
    setMobileArtifactVisible(true);
  }, []);

  const activeArtifact = activeArtifactId ? artifacts[activeArtifactId] : null;
  const showArtifactPane = Boolean(activeArtifact);

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
      const target = e.target as HTMLElement | null;
      if (target?.closest("[role='dialog']")) return; // ignora painel flutuante/artefato
      if (panelRef.current && !panelRef.current.contains(target as Node)) {
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
        <ChatPanelShell
          panelRef={panelRef}
          showArtifactPane={showArtifactPane}
          headerContent={
            <>
              <img src={logo} alt="" width={24} height={24} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight">Fio</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {threads.find((t) => t.id === activeId)?.title ?? "Nova conversa"}
                </div>
              </div>
              <SidebarModeToggle />
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
            </>
          }
          threadsBar={
            threads.length > 1 ? (
              <div className="flex gap-1 overflow-x-auto border-b bg-muted/30 px-2 py-1.5">
                {threads.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "group flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs",
                      t.id === activeId
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-accent",
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
            ) : null
          }
          chatColumn={
            activeId ? (
              <ChatWindow
                key={activeId}
                threadId={activeId}
                onArtifact={registerArtifact}
                activeArtifactId={activeArtifactId}
                onSelectArtifact={handleSelectArtifact}
              />
            ) : null
          }
          artifactColumn={
            activeArtifact ? (
              <ArtifactPanel
                spec={activeArtifact}
                onClose={() => {
                  setActiveArtifactId(null);
                  setMobileArtifactVisible(false);
                }}
              />
            ) : null
          }
          artifactVisibleOnNarrow={mobileArtifactVisible}
        />
      )}
    </>
  );
}

// ---------- Chat panel shell (resizable + sidebar mode) ----------

function SidebarModeToggle() {
  const { mode, toggleMode } = useChatPanel();
  const isSidebar = mode === "sidebar";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleMode}
      title={isSidebar ? "Modo flutuante" : "Fixar como barra lateral"}
      aria-label={isSidebar ? "Modo flutuante" : "Fixar como barra lateral"}
    >
      {isSidebar ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
    </Button>
  );
}

const MIN_W = 340;
const MAX_W = 1400;
const MIN_H = 400;

function ChatPanelShell({
  panelRef,
  headerContent,
  threadsBar,
  chatColumn,
  artifactColumn,
  showArtifactPane,
  artifactVisibleOnNarrow,
}: {
  panelRef: React.RefObject<HTMLDivElement>;
  headerContent: React.ReactNode;
  threadsBar: React.ReactNode;
  chatColumn: React.ReactNode;
  artifactColumn: React.ReactNode;
  showArtifactPane: boolean;
  artifactVisibleOnNarrow: boolean;
}) {
  const { mode, width, height, setWidth, setHeight } = useChatPanel();
  const [measuredW, setMeasuredW] = useState<number>(width);
  const dragRef = useRef<
    | { kind: "w" | "h" | "wh"; startX: number; startY: number; origW: number; origH: number }
    | null
  >(null);

  // Media query mobile — no mobile, ocupa a tela toda.
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 640,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Observa a largura real para adaptar o layout interno.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setMeasuredW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [panelRef]);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.kind === "w" || d.kind === "wh") {
        const dx = d.startX - e.clientX; // arrastar para a esquerda aumenta
        const next = Math.min(MAX_W, Math.max(MIN_W, d.origW + dx));
        setWidth(next);
      }
      if (d.kind === "h" || d.kind === "wh") {
        const dy = d.startY - e.clientY; // arrastar para cima aumenta
        const next = Math.min(window.innerHeight - 40, Math.max(MIN_H, d.origH + dy));
        setHeight(next);
      }
    },
    [setWidth, setHeight],
  );

  useEffect(() => {
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", up);
    };
    const start = (kind: "w" | "h" | "wh") => (e: React.PointerEvent) => {
      e.preventDefault();
      dragRef.current = {
        kind,
        startX: e.clientX,
        startY: e.clientY,
        origW: width,
        origH: height,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", up);
    };
    // expose start via ref on window (simple bridge)
    (window as any).__fioStartResize = start;
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", up);
    };
  }, [onPointerMove, width, height]);

  const isSidebar = mode === "sidebar";
  const style: React.CSSProperties = isMobile
    ? {}
    : isSidebar
      ? { width: Math.max(MIN_W, Math.min(MAX_W, width + (showArtifactPane ? 440 : 0))) }
      : {
          width: Math.max(MIN_W, Math.min(MAX_W, width + (showArtifactPane ? 440 : 0))),
          height,
        };

  // Layout interno: se o painel ficar estreito, empilha chat e artifact.
  const totalW = measuredW || width;
  const canSideBySide = showArtifactPane && totalW >= 720;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden border bg-background shadow-2xl",
        isMobile
          ? "inset-x-2 bottom-2 top-14 rounded-xl"
          : isSidebar
            ? "top-0 bottom-0 right-0 rounded-none border-r-0 border-t-0 border-b-0"
            : "bottom-6 right-6 rounded-xl",
      )}
      style={style}
    >
      {/* Handles de resize (desktop apenas) */}
      {!isMobile && (
        <>
          {/* Borda esquerda: resize horizontal */}
          <div
            onPointerDown={(e) => (window as any).__fioStartResize?.("w")(e)}
            className="absolute left-0 top-0 z-20 h-full w-1.5 cursor-ew-resize hover:bg-primary/40"
            aria-hidden
          />
          {!isSidebar && (
            <>
              {/* Borda superior: resize vertical */}
              <div
                onPointerDown={(e) => (window as any).__fioStartResize?.("h")(e)}
                className="absolute left-0 top-0 z-20 h-1.5 w-full cursor-ns-resize hover:bg-primary/40"
                aria-hidden
              />
              {/* Canto superior esquerdo: resize diagonal */}
              <div
                onPointerDown={(e) => (window as any).__fioStartResize?.("wh")(e)}
                className="absolute left-0 top-0 z-30 h-3 w-3 cursor-nwse-resize"
                aria-hidden
              />
            </>
          )}
        </>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-card/50 px-3 py-2 pl-4">
        {headerContent}
      </div>

      {threadsBar}

      {/* Split layout adaptativo */}
      <div className="flex flex-1 min-h-0 min-w-0">
        <div
          className={cn(
            "flex flex-1 min-w-0 flex-col",
            canSideBySide && "max-w-[440px] flex-none border-r",
            showArtifactPane && artifactVisibleOnNarrow && !canSideBySide && "hidden",
          )}
        >
          {chatColumn}
        </div>

        {artifactColumn && (
          <div
            className={cn(
              "flex flex-1 min-w-0 flex-col",
              !canSideBySide && !artifactVisibleOnNarrow && "hidden",
            )}
          >
            {artifactColumn}
          </div>
        )}
      </div>
    </div>
  );
}

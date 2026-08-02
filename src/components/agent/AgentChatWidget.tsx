import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Copy, CornerDownLeft, GripVertical, Image as ImageIcon, MessageSquarePlus, PanelRightClose, PanelRightOpen, Plus, Trash2, X } from "lucide-react";
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
  PromptInputSubmit,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { InputGroupAddon } from "@/components/ui/input-group";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { FioAvatar } from "./FioAvatar";
import type { FioAnimationState, FioExpression } from "@/components/agent/FioAvatar";

/** Emite uma expressão temporária para o avatar do Fio. */
export function emitFioExpression(expression: FioExpression, duration = 1800) {
  window.dispatchEvent(
    new CustomEvent<{ expression: FioExpression; duration: number }>("fio:expression", {
      detail: { expression, duration },
    }),
  );
}

// Hook: escuta eventos globais para sincronizar o avatar do Fio com o status
// do chat mesmo quando o componente está fora do <ChatWindow>.
function useFioAnimationState(): { state: FioAnimationState; expression: FioExpression | undefined } {
  const [state, setState] = useState<FioAnimationState>("idle");
  const [expression, setExpression] = useState<FioExpression | undefined>(undefined);
  const idleTimer = useRef<number | null>(null);


  useEffect(() => {
    let respondingTimer: number | undefined;

    const resetIdleTimer = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      setExpression(undefined);
      idleTimer.current = window.setTimeout(() => {
        setExpression("descansando");
      }, 30000) as unknown as number; // 30s de inatividade -> descansando
    };

    const onThinking = (e: Event) => {
      const active = (e as CustomEvent<boolean>).detail;
      if (active) {
        window.clearTimeout(respondingTimer);
        setState("thinking");
        resetIdleTimer();
      } else {
        setState((s) => (s === "thinking" ? "idle" : s));
      }
    };

    const onResponse = (e: Event) => {
      const isSuccess = (e as CustomEvent<{ success?: boolean }>).detail?.success;
      setState("responding");
      if (isSuccess) setExpression("confirmando");
      
      window.clearTimeout(respondingTimer);
      respondingTimer = window.setTimeout(() => {
        setState("idle");
        setExpression(undefined);
        resetIdleTimer();
      }, 1600);
    };

    // Expressões pontuais: analisando (ferramenta), surpreso (erro),
    // feliz (resultado), curioso (usuário digitando), confirmando (sucesso).
    let exprTimer: number | undefined;
    const onExpression = (e: Event) => {
      const detail = (e as CustomEvent<{ expression: FioExpression; duration?: number }>).detail;
      if (!detail?.expression) return;
      window.clearTimeout(exprTimer);
      setExpression(detail.expression);
      exprTimer = window.setTimeout(() => {
        setExpression(undefined);
        resetIdleTimer();
      }, detail.duration ?? 1800);
    };

    window.addEventListener("fio:thinking", onThinking as EventListener);
    window.addEventListener("fio:response", onResponse as EventListener);
    window.addEventListener("fio:expression", onExpression as EventListener);

    resetIdleTimer();

    return () => {
      window.removeEventListener("fio:thinking", onThinking as EventListener);
      window.removeEventListener("fio:response", onResponse as EventListener);
      window.removeEventListener("fio:expression", onExpression as EventListener);
      window.clearTimeout(respondingTimer);
      window.clearTimeout(exprTimer);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, []);


  return { state, expression };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;


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
        body: {
          threadId,
        },
        fetch: async (url, options) => {
          const bodyText = options?.body as string || "{}";
          let parsedBody = {};
          try {
            parsedBody = JSON.parse(bodyText);
          } catch (e) {
            console.error("[fio] Erro ao parsear body do transport", e);
          }
          const mergedBody = { ...parsedBody, threadId };
          
          return fetch(url, {
            ...options,
            body: JSON.stringify(mergedBody),
          });
        },
      }),
    [accessToken, threadId],
  );

  const { messages, sendMessage, setMessages: setChatMessages, status, error } = useChat({
    id: threadId,
    messages: initialMessages as any,
    transport,
    onFinish: () => {
      window.dispatchEvent(new CustomEvent("fio:response", { detail: { success: true } }));
      window.dispatchEvent(new CustomEvent<boolean>("fio:thinking", { detail: false }));
    },
    onError: (err) => {
      console.error("[ai-agent] erro no chat", err);
    },
  });

  // Persistência contínua: grava no store a cada mudança (não apenas ao finalizar),
  // para que fechar/reabrir o painel durante o streaming não perca a resposta.
  useEffect(() => {
    setMessages(threadId, messages as UIMessage[]);
  }, [messages, threadId, setMessages]);

  // Flush final ao desmontar (troca de thread / fechamento do painel).
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  useEffect(() => {
    return () => {
      setMessages(threadId, messagesRef.current as UIMessage[]);
    };
  }, [threadId, setMessages]);

  useEffect(() => {
    composerRef.current?.focus();
  }, [threadId, status]);

  const registerFloatingWidget = useFloatingWidget((s) => s.register);

  // Extract all artifacts + widgets from message stream (deduped by id).
  useEffect(() => {
    let produced = false;
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      const parts = (m as UIMessage).parts ?? [];
      for (const part of parts) {
        if (part.type !== "text") continue;
        const { artifacts } = extractArtifacts(part.text);
        for (const a of artifacts) {
          onArtifact(a);
          produced = true;
        }
        const { widgets } = extractWidgets(part.text);
        for (const w of widgets) {
          registerFloatingWidget(w);
          produced = true;
        }
      }
    }
    // Resultado entregue -> expressão "feliz".
    if (produced) emitFioExpression("feliz", 2000);
  }, [messages, onArtifact, registerFloatingWidget]);

  // Ferramenta em execução -> expressão "analisando".
  const toolRunning = messages.some((m) =>
    ((m as UIMessage).parts ?? []).some((p: any) =>
      p.type?.startsWith("tool-") && (p.state === "input-streaming" || p.state === "input-available"),
    ),
  );
  useEffect(() => {
    if (toolRunning) emitFioExpression("analisando", 2500);
  }, [toolRunning]);


  /** Comandos locais (não vão para o modelo). */
  const runLocalCommand = (raw: string): boolean => {
    const cmd = raw.toLowerCase().replace(/^\//, "").trim();
    if (cmd === "limpar" || cmd === "clear") {
      setChatMessages([]);
      setMessages(threadId, []);
      return true;
    }
    if (cmd === "ajuda" || cmd === "help" || cmd === "comandos") {
      const help: UIMessage = {
        id: `help_${Date.now()}`,
        role: "assistant",
        parts: [{ type: "text", text: FIO_HELP_TEXT }],
      } as UIMessage;
      setChatMessages([...(messages as UIMessage[]), help]);
      return true;
    }
    return false;
  };

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = (msg.text ?? "").trim();
    if (!text || status === "streaming" || status === "submitted") return;
    if (text.startsWith("/") && runLocalCommand(text)) {
      setTimeout(() => composerRef.current?.focus(), 0);
      return;
    }
    if (messages.length === 0) setTitle(threadId, text);
    void sendMessage({ parts: [{ type: "text", text }] });
    setTimeout(() => composerRef.current?.focus(), 0);
  };

  const isLoading = status === "submitted" || status === "streaming";
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<boolean>("fio:thinking", { detail: isLoading }),
    );
  }, [isLoading]);

  // Captura erros silenciosos e exibe no chat
  useEffect(() => {
    if (error) {
      console.error("[fio] Erro detectado:", error);
      emitFioExpression("surpreso", 2500);
    }
  }, [error]);

  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasVisibleContent =
    lastMessage?.role === "assistant" &&
    (lastMessage.parts ?? []).some((part) => {
      if (part.type === "text") return part.text.trim().length > 0;
      if (part.type?.startsWith("tool-")) {
        const toolPart = part as any;
        return toolPart.state === "output-available" || toolPart.state === "output-error";
      }
      return false;
    });
  const showThinking = isLoading && !lastAssistantHasVisibleContent;

  // Modo "thinking": mostra a ferramenta/pesquisa em andamento, não só "Pensando…".
  const thinkingLabel = (() => {
    if (status === "submitted") return "Interpretando sua pergunta…";
    const running = lastMessage?.parts?.filter((p: any) => p.type?.startsWith("tool-")) ?? [];
    const active: any = [...running].reverse().find((p: any) => p.state !== "output-available" && p.state !== "output-error");
    const target = active ?? running[running.length - 1];
    if (target) {
      const name = String((target as any).type).replace(/^tool-/, "").replace(/_/g, " ");
      return `Consultando ${name}…`;
    }
    return "Pensando…";
  })();

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<FioAvatar size={72} state={isLoading ? "thinking" : "idle"} expression={isLoading ? "pensando" : undefined} />}
              title="Fio · Assistente do Pente Fino"
              description="Sou o Fio. Pergunte sobre itens, transferências, saldo do estoque, movimentações e mais. Digite /ajuda para ver os comandos disponíveis."
            />
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
              <MessageContent
                className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent"}
              >
                {(m.parts ?? []).map((part, i) => {
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
                              void sendMessage({ parts: [{ type: "text", text: formatted }] }).then(() => {
                                window.dispatchEvent(new CustomEvent("fio:response", { detail: { success: true } }));
                              })

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
                              void sendMessage({ parts: [{ type: "text", text }] }).then(() => {
                                window.dispatchEvent(new CustomEvent("fio:response", { detail: { success: true } }));
                              })

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
                <div className="flex items-center gap-2">
                  <span className="flex items-end gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  </span>
                  <Shimmer>{thinkingLabel}</Shimmer>
                </div>
              </MessageContent>
            </Message>
          )}
          {error && (
            <div className="mx-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error.message?.includes("Failed to fetch") 
                ? "ainda apresenta o mesmo erro"
                : error.message?.includes("IA indisponíveis")


                ? "Sistemas de IA indisponíveis no momento. Vou te passar as chaves e vc configura no supabase pra mim."
                : `Erro: ${error.message}`}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <DockedWidgetBar
        disabled={isLoading}
        onSend={(text) => void sendMessage({ parts: [{ type: "text", text }] })}
      />

      <div
        className={cn(
          "p-2",
          // Suprime o focus-ring do InputGroup (aplicado via has-[...]:ring-1),
          // que era recortado pelo overflow-hidden do painel e aparecia como
          // linha vertical entre a textarea e o botão de envio.
          "[&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-0",
        )}
      >
        <PromptInput onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <PromptInputTextarea
              ref={composerRef}
              placeholder="Pergunte algo ao Fio…"
              onFocus={() => emitFioExpression("curioso", 1500)}
            />

            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" title="Anexar">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem>
                      <PromptInputActionAddAttachments label="Fotos/Arquivos" />
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <PromptInputActionAddScreenshot label="Capturar tela" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <PromptInputSubmit status={status} disabled={isLoading} />
            </div>
          </div>
        </PromptInput>
      </div>
    </div>
  );
}

const FIO_HELP_TEXT = `🧭 **Comandos do Fio**

| Comando | O que faz |
| --- | --- |
| \`/ajuda\` · \`/comandos\` | Mostra esta lista |
| \`/limpar\` · \`/clear\` | Limpa a conversa atual |

ℹ️ Além dos comandos, é só perguntar em linguagem natural — ex.: *"saldo do TC.000.033"*, *"últimas transferências do depósito 01"*, *"onde está o lote TEC02.A.N03"*, *"quais acabamentos usam o item X"*.

> Pergunte **"o que você pode fazer?"** para ver todas as capacidades liberadas para o seu perfil.`;

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

  const { state: fioState, expression: fioExpr } = useFioAnimationState();

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Abrir Fio (assistente de IA)"
          onClick={() => toggleOpen(true)}
          className="group fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 hover:shadow-2xl tablet-landscape:bottom-6 desktop:bottom-6"
        >
          <div className="relative h-full w-full">
            <FioAvatar
              size={56}
              state={fioState}
              expression={fioExpr}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105"
            />
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
              <FioAvatar size={28} state={fioState} expression={fioExpr} hoverOnEnter={false} />
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
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : null
          }
        >
          <div className="relative flex flex-1 min-h-0 overflow-hidden">
            <ChatWindow
              threadId={activeId!}
              onArtifact={registerArtifact}
              activeArtifactId={activeArtifactId}
              onSelectArtifact={handleSelectArtifact}
            />
            {showArtifactPane && activeArtifact && (
              <ArtifactPanel
                spec={activeArtifact}
                onClose={() => setActiveArtifactId(null)}
              />
            )}

          </div>
        </ChatPanelShell>
      )}
    </>
  );
}

function SidebarModeToggle() {
  const { mode, toggleMode } = useChatPanel();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => toggleMode()}
      title={mode === "sidebar" ? "Flutuar painel" : "Fixar na lateral"}
    >
      {mode === "sidebar" ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
    </Button>
  );
}


function ChatPanelShell({
  children,
  headerContent,
  threadsBar,
  showArtifactPane,
  panelRef,
}: {
  children: React.ReactNode;
  headerContent: React.ReactNode;
  threadsBar: React.ReactNode;
  showArtifactPane: boolean;
  panelRef: React.RefObject<HTMLDivElement>;
}) {
  const { mode } = useChatPanel();
  const isDocked = mode === "sidebar";


  return (
    <div
      ref={panelRef}
      className={cn(
        "z-50 flex flex-col border-border bg-background shadow-2xl transition-all duration-300 ease-in-out",
        isDocked
          ? "fixed inset-y-0 right-0 w-full md:w-[400px] lg:w-[450px] border-l"
          : "fixed bottom-4 right-4 top-4 w-[calc(100%-2rem)] md:w-[450px] rounded-2xl border",
        showArtifactPane && "md:w-[90%] lg:w-[85%] xl:w-[80%]",
      )}
    >
      <div className="flex h-12 items-center gap-2 border-b px-3 shrink-0">
        {headerContent}
      </div>
      {threadsBar}
      {children}
    </div>
  );
}

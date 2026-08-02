import { useState, useRef, useEffect } from "react";
import { Send, User, MessageSquare } from "lucide-react";
import { useTeamChat } from "@/hooks/use-team-chat";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TeamChatPanel() {
  const { user } = useAuth();
  const { messages, sendMessage, loading } = useTeamChat();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs">Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background/50 backdrop-blur-sm">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
              <p className="text-[11px]">Comece a conversa com sua equipe!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const date = new Date(msg.created_at);
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {msg.sender?.display_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                    {!isMe && (
                      <span className="text-[10px] font-bold text-muted-foreground/80 px-1">
                        {msg.sender?.display_name || "Usuário"}
                      </span>
                    )}
                    
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm shadow-sm",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card border border-border/40 text-card-foreground rounded-tl-none"
                      )}
                    >
                      {msg.content}
                    </div>
                    
                    <span className="text-[9px] text-muted-foreground/60 px-1">
                      {format(date, "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2 bg-muted/30 rounded-full pl-4 pr-1 py-1 ring-1 ring-border/40 focus-within:ring-primary/40 transition-shadow">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Mensagem para o time..."
            className="flex-1 bg-transparent border-none outline-none text-sm py-1.5 placeholder:text-muted-foreground/50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="rounded-full h-8 w-8 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smile, Paperclip, MoreVertical, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuickChat } from "@/lib/quick-chat";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgentThreads } from '@/store/useAgentThreads';

interface QuickChatDialogProps {
  receiver: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickChatDialog({ receiver, open, onOpenChange }: QuickChatDialogProps) {
  const { user } = useAuth();
  const { messages, sendMessage, sendTyping, typing, editMessage, deleteMessage } = useQuickChat(receiver.id);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toggleOpen, newThread, setMessages: setAgentMessages } = useAgentThreads();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(content);
    setContent("");
    sendTyping(false);
  };

  const handleEdit = (id: string, newContent: string) => {
    editMessage(id, newContent);
    setEditingId(null);
  };

  const isTyping = typing[receiver.id];

  const handleCallFio = () => {
    // Convoca o FIO no chat (abre o painel do FIO com contexto da conversa)
    toggleOpen(true);
    newThread();
    // Simula contexto
    const context = `[Contexto de Chat com ${receiver.display_name}]: ${messages.slice(-5).map(m => m.content).join(' | ')}`;
    // Apenas informativo, o usuário agora pode perguntar ao FIO
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden flex flex-col h-[600px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="p-4 border-b border-border/40 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                {receiver.avatar_url ? (
                  <img src={receiver.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary">{receiver.display_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <DialogTitle className="text-base">{receiver.display_name}</DialogTitle>
                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  {isTyping ? (
                    <span className="text-emerald-500 animate-pulse">Digitando...</span>
                  ) : (
                    <span>Chat Rápido</span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCallFio} title="Convocar FIO">
              <ShieldAlert className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const isEditing = editingId === msg.id;

              return (
                <div key={msg.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                  <div className={cn(
                    "group relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    isMine ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
                  )}>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={editContent} 
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-7 text-xs bg-background/20 border-none text-inherit focus-visible:ring-0"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(msg.id, editContent)}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="break-words">{msg.content}</div>
                        {msg.is_edited && <span className="text-[9px] opacity-70 mt-1 block italic text-right">editado</span>}
                      </>
                    )}

                    {isMine && !isEditing && (
                      <div className="absolute top-0 right-full mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}>
                              <Pencil className="w-3 h-3 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMessage(msg.id)}>
                              <Trash2 className="w-3 h-3 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border/40 bg-muted/20">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="relative flex-1">
              <Input
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  sendTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Mensagem instantânea..."
                className="h-9 pr-8 bg-background/50 border-border/40 focus-visible:ring-primary/30"
              />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!content.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[9px] text-center text-muted-foreground/60 mt-2 italic">
            Chat temporário — histórico é limpo a cada 5 dias.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

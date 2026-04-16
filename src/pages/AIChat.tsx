import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

const AIChat = () => {
  const { user, profile, setProfile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("ai_chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      
      if (data) {
        const typedData = data.map(m => ({
          ...m,
          role: m.role as 'user' | 'assistant'
        }));
        setMessages(typedData);
      }
    };
    fetchHistory();
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user?.id) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from("ai_chat_history")
        .insert({ user_id: user.id, message: userMessage, role: "user" })
        .select()
        .single();
      
      if (userError) throw userError;
      setMessages((prev) => [...prev, { ...userData, role: userData.role as 'user' | 'assistant' }]);

      setTimeout(async () => {
        const aiResponse = `Entendido! Configurei sua regra: "${userMessage}". Esta preferência foi salva nas suas Configurações Pessoais.`;
        
        const { data: aiData, error: aiError } = await supabase
          .from("ai_chat_history")
          .insert({ user_id: user.id, message: aiResponse, role: "assistant" })
          .select()
          .single();
        
        if (aiError) throw aiError;
        setMessages((prev) => [...prev, { ...aiData, role: aiData.role as 'user' | 'assistant' }]);

        const newRules = profile?.ai_customization_rules 
          ? `${profile.ai_customization_rules}; ${userMessage}` 
          : userMessage;
        
        await supabase.from("profiles").update({ ai_customization_rules: newRules }).eq("id", user.id);
        setProfile({ ...profile, ai_customization_rules: newRules });
        
        setLoading(false);
      }, 1500);

    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)]">
      <Card className="h-full flex flex-col border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Customização com IA
          </CardTitle>
          <p className="text-xs opacity-80">
            Diga como você quer receber seus relatórios (ex: "Quero receber apenas erros graves nas sextas às 18h").
          </p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar className="h-8 w-8">
                {msg.role === "user" ? (
                  <>
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                )}
              </Avatar>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </CardContent>
        <CardFooter className="p-4 border-t bg-muted/20">
          <form onSubmit={handleSend} className="flex w-full gap-2">
            <Input
              placeholder="Digite sua preferência..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-background"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIChat;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface TeamMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useTeamChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('team_messages' as any)
        .select('*, sender:profiles(display_name, avatar_url)')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages((data as any[]) || []);
    } catch (err: any) {
      console.error('[team-chat] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('team_messages' as any)
        .insert({
          sender_id: user.id,
          content: content.trim()
        });

      if (error) {
        console.error('[team-chat] Supabase error:', error);
        throw error;
      }
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem.');
      console.error('[team-chat] Error sending message:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('team-chat-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages' },
        async (payload) => {
          // Fetch the full message with sender details
          const { data, error } = await supabase
            .from('team_messages' as any)
            .select('*, sender:profiles(display_name, avatar_url)')
            .eq('id', payload.new.id)
            .single();
          
          if (!error && data) {
            setMessages((prev) => [...prev, data as any]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { messages, sendMessage, loading, fetchMessages };
}

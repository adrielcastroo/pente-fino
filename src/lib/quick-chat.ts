
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
}

export interface TypingStatus {
  user_id: string;
  is_typing: boolean;
}

export function useQuickChat(receiverId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  const channelName = useMemo(() => {
    const ids = [user?.id, receiverId].sort();
    return `quick-chat:${ids.join(':')}`;
  }, [user?.id, receiverId]);

  useEffect(() => {
    if (!user || !receiverId) return;

    // Load initial messages from database (simulated here with a 5-day expiration logic)
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('quick_chats' as any)
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as unknown as Message[]);
      }
    };

    loadMessages();

    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTyping(prev => ({ ...prev, [payload.user_id]: payload.is_typing }));
      })
      .on('broadcast', { event: 'edit' }, ({ payload }) => {
        setMessages(prev => prev.map(m => m.id === payload.id ? { ...m, ...payload } : m));
      })
      .on('broadcast', { event: 'delete' }, ({ payload }) => {
        setMessages(prev => prev.filter(m => m.id !== payload.id));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, user?.id, receiverId]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !channelRef.current || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    });

    setMessages(prev => [...prev, message]);

    // Save to DB (Edge Function or direct depending on schema)
    await supabase.from('quick_chats' as any).insert({
      ...message,
      receiver_id: receiverId
    });
  };

  const sendTyping = (isTyping: boolean) => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, is_typing: isTyping }
    });
  };

  const editMessage = async (id: string, newContent: string) => {
     if (!channelRef.current) return;
     const update = { id, content: newContent, is_edited: true, updated_at: new Date().toISOString() };
     await channelRef.current.send({
       type: 'broadcast',
       event: 'edit',
       payload: update
     });
     setMessages(prev => prev.map(m => m.id === id ? { ...m, ...update } : m));
     await supabase.from('quick_chats' as any).update(update).eq('id', id);
  };

  const deleteMessage = async (id: string) => {
     if (!channelRef.current) return;
     await channelRef.current.send({
       type: 'broadcast',
       event: 'delete',
       payload: { id }
     });
     setMessages(prev => prev.filter(m => m.id !== id));
     await supabase.from('quick_chats' as any).delete().eq('id', id);
  };

  return { messages, sendMessage, sendTyping, typing, editMessage, deleteMessage };
}

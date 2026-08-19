import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation, Message } from '@/types';

function ChatPage() {
  const { profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.id) return;

    // Get or create conversation
    supabase
      .from('conversations')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setConversation(data as Conversation);
          fetchMessages(data.id);
        } else {
          supabase
            .from('conversations')
            .insert({ user_id: profile.id })
            .select()
            .maybeSingle()
            .then(({ data: newConv }) => {
              if (newConv) {
                setConversation(newConv as Conversation);
                setLoading(false);
              }
            });
        }
      });

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || !profile) return;
    const msg = newMessage.trim();
    setNewMessage('');

    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: profile.id,
        content: msg,
      })
      .select()
      .maybeSingle();

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="size-7" />
          Chat
        </h1>
        <p className="text-muted-foreground mt-1">Admin bilan muloqot</p>
      </div>

      <Card className="h-[60vh] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Yuklanmoqda...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="size-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Hali xabarlar yo'q. Birinchi xabar yuboring!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === profile?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-4 flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Xabar yozing..."
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon">
              <Send className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChatPage;

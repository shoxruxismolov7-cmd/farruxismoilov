import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation, Message, Profile } from '@/types';

function AdminChatPage() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<(Conversation & { profiles: Profile | null })[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel('admin_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.conversation_id === selectedConv) {
          setMessages((prev) => [...prev, newMsg]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*, profiles!conversations_user_id_fkey(*)')
      .order('last_message_at', { ascending: false });
    setConversations((data || []) as unknown as (Conversation & { profiles: Profile | null })[]);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
  };

  useEffect(() => {
    if (selectedConv) fetchMessages(selectedConv);
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || !profile) return;
    const msg = newMessage.trim();
    setNewMessage('');

    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConv,
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
        .eq('id', selectedConv);
    }
  };

  const filteredConvs = conversations.filter((c) =>
    !search || c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const selected = conversations.find((c) => c.id === selectedConv);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="size-7" />
          Chat
        </h1>
        <p className="text-muted-foreground mt-1">Foydalanuvchilar bilan muloqot</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
        {/* Conversations list */}
        <Card className="md:col-span-1 flex flex-col">
          <CardContent className="p-3 flex-1 flex flex-col">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredConvs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Suhablar yo'q</p>
              ) : (
                filteredConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedConv === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="text-xs">
                        {(conv.profiles?.full_name || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.profiles?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(conv.last_message_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 flex flex-col">
          <CardContent className="p-0 flex-1 flex flex-col">
            {selected ? (
              <>
                <div className="p-4 border-b border-border">
                  <p className="font-medium">{selected.profiles?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{selected.profiles?.email}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="size-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Suhbatni tanlang</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminChatPage;

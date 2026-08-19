import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function AdminNotificationsPage() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Sarlavha kiriting');
      return;
    }
    setSending(true);

    if (audience === 'all') {
      const { error } = await supabase.from('notifications').insert({
        audience: 'all',
        title,
        message,
        type,
      });
      if (error) {
        toast.error('Xatolik yuz berdi');
      } else {
        toast.success('Bildirishnoma yuborildi');
        setTitle(''); setMessage('');
      }
    } else if (audience === 'premium') {
      const { error } = await supabase.from('notifications').insert({
        audience: 'premium',
        title,
        message,
        type,
      });
      if (error) {
        toast.error('Xatolik yuz berdi');
      } else {
        toast.success('Premium foydalanuvchilarga yuborildi');
        setTitle(''); setMessage('');
      }
    }

    await supabase.from('audit_logs').insert({
      actor_id: profile?.id,
      action: 'notification_sent',
      target_type: 'notification',
      details: { audience, title, type },
    });

    setSending(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Bell className="size-7" />
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1">Foydalanuvchilarga bildirishnoma yuborish</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Yangi bildirishnoma</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sarlavha</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bildirishnoma sarlavhasi" />
          </div>
          <div className="space-y-2">
            <Label>Xabar</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Xabar matni..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Auditoriya</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha foydalanuvchilar</SelectItem>
                  <SelectItem value="premium">Premium foydalanuvchilar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turi</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full md:w-auto">
            <Send className="size-4 mr-1" />
            {sending ? 'Yuborilmoqda...' : 'Yuborish'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminNotificationsPage;

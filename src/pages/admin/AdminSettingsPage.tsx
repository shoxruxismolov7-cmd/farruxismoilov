import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings, Save, CreditCard, Building, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function AdminSettingsPage() {
  const { profile } = useAuth();
  const [cardNumber, setCardNumber] = useState('');
  const [cardOwner, setCardOwner] = useState('');
  const [bankName, setBankName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [supportTelegram, setSupportTelegram] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('platform_settings').select('*').eq('key', 'payment_details').maybeSingle().then(({ data }) => {
        if (data) {
          const v = data.value as Record<string, string>;
          setCardNumber(v.card_number || '');
          setCardOwner(v.card_owner || '');
          setBankName(v.bank_name || '');
          setInstructions(v.instructions || '');
        }
      }),
      supabase.from('platform_settings').select('*').eq('key', 'platform_info').maybeSingle().then(({ data }) => {
        if (data) {
          const v = data.value as Record<string, string>;
          setPlatformName(v.name || '');
          setSupportTelegram(v.support_telegram || '');
          setContactEmail(v.contact_email || '');
        }
      }),
    ]).then(() => setLoading(false));
  }, []);

  const handleSavePayment = async () => {
    setSaving(true);
    const value = { card_number: cardNumber, card_owner: cardOwner, bank_name: bankName, instructions };
    const { error } = await supabase
      .from('platform_settings')
      .update({ value })
      .eq('key', 'payment_details');
    setSaving(false);
    if (error) toast.error('Xatolik');
    else toast.success('To\'lov ma\'lumotlari saqlandi');
  };

  const handleSavePlatform = async () => {
    setSaving(true);
    const value = { name: platformName, support_telegram: supportTelegram, contact_email: contactEmail };
    const { error } = await supabase
      .from('platform_settings')
      .update({ value })
      .eq('key', 'platform_info');
    setSaving(false);
    if (error) toast.error('Xatolik');
    else toast.success('Platforma ma\'lumotlari saqlandi');
  };

  if (loading) {
    return <div className="p-8 max-w-4xl mx-auto"><div className="h-64 rounded-xl bg-muted animate-pulse" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Settings className="size-7" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Platforma sozlamalari</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            To'lov rekvizitlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Karta raqami</Label>
              <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="8600 1234 5678 9012" />
            </div>
            <div className="space-y-2">
              <Label>Karta egasi</Label>
              <Input value={cardOwner} onChange={(e) => setCardOwner(e.target.value)} placeholder="Platform Admin" />
            </div>
            <div className="space-y-2">
              <Label>Bank nomi</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Kapitalbank" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>To'lov ko'rsatmalari</Label>
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="To'lov qilish bo'yicha ko'rsatmalar..." />
          </div>
          <Button onClick={handleSavePayment} disabled={saving}>
            <Save className="size-4 mr-1" />
            Saqlash
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Platforma ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platforma nomi</Label>
              <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} placeholder="PrepMaster" />
            </div>
            <div className="space-y-2">
              <Label>Telegram qo'llab-quvvatlash</Label>
              <Input value={supportTelegram} onChange={(e) => setSupportTelegram(e.target.value)} placeholder="@support" />
            </div>
            <div className="space-y-2">
              <Label>Aloqa emaili</Label>
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="support@prepmaster.uz" />
            </div>
          </div>
          <Button onClick={handleSavePlatform} disabled={saving}>
            <Save className="size-4 mr-1" />
            Saqlash
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSettingsPage;

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Upload, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SubscriptionPlan, PaymentApplication } from '@/types';
import { toast } from 'sonner';

function PaymentPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const billingCycle = searchParams.get('cycle') as 'monthly' | 'yearly' || 'monthly';
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string> | null>(null);
  const [applications, setApplications] = useState<PaymentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      planId
        ? supabase.from('subscription_plans').select('*').eq('id', planId).maybeSingle().then(({ data }) => data as SubscriptionPlan | null)
        : Promise.resolve(null),
      supabase.from('platform_settings').select('*').eq('key', 'payment_details').maybeSingle().then(({ data }) => {
        if (data) return data.value as Record<string, string>;
        return null;
      }),
      profile?.id
        ? supabase.from('payment_applications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => (data || []) as PaymentApplication[])
        : Promise.resolve([]),
    ]).then(([p, pd, apps]) => {
      setPlan(p);
      setPaymentDetails(pd);
      setApplications(apps);
      setLoading(false);
    });
  }, [planId, profile?.id]);

  const amount = plan ? (billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly) : 0;

  const handleSubmit = async () => {
    if (!profile || !plan) return;
    if (!transactionId.trim()) {
      toast.error('Transaction ID ni kiriting');
      return;
    }
    setSubmitting(true);

    let receiptUrl: string | null = null;
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop();
      const fileName = `receipts/${profile.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);
      if (uploadError) {
        toast.error('Chek rasmini yuklashda xatolik');
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
      receiptUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('payment_applications').insert({
      user_id: profile.id,
      plan_id: plan.id,
      plan_name: plan.name,
      amount,
      payment_method: 'bank_card',
      transaction_id: transactionId,
      receipt_url: receiptUrl,
      status: 'pending',
    });

    setSubmitting(false);
    if (error) {
      toast.error('Xatolik yuz berdi');
    } else {
      toast.success('To\'lov arizasi yuborildi! Admin tasdiqlashini kuting.');
      setTransactionId('');
      setReceiptFile(null);
      supabase
        .from('payment_applications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setApplications((data || []) as PaymentApplication[]));
    }
  };

  if (loading) {
    return <div className="p-8 max-w-4xl mx-auto"><div className="h-64 rounded-xl bg-muted animate-pulse" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CreditCard className="size-7" />
          To'lov
        </h1>
        <p className="text-muted-foreground mt-1">Obuna uchun to'lov amalga oshiring</p>
      </div>

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>Tanlangan reja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{billingCycle === 'monthly' ? 'Oylik' : 'Yillik'} obuna</p>
              </div>
              <p className="text-2xl font-bold">{new Intl.NumberFormat('uz-UZ').format(amount)} so'm</p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentDetails && (
        <Card>
          <CardHeader>
            <CardTitle>To'lov rekvizitlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bank</span>
                <span className="font-medium">{paymentDetails.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Karta raqami</span>
                <span className="font-mono font-medium">{paymentDetails.card_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Karta egasi</span>
                <span className="font-medium">{paymentDetails.card_owner}</span>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <p className="text-sm font-medium mb-1">Ko'rsatmalar:</p>
              <p className="text-sm text-muted-foreground">{paymentDetails.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>To'lov tasdiqlash</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="To'lov chekidagi transaction ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt">Chek rasmi</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="receipt" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="size-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {receiptFile ? receiptFile.name : 'Chek rasmini yuklang'}
                </span>
              </label>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !plan} className="w-full">
            {submitting ? 'Yuborilmoqda...' : 'Arizani yuborish'}
          </Button>
        </CardContent>
      </Card>

      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arizalar tarixi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">{app.plan_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()} • {new Intl.NumberFormat('uz-UZ').format(app.amount)} so'm
                    </p>
                  </div>
                  <Badge
                    variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}
                    className="capitalize gap-1"
                  >
                    {app.status === 'approved' && <CheckCircle className="size-3" />}
                    {app.status === 'pending' && <Clock className="size-3" />}
                    {app.status === 'rejected' && <XCircle className="size-3" />}
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!plan && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Reja tanlanmadi.</p>
          <Button asChild>
            <Link to="/dashboard/subscription">Reja tanlash</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default PaymentPage;

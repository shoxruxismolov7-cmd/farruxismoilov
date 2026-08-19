import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { PaymentApplication, Profile } from '@/types';
import { toast } from 'sonner';

function AdminPaymentsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<(PaymentApplication & { profiles: Profile | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payment_applications')
      .select('*, profiles!payment_applications_user_id_fkey(*)')
      .order('created_at', { ascending: false });
    setPayments((data || []) as unknown as (PaymentApplication & { profiles: Profile | null })[]);
    setLoading(false);
  };

  const handleApprove = async (payment: PaymentApplication) => {
    setProcessing(true);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await supabase.from('payment_applications').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile?.id,
    }).eq('id', payment.id);

    await supabase.from('subscriptions').insert({
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      plan_name: payment.plan_name,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
    });

    await supabase.from('notifications').insert({
      user_id: payment.user_id,
      title: 'To\'lov tasdiqlandi',
      message: `Sizning ${payment.plan_name} obunangiz faollashtirildi!`,
      type: 'success',
    });

    await supabase.from('audit_logs').insert({
      actor_id: profile?.id,
      action: 'payment_approved',
      target_type: 'payment',
      target_id: payment.id,
      details: { plan_name: payment.plan_name, amount: payment.amount },
    });

    setProcessing(false);
    toast.success('To\'lov tasdiqlandi');
    setSelectedPayment(null);
    fetchPayments();
  };

  const handleReject = async (payment: PaymentApplication) => {
    if (!rejectReason.trim()) {
      toast.error('Rad etish sababini kiriting');
      return;
    }
    setProcessing(true);

    await supabase.from('payment_applications').update({
      status: 'rejected',
      reject_reason: rejectReason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile?.id,
    }).eq('id', payment.id);

    await supabase.from('notifications').insert({
      user_id: payment.user_id,
      title: 'To\'lov rad etildi',
      message: `To'lov arizangiz rad etildi. Sabab: ${rejectReason}`,
      type: 'warning',
    });

    await supabase.from('audit_logs').insert({
      actor_id: profile?.id,
      action: 'payment_rejected',
      target_type: 'payment',
      target_id: payment.id,
      details: { reason: rejectReason },
    });

    setProcessing(false);
    toast.success('To\'lov rad etildi');
    setSelectedPayment(null);
    setRejectReason('');
    fetchPayments();
  };

  const selected = payments.find((p) => p.id === selectedPayment);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CreditCard className="size-7" />
          Payments
        </h1>
        <p className="text-muted-foreground mt-1">To'lov arizalarini boshqarish</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Hozircha to'lov arizalari yo'q.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{payment.profiles?.full_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{payment.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">{payment.plan_name}</p>
                      <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('uz-UZ').format(payment.amount)} so'm</p>
                    </div>
                    <Badge variant={payment.status === 'approved' ? 'default' : payment.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                      {payment.status}
                    </Badge>
                    {payment.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedPayment(payment.id)}>
                        Ko'rish
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {new Date(payment.created_at).toLocaleString()}
                  {payment.transaction_id && ` • Transaction: ${payment.transaction_id}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedPayment(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-xl font-bold">To'lov ma'lumotlari</h2>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Foydalanuvchi:</span><span className="font-medium">{selected.profiles?.full_name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Email:</span><span className="font-medium">{selected.profiles?.email}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Reja:</span><span className="font-medium">{selected.plan_name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Summa:</span><span className="font-medium">{new Intl.NumberFormat('uz-UZ').format(selected.amount)} so'm</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Transaction ID:</span><span className="font-mono text-sm">{selected.transaction_id || '—'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Sana:</span><span className="font-medium">{new Date(selected.created_at).toLocaleString()}</span></div>
              </div>
              {selected.receipt_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Chek rasmi:</p>
                  <img src={selected.receipt_url} alt="Receipt" className="w-full rounded-lg border border-border" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rad etish sababi (agar rad etilsa):</label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Sababni kiriting..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleApprove(selected)} disabled={processing} className="flex-1">
                  <Check className="size-4 mr-1" />
                  Tasdiqlash
                </Button>
                <Button onClick={() => handleReject(selected)} disabled={processing} variant="destructive" className="flex-1">
                  <X className="size-4 mr-1" />
                  Rad etish
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setSelectedPayment(null)}>
                Yopish
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentsPage;

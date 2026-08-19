import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Crown, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SubscriptionPlan, Subscription } from '@/types';
import { toast } from 'sonner';

function SubscriptionPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('order', { ascending: true }).then(({ data }) => (data || []) as SubscriptionPlan[]),
      supabase.from('subscriptions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => data as Subscription | null),
    ]).then(([p, s]) => {
      setPlans(p);
      setSubscription(s);
      setLoading(false);
    });
  }, [profile?.id]);

  const formatPrice = (n: number) => {
    if (n === 0) return 'Bepul';
    return new Intl.NumberFormat('uz-UZ').format(n) + ' so\'m';
  };

  const handleChoosePlan = (plan: SubscriptionPlan) => {
    if (plan.name === 'Free') {
      toast.info('Siz allaqachon bepul rejedasiz');
      return;
    }
    navigate(`/dashboard/payment?plan=${plan.id}&cycle=${billingCycle}`);
  };

  const planIcons: Record<string, typeof Star> = { Free: Star, Premium: Crown, Pro: Crown };

  if (loading) {
    return <div className="p-8 max-w-4xl mx-auto"><div className="h-64 rounded-xl bg-muted animate-pulse" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CreditCard className="size-7" />
          Subscription
        </h1>
        <p className="text-muted-foreground mt-1">Obuna rejangizni boshqaring</p>
      </div>

      {subscription && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Joriy obuna</p>
                <p className="text-xl font-bold capitalize">{subscription.plan_name}</p>
                <p className="text-sm text-muted-foreground">
                  Status: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'} className="capitalize">{subscription.status}</Badge>
                </p>
              </div>
              {subscription.end_date && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tugaydi</p>
                  <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
        >
          Oylik
        </button>
        <button
          onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
        >
          Yillik
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => {
          const isPopular = i === 1;
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const Icon = planIcons[plan.name] || Star;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-background p-6 ${isPopular ? 'border-primary shadow-lg md:scale-105' : 'border-border'}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Eng mashhur
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Icon className="size-5 text-primary" />
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold">{formatPrice(price)}</span>
                {price > 0 && (
                  <span className="text-sm text-muted-foreground ml-1">/{billingCycle === 'monthly' ? 'oy' : 'yil'}</span>
                )}
              </div>
              <Button
                className="w-full mb-6"
                variant={isPopular ? 'default' : 'outline'}
                onClick={() => handleChoosePlan(plan)}
              >
                {plan.name === 'Free' ? 'Joriy reja' : 'Tanlash'}
              </Button>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="size-4 text-success mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SubscriptionPage;

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, FileText, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    pendingPayments: 0,
    totalExams: 0,
    examsCompleted: 0,
    activeSubscriptions: 0,
  });
  const [userGrowth, setUserGrowth] = useState<Array<{ date: string; count: number }>>([]);
  const [examActivity, setExamActivity] = useState<Array<{ date: string; count: number }>>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => count || 0),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).neq('plan_name', 'free').eq('status', 'active').then(({ count }) => count || 0),
      supabase.from('payment_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending').then(({ count }) => count || 0),
      supabase.from('exams').select('id', { count: 'exact', head: true }).then(({ count }) => count || 0),
      supabase.from('results').select('id', { count: 'exact', head: true }).then(({ count }) => count || 0),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').then(({ count }) => count || 0),
    ]).then(([totalUsers, premiumUsers, pendingPayments, totalExams, examsCompleted, activeSubs]) => {
      setStats({
        totalUsers,
        premiumUsers,
        pendingPayments,
        totalExams,
        examsCompleted,
        activeSubscriptions: activeSubs,
      });
    });

    // User growth (last 7 days)
    supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) {
          const last7: Array<{ date: string; count: number }> = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            const count = data.filter((p: { created_at: string }) =>
              new Date(p.created_at).toDateString() === d.toDateString()
            ).length;
            last7.push({ date: dateStr, count });
          }
          setUserGrowth(last7);
        }
      });

    // Exam activity
    supabase
      .from('results')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) {
          const last7: Array<{ date: string; count: number }> = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            const count = data.filter((r: { created_at: string }) =>
              new Date(r.created_at).toDateString() === d.toDateString()
            ).length;
            last7.push({ date: dateStr, count });
          }
          setExamActivity(last7);
        }
      });
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: Award, color: 'text-warning' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: 'text-destructive' },
    { label: 'Total Exams', value: stats.totalExams, icon: FileText, color: 'text-success' },
    { label: 'Exams Completed', value: stats.examsCompleted, icon: CheckCircle, color: 'text-primary' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: TrendingUp, color: 'text-success' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platforma statistikasi</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-4">
              <card.icon className={`size-5 ${card.color} mb-2`} />
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>User Growth (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Exam Activity (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={examActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboardPage;

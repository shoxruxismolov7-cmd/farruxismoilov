import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import {
  BookOpen,
  TrendingUp,
  FileText,
  Mic,
  Headphones,
  PenLine,
  BarChart3,
  LayoutDashboard,
  Check,
  ChevronDown,
  GraduationCap,
  Target,
  Award,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    is_active: boolean;
    order: number;
  }>>([]);
  const [stats, setStats] = useState({ students: 0, exams: 0, mockCompleted: 0, avgImprovement: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .then(({ data }) => {
        if (data) setPlans(data);
      });

    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        setStats((s) => ({ ...s, students: count ?? 0 }));
      });

    supabase
      .from('exams')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .then(({ count }) => {
        setStats((s) => ({ ...s, exams: count ?? 0 }));
      });

    supabase
      .from('results')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        setStats((s) => ({ ...s, mockCompleted: count ?? 0 }));
      });
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Real Exam Experience',
      description: 'IELTS va Multilevel formatlariga yaqin exam interface. Real imtihon muhitida mashq qiling.',
    },
    {
      icon: TrendingUp,
      title: 'Smart Progress',
      description: "O'quvchi progressini kuzatadi va zaif tomonlarni aniqlaydi.",
    },
    {
      icon: FileText,
      title: 'Mock Exams',
      description: "To'liq mock exam. Real imtihon kabi tajriba oling.",
    },
    {
      icon: PenLine,
      title: 'Vocabulary',
      description: 'IELTS vocabulary practice. O\'zbekcha tarjima bilan.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Results',
      description: 'Section-by-section analytics. Har bir skill bo\'yicha batafsil natijalar.',
    },
    {
      icon: LayoutDashboard,
      title: 'Personal Dashboard',
      description: "O'quvchi barcha natijalarini bir joyda ko'radi.",
    },
  ];

  const steps = [
    { icon: GraduationCap, title: 'Create account', description: 'Tez va oson ro\'yxatdan o\'ting' },
    { icon: Target, title: 'Choose your goal', description: 'IELTS yoki Multilevel - maqsadingizni tanlang' },
    { icon: FileText, title: 'Take a mock exam', description: 'Real exam formatida mashq qiling' },
    { icon: Award, title: 'Improve your score', description: 'Zaif tomonlarni aniqlab, natijani oshiring' },
  ];

  const faqs = [
    {
      q: 'PrepMaster nima?',
      a: 'PrepMaster - IELTS va O\'zbekiston Multilevel/CEFR imtihonlariga tayyorlanayotgan o\'quvchilar uchun professional platforma. Real exam formatidagi mock testlar, vocabulary practice va batafsil analytics bilan tayyorgarlik ko\'ring.',
    },
    {
      q: 'Platformadan qanday foydalanaman?',
      a: 'Ro\'yxatdan o\'ting, maqsadingizni tanlang, onboarding savollariga javob bering va dashboard orqali mashqlarni boshlang. Bepul rejada cheklangan mashqlar mavjud, Premium rejada to\'liq imkoniyatlar.',
    },
    {
      q: 'To\'lov qanday amalga oshiriladi?',
      a: 'To\'lovni bank kartasi orqali amalga oshirasiz, chek rasmini yuklaysiz va admin tasdiqlashini kutasiz. To\'lov tasdiqlangach, premium imkoniyatlar avtomatik ochiladi.',
    },
    {
      q: 'IELTS va Multilevel farqi nima?',
      a: 'IELTS xalqaro standart bo\'yicha 0-9 band tizimida baholanadi. Multilevel (CEFR) esa A1-C2 darajalariga moslashtirilgan. Platforma ikkala formatni ham qo\'llab-quvvatlaydi.',
    },
    {
      q: 'Writing va Speaking qanday baholanadi?',
      a: 'Writing va Speaking topshiriqlari admin tomonidan professional baholanadi. Siz yozgan matn yoki yozib olingan audio admin panelga yuboriladi va feedback bilan birga natija qaytariladi.',
    },
  ];

  const formatPrice = (n: number) => {
    if (n === 0) return 'Bepul';
    return new Intl.NumberFormat('uz-UZ').format(n) + ' so\'m';
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 -z-10 h-[400px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-6 animate-fade-in">
            <span className="flex size-2 rounded-full bg-success" />
            IELTS va Multilevel imtihonlariga professional tayyorgarlik
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-balance animate-slide-up">
            IELTS va Multilevel imtihonlariga{' '}
            <span className="text-primary">ishonch bilan</span> tayyorlaning.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance animate-slide-up">
            Real exam formatidagi mock testlar, individual progress tracking va kuchli learning tools orqali natijangizni oshiring.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
            <Button size="lg" asChild className="group">
              <Link to="/signup">
                Start Preparing
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/signup">Try a Mock Exam</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="px-4 py-12 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'O\'quvchilar', value: stats.students || '—', icon: GraduationCap },
            { label: 'Mavjud testlar', value: stats.exams || '—', icon: FileText },
            { label: 'Topshirilgan mock', value: stats.mockCompleted || '—', icon: Award },
            { label: 'O\'rtacha ko\'tarilish', value: stats.avgImprovement ? `+${stats.avgImprovement}` : '—', icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="size-6 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Platforma imkoniyatlari</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Imtihonga to'liq tayyorgarlik uchun kerakli barcha vositalar bir joyda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="size-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-card/50 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Qanday ishlaydi</h2>
            <p className="mt-4 text-muted-foreground text-lg">4 oddiy qadamda natijaga erishing</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                    {i + 1}
                  </div>
                  <step.icon className="size-7 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-full h-px border-t border-dashed border-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Areas */}
      <section id="ielts" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">To'rtta asosiy skill</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Har bir skill bo'yicha maxsus interfeys va real exam tajribasi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: 'Reading', desc: 'Passage va savollar yonma-yon, IELTS formatida' },
              { icon: Headphones, title: 'Listening', desc: 'Audio pleer, 4 qism, auto-save' },
              { icon: PenLine, title: 'Writing', desc: 'Task 1 va Task 2, word counter, timer' },
              { icon: Mic, title: 'Speaking', desc: 'Yozib olish, tayyorgarlik va javob vaqti' },
            ].map((skill) => (
              <div key={skill.title} className="rounded-xl border border-border bg-card p-6 text-center hover:shadow-md transition-all">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <skill.icon className="size-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{skill.title}</h3>
                <p className="text-sm text-muted-foreground">{skill.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-card/50 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Narxlar</h2>
            <p className="mt-4 text-muted-foreground text-lg">O\'zingizga mos rejani tanlang</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-10">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => {
              const isPopular = i === 1;
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
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
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{formatPrice(price)}</span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground ml-1">/{billingCycle === 'monthly' ? 'oy' : 'yil'}</span>
                    )}
                  </div>
                  <Button className="w-full mb-6" variant={isPopular ? 'default' : 'outline'} asChild>
                    <Link to="/signup">{plan.name === 'Free' ? 'Boshlash' : 'Tanlash'}</Link>
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
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Tez-tez beriladigan savollar</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className={`size-5 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto rounded-3xl bg-primary text-primary-foreground p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Bugun mashqni boshlang</h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Minglab o'quvchilar singari, imtihonga professional tayyorgarlik ko'ring
          </p>
          <Button size="lg" variant="secondary" asChild className="group">
            <Link to="/signup">
              Start Preparing
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="size-5 text-primary-foreground" />
              </div>
              <span>PrepMaster</span>
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="/#faq" className="hover:text-foreground transition-colors">FAQ</a>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 PrepMaster. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ArrowLeft, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Email noto\'g\'ri'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
});

type FormData = z.infer<typeof schema>;

function LoginPage() {
  const { signIn, session, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (session && profile) {
    return <Navigate to={profile.onboarding_completed ? '/dashboard' : '/onboarding'} replace />;
  }
  if (session) return null;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Xush kelibsiz!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-8">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <span>PrepMaster</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Hisobingizga kiring</CardTitle>
            <p className="text-sm text-muted-foreground">Mashqlarni davom ettirish uchun kiring</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-9"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Kirilmoqda...' : 'Kirish'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Hisobingiz yo'qmi?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </CardContent>
        </Card>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6"
        >
          <ArrowLeft className="size-4" />
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;

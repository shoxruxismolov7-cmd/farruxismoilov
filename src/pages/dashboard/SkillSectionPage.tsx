import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Exam } from '@/types';

function SkillSectionPage({ skill }: { skill: 'reading' | 'listening' | 'writing' | 'speaking' }) {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('exams')
      .select('*')
      .eq('status', 'published')
      .eq('section', skill)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setExams((data || []) as Exam[]);
        setLoading(false);
      });
  }, [skill]);

  const isPremiumUser = profile?.role === 'admin' || profile?.role === 'super_admin';
  const title = skill.charAt(0).toUpperCase() + skill.slice(1);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <BookOpen className="size-7" />
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">{title} bo'yicha mashqlar va testlar</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Hozircha {title.toLowerCase()} testlari yo'q.</p>
          <Button asChild variant="outline">
            <Link to="/dashboard/exam-library">Barcha testlarni ko'rish</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const locked = exam.is_premium && !isPremiumUser;
            return (
              <Card key={exam.id} className="group hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="size-6 text-primary" />
                    </div>
                    {exam.is_premium && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="size-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{exam.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {exam.duration_minutes} min
                    </span>
                    <Button asChild size="sm" variant={locked ? 'secondary' : 'default'}>
                      <Link to={locked ? '/dashboard/subscription' : `/dashboard/exam/${exam.id}`}>
                        {locked ? 'Upgrade' : 'Start'}
                        {!locked && <ArrowRight className="ml-1 size-3.5" />}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReadingPage() {
  return <SkillSectionPage skill="reading" />;
}
export function ListeningPage() {
  return <SkillSectionPage skill="listening" />;
}
export function WritingPage() {
  return <SkillSectionPage skill="writing" />;
}
export function SpeakingPage() {
  return <SkillSectionPage skill="speaking" />;
}

export default SkillSectionPage;

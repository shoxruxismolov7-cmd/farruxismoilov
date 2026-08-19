import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Headphones, PenLine, Mic, TrendingUp, Award, Flame, Target, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Result, Exam } from '@/types';

type ResultWithExam = Result & { exams: Exam | null };

function DashboardPage() {
  const { profile } = useAuth();
  const [results, setResults] = useState<ResultWithExam[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    Promise.all([
      supabase
        .from('results')
        .select('*, exams(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => data || []),
      supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(4)
        .then(({ data }) => data || []),
    ]).then(([r, e]) => {
      setResults(r as unknown as ResultWithExam[]);
      setExams(e as Exam[]);
      setLoading(false);
    });
  }, [profile?.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const skillScores: Record<string, number | null> = { reading: null, listening: null, writing: null, speaking: null };
  results.forEach((r) => {
    const exam = r.exams;
    if (exam && exam.section && r.band_score !== null) {
      const current = skillScores[exam.section];
      if (current === null || r.band_score > current) {
        skillScores[exam.section] = r.band_score;
      }
    }
  });

  const testsCompleted = results.length;
  const avgScore = results.length > 0
    ? (results.reduce((sum, r) => sum + (r.band_score || 0), 0) / results.length).toFixed(1)
    : '—';

  const overallProgress = Math.min(
    Math.round(
      Object.values(skillScores).reduce<number>((sum, v) => sum + (v || 0), 0) /
        (Object.values(skillScores).filter((v) => v !== null).length || 1) /
        9 *
        100
    ),
    100
  );

  const skills = [
    { name: 'Reading', icon: BookOpen, score: skillScores.reading, color: 'text-blue-500' },
    { name: 'Listening', icon: Headphones, score: skillScores.listening, color: 'text-green-500' },
    { name: 'Writing', icon: PenLine, score: skillScores.writing, color: 'text-orange-500' },
    { name: 'Speaking', icon: Mic, score: skillScores.speaking, color: 'text-purple-500' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {profile?.goal === 'ielts' ? `IELTS ${profile?.target_score}` : profile?.goal === 'multilevel' ? `Multilevel ${profile?.target_score}` : 'IELTS & Multilevel'} maqsadingizga erishing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold mt-1">{avgScore}</p>
              </div>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="size-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tests Completed</p>
                <p className="text-2xl font-bold mt-1">{testsCompleted}</p>
              </div>
              <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="size-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold mt-1">0</p>
              </div>
              <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Flame className="size-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold mt-1">{overallProgress}%</p>
              </div>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="size-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Skill Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <skill.icon className={`size-4 ${skill.color}`} />
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {skill.score !== null ? `${skill.score} / 9.0` : '—'}
                  </span>
                </div>
                <Progress value={skill.score !== null ? (skill.score / 9) * 100 : 0} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Goal */}
        <Card>
          <CardHeader>
            <CardTitle>Current Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="size-8 text-primary" />
              </div>
              <p className="text-3xl font-bold">
                {profile?.goal === 'ielts' ? `IELTS ${profile?.target_score}` : profile?.target_score}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Daraja: {profile?.current_level?.toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                Muddat: {profile?.exam_timeframe}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Recommended */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="size-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No exams completed yet.</p>
                <Button asChild size="sm">
                  <Link to="/dashboard/exam-library">Start your first exam</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((r) => {
                  const exam = r.exams;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{exam?.title || 'Exam'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{r.band_score || r.accuracy.toFixed(0) + '%'}</p>
                        <p className="text-xs text-muted-foreground">{r.correct}/{r.total_questions}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Practice</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Hozircha tavsiya etiladigan testlar yo'q.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exams.map((exam) => (
                  <Link
                    key={exam.id}
                    to={`/dashboard/exam/${exam.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium">{exam.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {exam.exam_type} • {exam.section} • {exam.duration_minutes} min
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;

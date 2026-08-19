import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Award, Clock, Target, TrendingUp, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Result, Exam } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

function ResultsPage() {
  const { profile } = useAuth();
  const [results, setResults] = useState<(Result & { exams: Exam })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('results')
      .select('*, exams(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setResults((data || []) as unknown as (Result & { exams: Exam })[]);
        setLoading(false);
      });
  }, [profile?.id]);

  const scoreTrend = results
    .filter((r) => r.band_score !== null)
    .reverse()
    .map((r) => ({
      date: new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      score: r.band_score,
    }));

  const skillData = ['reading', 'listening', 'writing', 'speaking'].map((skill) => {
    const skillResults = results.filter((r) => r.exams?.section === skill);
    const avg = skillResults.length > 0
      ? skillResults.reduce((sum, r) => sum + (r.band_score || r.accuracy / 100 * 9 || 0), 0) / skillResults.length
      : 0;
    return { skill: skill.charAt(0).toUpperCase() + skill.slice(1), score: Number(avg.toFixed(1)) };
  });

  const expanded = results.find((r) => r.id === selectedResult);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="size-7" />
          Results & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Natijalaringiz va statistikangiz</p>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No exams completed yet.</p>
          <Button asChild>
            <a href="/dashboard/exam-library">Start your first exam</a>
          </Button>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {scoreTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={scoreTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis domain={[0, 9]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-16 text-sm">Band score ma'lumotlari yo'q</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={skillData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="skill" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 9]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Results List */}
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.id}>
                    <button
                      onClick={() => setSelectedResult(selectedResult === r.id ? null : r.id)}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium">{r.exams?.title || 'Exam'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(r.created_at).toLocaleDateString()} • {r.exams?.section}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle className="size-3.5" />
                            {r.correct}
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="size-3.5" />
                            {r.incorrect}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MinusCircle className="size-3.5" />
                            {r.skipped}
                          </span>
                        </div>
                        <div className="text-right">
                          {r.band_score !== null ? (
                            <p className="text-lg font-bold">{r.band_score}</p>
                          ) : (
                            <p className="text-lg font-bold">{r.accuracy.toFixed(0)}%</p>
                          )}
                          <p className="text-xs text-muted-foreground">score</p>
                        </div>
                      </div>
                    </button>

                    {selectedResult === r.id && (
                      <div className="mt-2 p-4 rounded-lg bg-muted/50 animate-fade-in">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Accuracy</p>
                            <p className="font-semibold">{r.accuracy.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Time Spent</p>
                            <p className="font-semibold">{Math.floor(r.time_spent_seconds / 60)} min</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Raw Score</p>
                            <p className="font-semibold">{r.raw_score} / {r.total_questions}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Band Score</p>
                            <p className="font-semibold">{r.band_score ?? '—'}</p>
                          </div>
                        </div>
                        {r.detailed_results && Object.keys(r.detailed_results).length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Question Review:</p>
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                              {Object.entries(r.detailed_results).map(([qId, detail]) => {
                                const d = detail as Record<string, unknown>;
                                const result = d.result as string;
                                return (
                                  <div key={qId} className="flex items-center gap-2 text-sm p-2 rounded border border-border">
                                    {result === 'correct' ? (
                                      <CheckCircle className="size-4 text-success flex-shrink-0" />
                                    ) : result === 'incorrect' ? (
                                      <XCircle className="size-4 text-destructive flex-shrink-0" />
                                    ) : (
                                      <MinusCircle className="size-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className="text-muted-foreground">
                                      Your answer: {String(d.userAnswer ?? '—')}
                                    </span>
                                    {result !== 'correct' && (
                                      <span className="text-success ml-auto">
                                        Correct: {String(d.correctAnswer ?? '—')}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default ResultsPage;

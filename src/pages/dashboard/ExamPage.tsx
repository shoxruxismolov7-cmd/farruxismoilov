import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, BookOpen, Headphones, PenLine, Mic } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Exam, ExamSectionData, Question, ExamSession } from '@/types';
import { toast } from 'sonner';

type AnswerMap = Record<string, string | string[]>;

function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sections, setSections] = useState<ExamSectionData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!examId) return;
    Promise.all([
      supabase.from('exams').select('*').eq('id', examId).maybeSingle().then(({ data }) => data as Exam | null),
      supabase.from('exam_sections').select('*').eq('exam_id', examId).order('order', { ascending: true }).then(({ data }) => (data || []) as ExamSectionData[]),
      supabase.from('questions').select('*').eq('exam_id', examId).order('order', { ascending: true }).then(({ data }) => (data || []) as Question[]),
    ]).then(([e, s, q]) => {
      setExam(e);
      setSections(s);
      setQuestions(q);
      if (e) setRemainingSeconds(e.duration_minutes * 60);
      setLoading(false);
    });
  }, [examId]);

  useEffect(() => {
    if (!examId || !profile?.id || !exam || showInstructions) return;

    supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', profile.id)
      .eq('status', 'in_progress')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSession(data as ExamSession);
          setAnswers((data as ExamSession).answers || {});
          if (data.remaining_seconds) setRemainingSeconds(data.remaining_seconds);
        } else {
          supabase
            .from('exam_sessions')
            .insert({
              exam_id: examId,
              user_id: profile.id,
              status: 'in_progress',
              remaining_seconds: exam.duration_minutes * 60,
              answers: {},
            })
            .select()
            .maybeSingle()
            .then(({ data: newSession }) => {
              if (newSession) setSession(newSession as ExamSession);
            });
        }
      });
  }, [examId, profile?.id, exam, showInstructions]);

  // Timer
  useEffect(() => {
    if (showInstructions || !session) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showInstructions, session]);

  // Autosave
  const debouncedSave = useCallback(
    (newAnswers: AnswerMap, newRemaining: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (session) {
          supabase
            .from('exam_sessions')
            .update({ answers: newAnswers, remaining_seconds: newRemaining })
            .eq('id', session.id);
        }
      }, 2000);
    },
    [session]
  );

  const handleAnswer = (questionId: string, value: string | string[]) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    debouncedSave(newAnswers, remainingSeconds);
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!session || !exam || !profile) return;
    setSubmitting(true);

    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    const detailed: Record<string, unknown> = {};

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
        skipped++;
        detailed[q.id] = { userAnswer: null, correctAnswer: q.correct_answer, result: 'skipped' };
      } else {
        const isCorrect = Array.isArray(q.correct_answer)
          ? JSON.stringify(userAnswer) === JSON.stringify(q.correct_answer)
          : String(userAnswer) === String(q.correct_answer);
        if (isCorrect) correct++;
        else incorrect++;
        detailed[q.id] = { userAnswer, correctAnswer: q.correct_answer, result: isCorrect ? 'correct' : 'incorrect', explanation: q.explanation };
      }
    });

    const total = questions.length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const rawScore = correct;
    const timeSpent = exam.duration_minutes * 60 - remainingSeconds;

    let bandScore: number | null = null;
    if (exam.exam_type === 'ielts' && (exam.section === 'reading' || exam.section === 'listening')) {
      if (correct >= 39) bandScore = 9.0;
      else if (correct >= 37) bandScore = 8.5;
      else if (correct >= 35) bandScore = 8.0;
      else if (correct >= 33) bandScore = 7.5;
      else if (correct >= 30) bandScore = 7.0;
      else if (correct >= 27) bandScore = 6.5;
      else if (correct >= 23) bandScore = 6.0;
      else if (correct >= 19) bandScore = 5.5;
      else if (correct >= 15) bandScore = 5.0;
      else if (correct >= 12) bandScore = 4.5;
      else bandScore = 4.0;
    }

    const { data: result } = await supabase
      .from('results')
      .insert({
        user_id: profile.id,
        exam_id: exam.id,
        session_id: session.id,
        total_questions: total,
        correct,
        incorrect,
        skipped,
        raw_score: rawScore,
        band_score: bandScore,
        accuracy,
        time_spent_seconds: timeSpent,
        detailed_results: detailed,
      })
      .select()
      .maybeSingle();

    await supabase
      .from('exam_sessions')
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), remaining_seconds: remainingSeconds })
      .eq('id', session.id);

    setSubmitting(false);
    if (result) {
      toast.success('Imtihon topshirildi!');
      navigate(`/dashboard/results`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="h-16 rounded-lg bg-muted animate-pulse mb-4" />
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <p className="text-muted-foreground">Imtihon topilmadi.</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/exam-library">Exam Library</Link>
        </Button>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
              <p className="text-muted-foreground">{exam.description}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 rounded-lg bg-muted">
                <Clock className="size-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{exam.duration_minutes}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <BookOpen className="size-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <CheckCircle className="size-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{sections.length}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <AlertCircle className="size-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold capitalize">{exam.difficulty}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
            </div>
            <div className="space-y-3 mb-8">
              <h3 className="font-semibold">Ko'rsatmalar:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Imtihon {exam.duration_minutes} daqiqa davom etadi</li>
                <li>• Javoblar avtomatik saqlanadi</li>
                <li>• Vaqt tugagach imtihon avtomatik topshiriladi</li>
                <li>• Savollarni belgilab, keyinroq qaytib kelishingiz mumkin</li>
                <li>• Browserni yangilashda imtihon davom etadi</li>
              </ul>
            </div>
            <Button size="lg" className="w-full" onClick={() => setShowInstructions(false)}>
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];
  const currentSection = currentQuestion
    ? sections.find((s) => s.id === currentQuestion.section_id)
    : null;
  const answeredCount = Object.keys(answers).filter((k) => {
    const v = answers[k];
    return v && (!Array.isArray(v) || v.length > 0);
  }).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Exam Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-sm md:text-base">{exam.title}</h1>
          <Badge variant="outline" className="capitalize hidden md:block">{exam.section}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold text-sm ${remainingSeconds < 300 ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
            <Clock className="size-4" />
            {formatTime(remainingSeconds)}
          </div>
          <span className="text-sm text-muted-foreground hidden md:block">
            {answeredCount}/{questions.length} answered
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant={remainingSeconds < 300 ? 'destructive' : 'default'}>
                Submit
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Imtihonni topshirasizmi?</AlertDialogTitle>
                <AlertDialogDescription>
                  {answeredCount}/{questions.length} savol javoblangan. {questions.length - answeredCount} ta savol javobsiz qolmoqda.
                  Bu amalni bekor qilib bo'lmaydi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Topshirilmoqda...' : 'Topshirish'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Exam Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Passage (Reading) or Question Info */}
        {exam.section === 'reading' && currentSection?.passage && (
          <div className="md:w-1/2 border-r border-border p-4 md:p-6 overflow-y-auto max-h-[40vh] md:max-h-none">
            <h2 className="font-semibold mb-3">{currentSection.title}</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {currentSection.passage}
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {currentQuestion ? (
            <div className="max-w-2xl mx-auto">
              {/* Question Navigation */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Question {currentQIndex + 1}</span>
                  <span className="text-sm text-muted-foreground">/ {questions.length}</span>
                  {flagged.has(currentQuestion.id) && (
                    <Badge variant="secondary" className="gap-1">
                      <Flag className="size-3" />
                      Flagged
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleFlag(currentQuestion.id)}>
                  <Flag className={`size-4 ${flagged.has(currentQuestion.id) ? 'fill-current text-warning' : ''}`} />
                </Button>
              </div>

              {/* Question */}
              <Card>
                <CardContent className="pt-6">
                  <p className="font-medium mb-4">{currentQuestion.question_text}</p>

                  {/* Answer Area based on question type */}
                  {(currentQuestion.question_type === 'multiple_choice' ||
                    currentQuestion.question_type === 'true_false_not_given' ||
                    currentQuestion.question_type === 'yes_no_not_given') && currentQuestion.options ? (
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(currentQuestion.id, option)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            answers[currentQuestion.id] === option
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-sm">{option}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={(answers[currentQuestion.id] as string) || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Javobingizni shu yerga yozing..."
                      className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                  disabled={currentQIndex === 0}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Oldingi
                </Button>
                <Button
                  onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))}
                  disabled={currentQIndex === questions.length - 1}
                >
                  Keyingi
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Savollar topilmadi.</p>
            </div>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <footer className="border-t border-border bg-card p-3 overflow-x-auto">
        <div className="flex gap-2 justify-center max-w-3xl mx-auto">
          {questions.map((q, i) => {
            const isAnswered = answers[q.id] && (!Array.isArray(answers[q.id]) || (answers[q.id] as string[]).length > 0);
            const isFlagged = flagged.has(q.id);
            const isCurrent = i === currentQIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQIndex(i)}
                className={`size-8 rounded-md text-xs font-medium transition-all flex items-center justify-center relative ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isAnswered
                    ? 'bg-success/20 text-success'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {i + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-warning" />
                )}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}

export default ExamPage;

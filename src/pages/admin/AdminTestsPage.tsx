import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2, Save, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Exam, Question } from '@/types';
import { toast } from 'sonner';

function AdminTestsPage() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // New exam form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState('ielts');
  const [section, setSection] = useState('reading');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [duration, setDuration] = useState('60');
  const [isPremium, setIsPremium] = useState(false);

  // New question form
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('multiple_choice');
  const [qOptions, setQOptions] = useState('');
  const [qCorrect, setQCorrect] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qPoints, setQPoints] = useState('1');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const { data } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
    setExams((data || []) as Exam[]);
    setLoading(false);
  };

  const handleCreateExam = async () => {
    if (!title.trim()) {
      toast.error('Sarlavha kiriting');
      return;
    }
    const { data, error } = await supabase.from('exams').insert({
      title,
      description,
      exam_type: examType,
      section,
      difficulty,
      duration_minutes: parseInt(duration),
      is_premium: isPremium,
      status: 'draft',
      total_questions: 0,
    }).select().maybeSingle();

    if (error) {
      toast.error('Xatolik yuz berdi');
    } else {
      toast.success('Test yaratildi');
      setShowCreate(false);
      setTitle(''); setDescription('');
      fetchExams();
      if (data) setEditing((data as Exam).id);
    }
  };

  const fetchQuestions = async (examId: string) => {
    const { data } = await supabase.from('questions').select('*').eq('exam_id', examId).order('order', { ascending: true });
    setQuestions((data || []) as Question[]);
  };

  const handleAddQuestion = async () => {
    if (!qText.trim() || !editing) return;
    const options = qOptions ? qOptions.split('\n').filter(Boolean) : null;
    const { error } = await supabase.from('questions').insert({
      exam_id: editing,
      question_text: qText,
      question_type: qType,
      options: options,
      correct_answer: qCorrect,
      explanation: qExplanation,
      points: parseInt(qPoints) || 1,
      order: questions.length,
    });

    if (error) {
      toast.error('Xatolik');
    } else {
      toast.success('Savol qo\'shildi');
      setQText(''); setQOptions(''); setQCorrect(''); setQExplanation(''); setQPoints('1');
      fetchQuestions(editing);
      // Update total_questions
      const count = questions.length + 1;
      await supabase.from('exams').update({ total_questions: count }).eq('id', editing);
      fetchExams();
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!editing) return;
    await supabase.from('questions').delete().eq('id', qId);
    fetchQuestions(editing);
    const count = questions.length - 1;
    await supabase.from('exams').update({ total_questions: count }).eq('id', editing);
    fetchExams();
    toast.success('Savol o\'chirildi');
  };

  const togglePublish = async (exam: Exam) => {
    const newStatus = exam.status === 'published' ? 'draft' : 'published';
    await supabase.from('exams').update({ status: newStatus }).eq('id', exam.id);
    fetchExams();
    toast.success(newStatus === 'published' ? 'Test nashr qilindi' : 'Test o\'chirildi');
  };

  const handleDeleteExam = async (examId: string) => {
    await supabase.from('exams').delete().eq('id', examId);
    fetchExams();
    toast.success('Test o\'chirildi');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="size-7" />
            Test Base
          </h1>
          <p className="text-muted-foreground mt-1">Testlar va savollarni boshqarish</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="size-4 mr-1" />
          Yangi test
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Yangi test yaratish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sarlavha</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test sarlavhasi" />
              </div>
              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Test tavsifi" />
              </div>
              <div className="space-y-2">
                <Label>Imtihon turi</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ielts">IELTS</SelectItem>
                    <SelectItem value="multilevel">Multilevel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bo'lim</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="speaking">Speaking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qiyinlik</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Davomiyligi (daqiqa)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPremium" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
              <Label htmlFor="isPremium">Premium kontent</Label>
            </div>
            <Button onClick={handleCreateExam}>Yaratish</Button>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Savollar ({questions.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Yopish</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add question form */}
            <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
              <h4 className="font-medium text-sm">Yangi savol qo'shish</h4>
              <div className="space-y-2">
                <Label>Savol matni</Label>
                <Textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Savolni kiriting..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Savol turi</Label>
                  <Select value={qType} onValueChange={setQType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false_not_given">True/False/Not Given</SelectItem>
                      <SelectItem value="yes_no_not_given">Yes/No/Not Given</SelectItem>
                      <SelectItem value="sentence_completion">Sentence Completion</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ball</Label>
                  <Input type="number" value={qPoints} onChange={(e) => setQPoints(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Variantlar (har birini yangi qatorda)</Label>
                <Textarea value={qOptions} onChange={(e) => setQOptions(e.target.value)} placeholder={'Variant A\nVariant B\nVariant C\nVariant D'} />
              </div>
              <div className="space-y-2">
                <Label>To'g'ri javob</Label>
                <Input value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} placeholder="To'g'ri javob" />
              </div>
              <div className="space-y-2">
                <Label>Tushuntirish</Label>
                <Textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Tushuntirish..." />
              </div>
              <Button onClick={handleAddQuestion} size="sm">
                <Plus className="size-3 mr-1" />
                Savol qo'shish
              </Button>
            </div>

            {/* Questions list */}
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={q.id} className="p-3 rounded-lg border border-border flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i + 1}. {q.question_text}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{q.question_type.replace(/_/g, ' ')}</p>
                    {q.correct_answer && <p className="text-xs text-success mt-1">Javob: {String(q.correct_answer)}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Hali savollar yo'q</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Hozircha testlar yo'q.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{exam.title}</p>
                      <Badge variant={exam.status === 'published' ? 'default' : 'secondary'} className="capitalize">{exam.status}</Badge>
                      {exam.is_premium && <Badge variant="outline">Premium</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {exam.exam_type} • {exam.section} • {exam.difficulty} • {exam.total_questions} savol • {exam.duration_minutes} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(exam.id); fetchQuestions(exam.id); }}>
                      Savollar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => togglePublish(exam)}>
                      {exam.status === 'published' ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteExam(exam.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminTestsPage;

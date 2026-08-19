import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Library, Search, Clock, Lock, BookOpen, Headphones, PenLine, Mic } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Exam } from '@/types';

const SECTION_ICONS: Record<string, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};

function ExamLibraryPage() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    let query = supabase.from('exams').select('*').eq('status', 'published');
    if (filterType !== 'all') query = query.eq('exam_type', filterType);
    if (filterSection !== 'all') query = query.eq('section', filterSection);
    if (filterDifficulty !== 'all') query = query.eq('difficulty', filterDifficulty);
    if (search) query = query.ilike('title', `%${search}%`);

    query.order('created_at', { ascending: false }).then(({ data }) => {
      setExams((data || []) as Exam[]);
      setLoading(false);
    });
  }, [search, filterType, filterSection, filterDifficulty]);

  const isPremiumUser = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Library className="size-7" />
          Exam Library
        </h1>
        <p className="text-muted-foreground mt-1">Mavjud testlar va mock imtihonlar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ielts">IELTS</SelectItem>
            <SelectItem value="multilevel">Multilevel</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
            <SelectItem value="listening">Listening</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="speaking">Speaking</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exam Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16">
          <Library className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Hozircha testlar topilmadi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const Icon = SECTION_ICONS[exam.section] || BookOpen;
            const locked = exam.is_premium && !isPremiumUser;
            return (
              <Card key={exam.id} className="group hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="size-6 text-primary" />
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
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="capitalize">{exam.exam_type}</Badge>
                    <Badge variant="outline" className="capitalize">{exam.section}</Badge>
                    <Badge variant="outline" className="capitalize">{exam.difficulty}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {exam.duration_minutes} min
                    </span>
                    <Button asChild size="sm" variant={locked ? 'secondary' : 'default'}>
                      <Link to={locked ? '/dashboard/subscription' : `/dashboard/exam/${exam.id}`}>
                        {locked ? 'Upgrade' : 'Start'}
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

export default ExamLibraryPage;

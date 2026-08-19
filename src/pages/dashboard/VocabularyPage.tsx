import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookMarked, Search, Star, Check, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { VocabularyWord, UserVocabulary } from '@/types';
import { VOCABULARY_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

function VocabularyPage() {
  const { profile } = useAuth();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [userVocab, setUserVocab] = useState<Record<string, UserVocabulary>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('vocabulary_words').select('*', { count: 'exact' });
    if (search) query = query.ilike('word', `%${search}%`);
    if (category !== 'all') query = query.eq('category', category);
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).order('word', { ascending: true });

    const { data, count } = await query;
    setWords((data || []) as VocabularyWord[]);
    setTotal(count || 0);
    setLoading(false);
  }, [search, category, page]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('user_vocabulary')
      .select('*')
      .eq('user_id', profile.id)
      .then(({ data }) => {
        const map: Record<string, UserVocabulary> = {};
        (data || []).forEach((uv: UserVocabulary) => {
          map[uv.word_id] = uv;
        });
        setUserVocab(map);
      });
  }, [profile?.id]);

  const toggleFavorite = async (wordId: string) => {
    const existing = userVocab[wordId];
    if (existing) {
      const newVal = !existing.is_favorite;
      setUserVocab((prev) => ({ ...prev, [wordId]: { ...prev[wordId], is_favorite: newVal } }));
      await supabase.from('user_vocabulary').update({ is_favorite: newVal }).eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('user_vocabulary')
        .insert({ user_id: profile!.id, word_id: wordId, is_favorite: true })
        .select()
        .maybeSingle();
      if (data) setUserVocab((prev) => ({ ...prev, [wordId]: data as UserVocabulary }));
    }
  };

  const toggleLearned = async (wordId: string) => {
    const existing = userVocab[wordId];
    if (existing) {
      const newVal = !existing.is_learned;
      setUserVocab((prev) => ({ ...prev, [wordId]: { ...prev[wordId], is_learned: newVal } }));
      await supabase.from('user_vocabulary').update({ is_learned: newVal }).eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('user_vocabulary')
        .insert({ user_id: profile!.id, word_id: wordId, is_learned: true })
        .select()
        .maybeSingle();
      if (data) setUserVocab((prev) => ({ ...prev, [wordId]: data as UserVocabulary }));
    }
    toast.success('Yangilandi');
  };

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <BookMarked className="size-7" />
          Vocabulary
        </h1>
        <p className="text-muted-foreground mt-1">IELTS va akademik so'zlar bo'yicha mashq</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="So'z qidirish..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(0); }}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {VOCABULARY_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-16">
          <BookMarked className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">So'zlar topilmadi.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {words.map((word) => {
              const uv = userVocab[word.id];
              return (
                <Card key={word.id} className="group hover:shadow-md transition-all">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{word.word}</h3>
                          <button onClick={() => speakWord(word.word)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Volume2 className="size-4" />
                          </button>
                        </div>
                        {word.pronunciation && (
                          <p className="text-xs text-muted-foreground">{word.pronunciation}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleFavorite(word.id)}
                          className={`p-1.5 rounded-md transition-colors ${uv?.is_favorite ? 'text-warning' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Star className={`size-4 ${uv?.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => toggleLearned(word.id)}
                          className={`p-1.5 rounded-md transition-colors ${uv?.is_learned ? 'text-success' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Check className={`size-4 ${uv?.is_learned ? 'font-bold' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{word.definition}</p>
                    {word.uz_translation && (
                      <p className="text-sm font-medium mb-2">{word.uz_translation}</p>
                    )}
                    {word.example_sentence && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2 mb-2">
                        "{word.example_sentence}"
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="capitalize text-xs">{word.difficulty}</Badge>
                      {word.topic && <Badge variant="outline" className="text-xs">{word.topic}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VocabularyPage;

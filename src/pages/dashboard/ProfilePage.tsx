import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Send, Target, Award, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CEFR_LEVELS, IELTS_SCORES, TIMEFRAMES } from '@/lib/constants';
import { toast } from 'sonner';

function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [telegram, setTelegram] = useState(profile?.telegram || '');
  const [goal, setGoal] = useState(profile?.goal || 'ielts');
  const [currentLevel, setCurrentLevel] = useState(profile?.current_level || 'unknown');
  const [targetScore, setTargetScore] = useState(profile?.target_score || '7.0');
  const [timeframe, setTimeframe] = useState(profile?.exam_timeframe || '3-6 months');
  const [weakestSkill, setWeakestSkill] = useState(profile?.weakest_skill || '');

  const initials = (fullName || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        telegram,
        goal,
        current_level: currentLevel,
        target_score: targetScore,
        exam_timeframe: timeframe,
        weakest_skill: weakestSkill,
      })
      .eq('id', profile?.id);

    setLoading(false);
    if (error) {
      toast.error('Xatolik yuz berdi');
    } else {
      await refreshProfile();
      toast.success('Profil yangilandi');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <User className="size-7" />
          Profile
        </h1>
        <p className="text-muted-foreground mt-1">Shaxsiy ma'lumotlaringiz</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="size-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Role: <span className="font-medium capitalize">{profile?.role}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ism familiya</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input id="telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imtihon maqsadlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maqsad</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ielts">IELTS</SelectItem>
                  <SelectItem value="multilevel">Multilevel</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hozirgi daraja</Label>
              <Select value={currentLevel} onValueChange={setCurrentLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((l) => (
                    <SelectItem key={l} value={l.toLowerCase()}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maqsad ball</Label>
              <Select value={targetScore} onValueChange={setTargetScore}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IELTS_SCORES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Muddat</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Zaif skill</Label>
              <Select value={weakestSkill} onValueChange={setWeakestSkill}>
                <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="listening">Listening</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="speaking">Speaking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;

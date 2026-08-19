import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Target, Award, Clock, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CEFR_LEVELS, IELTS_SCORES, TIMEFRAMES, SKILL_AREAS } from '@/lib/constants';
import { toast } from 'sonner';

const GOALS = [
  { value: 'ielts', label: 'IELTS' },
  { value: 'multilevel', label: 'Multilevel' },
  { value: 'both', label: 'Both' },
];

const SKILL_LABELS: Record<string, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    goal: profile?.goal || 'ielts',
    current_level: profile?.current_level || 'unknown',
    target_score: profile?.target_score || '7.0',
    exam_timeframe: profile?.exam_timeframe || '3-6 months',
    weakest_skill: profile?.weakest_skill || '',
  });

  const steps = [
    { icon: Target, title: 'Maqsadingiz?', subtitle: 'Qaysi imtihonga tayyorlanmoqchisiz?' },
    { icon: Award, title: 'Hozirgi darajangiz?', subtitle: 'CEFR darajangizni tanlang' },
    { icon: Target, title: 'Maqsad ballingiz?', subtitle: 'Qaysi natijaga erishmoqchisiz?' },
    { icon: Clock, title: 'Imtihongacha qancha vaqt?', subtitle: 'Tayyorgarlik muddatini tanlang' },
    { icon: AlertCircle, title: 'Qaysi skill eng qiyin?', subtitle: 'Zaif tomoningizni aniqlang' },
  ];

  const handleSelect = (key: keyof typeof answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        goal: answers.goal,
        current_level: answers.current_level,
        target_score: answers.target_score,
        exam_timeframe: answers.exam_timeframe,
        weakest_skill: answers.weakest_skill,
        onboarding_completed: true,
      })
      .eq('id', profile?.id);

    setLoading(false);
    if (error) {
      toast.error('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } else {
      await refreshProfile();
      toast.success('Xush kelibsiz! Dashboardga yo\'naltirilmoqdasiz.');
      navigate('/dashboard');
    }
  };

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  const getOptions = () => {
    switch (step) {
      case 0:
        return GOALS.map((g) => ({ value: g.value, label: g.label }));
      case 1:
        return CEFR_LEVELS.map((l) => ({ value: l.toLowerCase(), label: l }));
      case 2:
        return answers.goal === 'multilevel'
          ? CEFR_LEVELS.filter((l) => l !== 'Unknown').map((l) => ({ value: l, label: l }))
          : IELTS_SCORES.map((s) => ({ value: s, label: s }));
      case 3:
        return TIMEFRAMES.map((t) => ({ value: t, label: t }));
      case 4:
        return SKILL_AREAS.map((s) => ({ value: s, label: SKILL_LABELS[s] }));
      default:
        return [];
    }
  };

  const getCurrentValue = () => {
    switch (step) {
      case 0: return answers.goal;
      case 1: return answers.current_level;
      case 2: return answers.target_score;
      case 3: return answers.exam_timeframe;
      case 4: return answers.weakest_skill;
      default: return '';
    }
  };

  const options = getOptions();
  const currentValue = getCurrentValue();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 font-bold text-xl mb-8">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <span>PrepMaster</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full mx-0.5 transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">Qadam {step + 1} / {steps.length}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <StepIcon className="size-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{currentStep.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{currentStep.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(
                    step === 0 ? 'goal' : step === 1 ? 'current_level' : step === 2 ? 'target_score' : step === 3 ? 'exam_timeframe' : 'weakest_skill',
                    option.value
                  )}
                  className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                    currentValue === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="size-4 mr-1" />
                  Orqaga
                </Button>
              ) : <div />}
              <Button onClick={handleNext} disabled={loading || (step === 4 && !answers.weakest_skill)}>
                {step === steps.length - 1 ? 'Tugatish' : 'Keyingi'}
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OnboardingPage;

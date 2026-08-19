/*
# IELTS & Multilevel Preparation Platform - Core Schema

## Overview
Creates the complete database schema for an EdTech platform supporting IELTS and Multilevel (CEFR) exam preparation. This includes user profiles, exams, questions, exam sessions, results, vocabulary, subscriptions, payments, chat, notifications, and admin settings.

## New Tables
1. `profiles` - User profile data (goal, level, target score, etc.) linked to auth.users
2. `exams` - Exam definitions (IELTS Reading, Listening, Writing, Speaking, Multilevel variants)
3. `exam_sections` - Sections within an exam (e.g. Part 1, Part 2)
4. `questions` - Questions within sections with various IELTS question types
5. `exam_sessions` - User exam attempt sessions with timer state
6. `exam_answers` - Individual question answers within a session
7. `results` - Exam results with scores and analytics
8. `vocabulary_words` - Vocabulary word bank with definitions, translations, examples
9. `user_vocabulary` - User's vocabulary learning state (learned, favorite, review)
10. `subscription_plans` - Plan definitions (Free, Premium, Pro) managed by admin
11. `subscriptions` - User subscription state
12. `payment_applications` - Manual payment verification requests
13. `notifications` - Platform notifications for users
14. `conversations` - Chat conversations between users and admin
15. `messages` - Individual chat messages
16. `platform_settings` - Admin-managed platform configuration
17. `audit_logs` - Admin action audit trail
18. `writing_submissions` - Writing task submissions for manual assessment
19. `speaking_submissions` - Speaking recordings for assessment

## Security
- RLS enabled on ALL tables
- Owner-scoped CRUD on user data (profiles, sessions, answers, results, vocabulary, subscriptions, payments, notifications, messages, writing/speaking submissions)
- Public read on exams, questions, vocabulary words, subscription plans, platform settings (so unauthenticated visitors can see available content)
- Admin-only write on content tables (exams, questions, vocabulary, plans, settings, notifications)
- Admin role determined by `raw_app_meta_data->>'role'` matching 'admin' or 'super_admin'
*/

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role') IN ('admin', 'super_admin'),
    false
  );
$$;

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  telegram text,
  goal text DEFAULT 'ielts',
  current_level text DEFAULT 'unknown',
  target_score text DEFAULT '7.0',
  exam_timeframe text DEFAULT '3-6 months',
  weakest_skill text,
  theme_preference text DEFAULT 'system',
  role text DEFAULT 'student',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;
CREATE POLICY "delete_own_profile" ON public.profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============ EXAMS ============
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  exam_type text NOT NULL DEFAULT 'ielts',
  section text NOT NULL DEFAULT 'reading',
  difficulty text DEFAULT 'intermediate',
  duration_minutes int DEFAULT 60,
  is_premium boolean DEFAULT false,
  status text DEFAULT 'draft',
  total_questions int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_exams" ON public.exams;
CREATE POLICY "read_exams" ON public.exams FOR SELECT
  TO anon, authenticated USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "insert_exams" ON public.exams;
CREATE POLICY "insert_exams" ON public.exams FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_exams" ON public.exams;
CREATE POLICY "update_exams" ON public.exams FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_exams" ON public.exams;
CREATE POLICY "delete_exams" ON public.exams FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ EXAM SECTIONS ============
CREATE TABLE IF NOT EXISTS public.exam_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  passage text,
  audio_url text,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_exam_sections" ON public.exam_sections;
CREATE POLICY "read_exam_sections" ON public.exam_sections FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.exams WHERE exams.id = exam_sections.exam_id AND (exams.status = 'published' OR public.is_admin()))
  );

DROP POLICY IF EXISTS "insert_exam_sections" ON public.exam_sections;
CREATE POLICY "insert_exam_sections" ON public.exam_sections FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_exam_sections" ON public.exam_sections;
CREATE POLICY "update_exam_sections" ON public.exam_sections FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_exam_sections" ON public.exam_sections;
CREATE POLICY "delete_exam_sections" ON public.exam_sections FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ QUESTIONS ============
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.exam_sections(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb,
  correct_answer jsonb,
  explanation text,
  points int DEFAULT 1,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_questions" ON public.questions;
CREATE POLICY "read_questions" ON public.questions FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.exams WHERE exams.id = questions.exam_id AND (exams.status = 'published' OR public.is_admin()))
  );

DROP POLICY IF EXISTS "insert_questions" ON public.questions;
CREATE POLICY "insert_questions" ON public.questions FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_questions" ON public.questions;
CREATE POLICY "update_questions" ON public.questions FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_questions" ON public.questions;
CREATE POLICY "delete_questions" ON public.questions FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ EXAM SESSIONS ============
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  status text DEFAULT 'in_progress',
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  remaining_seconds int,
  current_section_id uuid,
  answers jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON public.exam_sessions;
CREATE POLICY "select_own_sessions" ON public.exam_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_sessions" ON public.exam_sessions;
CREATE POLICY "insert_own_sessions" ON public.exam_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON public.exam_sessions;
CREATE POLICY "update_own_sessions" ON public.exam_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_sessions" ON public.exam_sessions;
CREATE POLICY "delete_own_sessions" ON public.exam_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ RESULTS ============
CREATE TABLE IF NOT EXISTS public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  total_questions int DEFAULT 0,
  correct int DEFAULT 0,
  incorrect int DEFAULT 0,
  skipped int DEFAULT 0,
  raw_score numeric DEFAULT 0,
  band_score numeric,
  cefr_level text,
  accuracy numeric DEFAULT 0,
  time_spent_seconds int DEFAULT 0,
  detailed_results jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_results" ON public.results;
CREATE POLICY "select_own_results" ON public.results FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_results" ON public.results;
CREATE POLICY "insert_own_results" ON public.results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_results" ON public.results;
CREATE POLICY "update_own_results" ON public.results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_results" ON public.results;
CREATE POLICY "delete_own_results" ON public.results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ VOCABULARY ============
CREATE TABLE IF NOT EXISTS public.vocabulary_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL,
  definition text,
  uz_translation text,
  example_sentence text,
  synonyms text[],
  antonyms text[],
  pronunciation text,
  audio_url text,
  difficulty text DEFAULT 'intermediate',
  topic text,
  category text DEFAULT 'ielts_academic',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_vocabulary" ON public.vocabulary_words;
CREATE POLICY "read_vocabulary" ON public.vocabulary_words FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_vocabulary" ON public.vocabulary_words;
CREATE POLICY "insert_vocabulary" ON public.vocabulary_words FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_vocabulary" ON public.vocabulary_words;
CREATE POLICY "update_vocabulary" ON public.vocabulary_words FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_vocabulary" ON public.vocabulary_words;
CREATE POLICY "delete_vocabulary" ON public.vocabulary_words FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ USER VOCABULARY ============
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id uuid NOT NULL REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  is_learned boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  review_date timestamptz,
  correct_count int DEFAULT 0,
  incorrect_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vocab" ON public.user_vocabulary;
CREATE POLICY "select_own_vocab" ON public.user_vocabulary FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_vocab" ON public.user_vocabulary;
CREATE POLICY "insert_own_vocab" ON public.user_vocabulary FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_vocab" ON public.user_vocabulary;
CREATE POLICY "update_own_vocab" ON public.user_vocabulary FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_vocab" ON public.user_vocabulary;
CREATE POLICY "delete_own_vocab" ON public.user_vocabulary FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ SUBSCRIPTION PLANS ============
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric DEFAULT 0,
  price_yearly numeric DEFAULT 0,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_plans" ON public.subscription_plans;
CREATE POLICY "read_plans" ON public.subscription_plans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_plans" ON public.subscription_plans;
CREATE POLICY "insert_plans" ON public.subscription_plans FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_plans" ON public.subscription_plans;
CREATE POLICY "update_plans" ON public.subscription_plans FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_plans" ON public.subscription_plans;
CREATE POLICY "delete_plans" ON public.subscription_plans FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id),
  plan_name text DEFAULT 'free',
  status text DEFAULT 'active',
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sub" ON public.subscriptions;
CREATE POLICY "select_own_sub" ON public.subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_sub" ON public.subscriptions;
CREATE POLICY "insert_own_sub" ON public.subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_sub" ON public.subscriptions;
CREATE POLICY "update_own_sub" ON public.subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_sub" ON public.subscriptions;
CREATE POLICY "delete_own_sub" ON public.subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ PAYMENT APPLICATIONS ============
CREATE TABLE IF NOT EXISTS public.payment_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id),
  plan_name text,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text,
  transaction_id text,
  receipt_url text,
  status text DEFAULT 'pending',
  reject_reason text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.payment_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON public.payment_applications;
CREATE POLICY "select_own_payments" ON public.payment_applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_payments" ON public.payment_applications;
CREATE POLICY "insert_own_payments" ON public.payment_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_payments" ON public.payment_applications;
CREATE POLICY "update_own_payments" ON public.payment_applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_payments" ON public.payment_applications;
CREATE POLICY "delete_own_payments" ON public.payment_applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  audience text DEFAULT 'all',
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_notifications" ON public.notifications;
CREATE POLICY "select_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR
    audience = 'all' OR
    (audience = 'premium' AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = auth.uid() AND s.status = 'active' AND s.plan_name IN ('premium', 'pro')
    )) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_notifications" ON public.notifications;
CREATE POLICY "insert_notifications" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "update_notifications" ON public.notifications;
CREATE POLICY "update_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "delete_notifications" ON public.notifications;
CREATE POLICY "delete_notifications" ON public.notifications FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_conversations" ON public.conversations;
CREATE POLICY "select_conversations" ON public.conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_conversations" ON public.conversations;
CREATE POLICY "insert_conversations" ON public.conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_conversations" ON public.conversations;
CREATE POLICY "update_conversations" ON public.conversations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_conversations" ON public.conversations;
CREATE POLICY "delete_conversations" ON public.conversations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  image_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_messages" ON public.messages;
CREATE POLICY "select_messages" ON public.messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "insert_messages" ON public.messages;
CREATE POLICY "insert_messages" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.user_id = auth.uid() OR public.is_admin())
      )
    )
  );

DROP POLICY IF EXISTS "update_messages" ON public.messages;
CREATE POLICY "update_messages" ON public.messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_admin())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "delete_messages" ON public.messages;
CREATE POLICY "delete_messages" ON public.messages FOR DELETE
  TO authenticated USING (sender_id = auth.uid());

-- ============ PLATFORM SETTINGS ============
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_settings" ON public.platform_settings;
CREATE POLICY "read_settings" ON public.platform_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_settings" ON public.platform_settings;
CREATE POLICY "insert_settings" ON public.platform_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_settings" ON public.platform_settings;
CREATE POLICY "update_settings" ON public.platform_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_settings" ON public.platform_settings;
CREATE POLICY "delete_settings" ON public.platform_settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ AUDIT LOGS ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_audit" ON public.audit_logs;
CREATE POLICY "select_audit" ON public.audit_logs FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_audit" ON public.audit_logs;
CREATE POLICY "insert_audit" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "delete_audit" ON public.audit_logs;
CREATE POLICY "delete_audit" ON public.audit_logs FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ WRITING SUBMISSIONS ============
CREATE TABLE IF NOT EXISTS public.writing_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  task_type text DEFAULT 'task1',
  question_text text,
  answer_text text,
  word_count int DEFAULT 0,
  status text DEFAULT 'submitted',
  band_score numeric,
  feedback text,
  assessed_by uuid,
  assessed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_writing" ON public.writing_submissions;
CREATE POLICY "select_own_writing" ON public.writing_submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_writing" ON public.writing_submissions;
CREATE POLICY "insert_own_writing" ON public.writing_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_writing" ON public.writing_submissions;
CREATE POLICY "update_own_writing" ON public.writing_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_writing" ON public.writing_submissions;
CREATE POLICY "delete_own_writing" ON public.writing_submissions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ SPEAKING SUBMISSIONS ============
CREATE TABLE IF NOT EXISTS public.speaking_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  part_number int DEFAULT 1,
  question_text text,
  recording_url text,
  duration_seconds int DEFAULT 0,
  status text DEFAULT 'submitted',
  band_score numeric,
  feedback text,
  assessed_by uuid,
  assessed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.speaking_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_speaking" ON public.speaking_submissions;
CREATE POLICY "select_own_speaking" ON public.speaking_submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_speaking" ON public.speaking_submissions;
CREATE POLICY "insert_own_speaking" ON public.speaking_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_speaking" ON public.speaking_submissions;
CREATE POLICY "update_own_speaking" ON public.speaking_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_speaking" ON public.speaking_submissions;
CREATE POLICY "delete_own_speaking" ON public.speaking_submissions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_exam_sections_exam_id ON public.exam_sections(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_section_id ON public.questions(section_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON public.exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON public.exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON public.results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON public.results(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_id ON public.user_vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_applications_user_id ON public.payment_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_applications_status ON public.payment_applications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON public.vocabulary_words(category);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_user_id ON public.writing_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_speaking_submissions_user_id ON public.speaking_submissions(user_id);

-- ============ TRIGGERS ============
-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS exams_updated_at ON public.exams;
CREATE TRIGGER exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
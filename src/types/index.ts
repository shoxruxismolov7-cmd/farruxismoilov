export type UserRole = 'student' | 'admin' | 'super_admin';

export type ExamType = 'ielts' | 'multilevel';
export type ExamSection = 'reading' | 'listening' | 'writing' | 'speaking';
export type ExamStatus = 'draft' | 'published' | 'archived';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'matching_features'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'table_completion'
  | 'flowchart_completion'
  | 'short_answer';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  telegram: string | null;
  goal: string;
  current_level: string;
  target_score: string;
  exam_timeframe: string;
  weakest_skill: string | null;
  theme_preference: string;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  exam_type: ExamType;
  section: ExamSection;
  difficulty: Difficulty;
  duration_minutes: number;
  is_premium: boolean;
  status: ExamStatus;
  total_questions: number;
  created_at: string;
  updated_at: string;
}

export interface ExamSectionData {
  id: string;
  exam_id: string;
  title: string;
  instructions: string | null;
  passage: string | null;
  audio_url: string | null;
  order: number;
  created_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  section_id: string | null;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string | string[] | null;
  explanation: string | null;
  points: number;
  order: number;
  created_at: string;
}

export interface ExamSession {
  id: string;
  user_id: string;
  exam_id: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  remaining_seconds: number | null;
  current_section_id: string | null;
  answers: Record<string, string | string[]>;
  created_at: string;
}

export interface Result {
  id: string;
  user_id: string;
  exam_id: string;
  session_id: string | null;
  total_questions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  raw_score: number;
  band_score: number | null;
  cefr_level: string | null;
  accuracy: number;
  time_spent_seconds: number;
  detailed_results: Record<string, unknown>;
  created_at: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  definition: string | null;
  uz_translation: string | null;
  example_sentence: string | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  pronunciation: string | null;
  audio_url: string | null;
  difficulty: string;
  topic: string | null;
  category: string;
  created_at: string;
}

export interface UserVocabulary {
  id: string;
  user_id: string;
  word_id: string;
  is_learned: boolean;
  is_favorite: boolean;
  review_date: string | null;
  correct_count: number;
  incorrect_count: number;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface PaymentApplication {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_name: string | null;
  amount: number;
  payment_method: string | null;
  transaction_id: string | null;
  receipt_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string | null;
  audience: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface WritingSubmission {
  id: string;
  user_id: string;
  exam_id: string | null;
  task_type: string;
  question_text: string | null;
  answer_text: string | null;
  word_count: number;
  status: string;
  band_score: number | null;
  feedback: string | null;
  assessed_by: string | null;
  assessed_at: string | null;
  created_at: string;
}

export interface SpeakingSubmission {
  id: string;
  user_id: string;
  exam_id: string | null;
  part_number: number;
  question_text: string | null;
  recording_url: string | null;
  duration_seconds: number;
  status: string;
  band_score: number | null;
  feedback: string | null;
  assessed_by: string | null;
  assessed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

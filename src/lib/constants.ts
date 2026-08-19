export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Mock Exams', href: '/#mock-exams' },
  { label: 'IELTS', href: '/#ielts' },
  { label: 'Multilevel', href: '/#multilevel' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
] as const;

export const SKILL_AREAS = ['reading', 'listening', 'writing', 'speaking'] as const;

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  true_false_not_given: 'True / False / Not Given',
  yes_no_not_given: 'Yes / No / Not Given',
  matching_headings: 'Matching Headings',
  matching_information: 'Matching Information',
  matching_features: 'Matching Features',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  note_completion: 'Note Completion',
  table_completion: 'Table Completion',
  flowchart_completion: 'Flow-chart Completion',
  short_answer: 'Short Answer',
};

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Unknown'];

export const IELTS_SCORES = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

export const TIMEFRAMES = ['<1 month', '1-3 months', '3-6 months', '6+ months'];

export const VOCABULARY_CATEGORIES = [
  { value: 'ielts_academic', label: 'IELTS Academic' },
  { value: 'ielts_general', label: 'IELTS General' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'writing', label: 'Writing' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
  { value: 'academic_words', label: 'Academic Words' },
  { value: 'topic_vocabulary', label: 'Topic Vocabulary' },
];

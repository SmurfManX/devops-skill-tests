// Database schema types

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Profession {
  id: number;
  slug: string;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  icon: string;
  created_at: string;
}

export interface Question {
  id: number;
  profession_id: number;
  question_en: string;
  question_ru: string;
  option_a_en: string;
  option_a_ru: string;
  option_b_en: string;
  option_b_ru: string;
  option_c_en: string;
  option_c_ru: string;
  option_d_en: string;
  option_d_ru: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation_en: string;
  explanation_ru: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface TestSession {
  id: number;
  user_id: number | null;
  profession_id: number;
  status: 'in_progress' | 'completed';
  questions_count: number;
  correct_answers: number | null;
  score_percentage: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface UserAnswer {
  id: number;
  test_session_id: number;
  question_id: number;
  user_answer: 'A' | 'B' | 'C' | 'D' | null;
  is_correct: boolean | null;
  answered_at: string | null;
}

// Insert types (without auto-generated fields)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type ProfessionInsert = Omit<Profession, 'id' | 'created_at'>;
export type QuestionInsert = Omit<Question, 'id' | 'created_at'>;
export type TestSessionInsert = Omit<TestSession, 'id' | 'started_at'>;
export type UserAnswerInsert = Omit<UserAnswer, 'id'>;

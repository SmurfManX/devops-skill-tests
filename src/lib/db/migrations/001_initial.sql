-- Initial database schema migration

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Professions table
CREATE TABLE IF NOT EXISTS professions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profession_id INTEGER NOT NULL,
  question_en TEXT NOT NULL,
  question_ru TEXT NOT NULL,
  option_a_en TEXT NOT NULL,
  option_a_ru TEXT NOT NULL,
  option_b_en TEXT NOT NULL,
  option_b_ru TEXT NOT NULL,
  option_c_en TEXT NOT NULL,
  option_c_ru TEXT NOT NULL,
  option_d_en TEXT NOT NULL,
  option_d_ru TEXT NOT NULL,
  correct_answer TEXT CHECK(correct_answer IN ('A', 'B', 'C', 'D')) NOT NULL,
  explanation_en TEXT NOT NULL,
  explanation_ru TEXT NOT NULL,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) NOT NULL DEFAULT 'medium',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profession_id) REFERENCES professions(id) ON DELETE CASCADE
);

-- Test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  profession_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('in_progress', 'completed')) NOT NULL DEFAULT 'in_progress',
  questions_count INTEGER NOT NULL DEFAULT 20,
  correct_answers INTEGER,
  score_percentage REAL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (profession_id) REFERENCES professions(id) ON DELETE CASCADE
);

-- User answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_session_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  user_answer TEXT CHECK(user_answer IN ('A', 'B', 'C', 'D') OR user_answer IS NULL),
  is_correct INTEGER CHECK(is_correct IN (0, 1) OR is_correct IS NULL),
  answered_at TEXT,
  FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_profession ON questions(profession_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_profession ON test_sessions(profession_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_session ON user_answers(test_session_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default profession (DevOps)
INSERT OR IGNORE INTO professions (slug, name_en, name_ru, description_en, description_ru, icon) VALUES (
  'devops',
  'DevOps Engineer',
  'DevOps Инженер',
  'Test your knowledge in DevOps: CI/CD, containerization, orchestration, monitoring, and infrastructure automation',
  'Проверьте свои знания в DevOps: CI/CD, контейнеризация, оркестрация, мониторинг и автоматизация инфраструктуры',
  '⚙️'
);

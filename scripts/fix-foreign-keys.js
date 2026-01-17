const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.db');
const db = new Database(dbPath);

console.log('Fixing foreign keys...');

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Backup current questions
console.log('Creating backup of questions...');
db.exec(`
  CREATE TABLE IF NOT EXISTS questions_backup AS
  SELECT * FROM questions
`);

const count = db.prepare('SELECT COUNT(*) as count FROM questions_backup').get();
console.log(`Backed up ${count.count} questions`);

// Drop existing tables
console.log('Dropping old tables...');
db.exec('DROP TABLE IF EXISTS questions');

// Recreate questions table with proper schema
console.log('Recreating questions table with proper schema...');
db.exec(`
  CREATE TABLE questions (
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
  )
`);

// Restore questions from backup
console.log('Restoring questions from backup...');
db.exec(`
  INSERT INTO questions (
    id, profession_id, question_en, question_ru,
    option_a_en, option_a_ru, option_b_en, option_b_ru,
    option_c_en, option_c_ru, option_d_en, option_d_ru,
    correct_answer, explanation_en, explanation_ru, difficulty, created_at
  )
  SELECT
    id, profession_id, question_en, question_ru,
    option_a_en, option_a_ru, option_b_en, option_b_ru,
    option_c_en, option_c_ru, option_d_en, option_d_ru,
    correct_answer, explanation_en, explanation_ru, difficulty, created_at
  FROM questions_backup
`);

// Recreate index
console.log('Recreating index...');
db.exec('CREATE INDEX IF NOT EXISTS idx_questions_profession ON questions(profession_id)');

// Drop backup
db.exec('DROP TABLE questions_backup');

// Verify
const finalCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
console.log(`Final count: ${finalCount.count} questions`);

db.close();
console.log('Done! Foreign keys fixed.');

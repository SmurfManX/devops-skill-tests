const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.db');
const db = new Database(dbPath);

console.log('Starting duplicate removal...');

// Count before
const beforeCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
console.log(`Total questions before: ${beforeCount.count}`);

// Create a temporary table with unique questions
db.exec(`
  CREATE TABLE IF NOT EXISTS questions_temp AS
  SELECT
    MIN(id) as id,
    profession_id,
    question_en,
    question_ru,
    option_a_en,
    option_a_ru,
    option_b_en,
    option_b_ru,
    option_c_en,
    option_c_ru,
    option_d_en,
    option_d_ru,
    correct_answer,
    explanation_en,
    explanation_ru,
    difficulty,
    created_at
  FROM questions
  GROUP BY
    profession_id,
    question_en,
    question_ru,
    option_a_en,
    option_a_ru,
    option_b_en,
    option_b_ru,
    option_c_en,
    option_c_ru,
    option_d_en,
    option_d_ru,
    correct_answer
`);

console.log('Created temp table with unique questions');

// Get count of unique questions
const uniqueCount = db.prepare('SELECT COUNT(*) as count FROM questions_temp').get();
console.log(`Unique questions: ${uniqueCount.count}`);

// Delete user_answers that reference duplicate questions
db.exec(`
  DELETE FROM user_answers
  WHERE question_id NOT IN (SELECT id FROM questions_temp)
`);

console.log('Cleaned up user_answers references');

// Drop the original questions table
db.exec('DROP TABLE questions');

// Rename temp table to questions
db.exec('ALTER TABLE questions_temp RENAME TO questions');

console.log('Replaced questions table');

// Recreate indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_questions_profession ON questions(profession_id)
`);

console.log('Recreated indexes');

// Count after
const afterCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
console.log(`Total questions after: ${afterCount.count}`);
console.log(`Removed ${beforeCount.count - afterCount.count} duplicate questions`);

db.close();
console.log('Done!');

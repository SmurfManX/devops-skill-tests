const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.db');
const db = new Database(dbPath);

console.log('Cleaning questions...');

// Count before
const beforeCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
console.log(`Questions before: ${beforeCount.count}`);

// Delete all user_answers first (foreign key constraint)
db.exec('DELETE FROM user_answers');
console.log('Deleted all user answers');

// Delete all test sessions
db.exec('DELETE FROM test_sessions');
console.log('Deleted all test sessions');

// Delete all questions
db.exec('DELETE FROM questions');
console.log('Deleted all questions');

// Count after
const afterCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
console.log(`Questions after: ${afterCount.count}`);

db.close();
console.log('Done! Database is clean and ready for new questions.');

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Get database path
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'database.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run migrations
export function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.warn('Migrations directory not found');
    return;
  }

  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  migrationFiles.forEach(file => {
    // Check if migration has already been applied
    const existing = db.prepare('SELECT name FROM migrations WHERE name = ?').get(file);

    if (existing) {
      // Migration already applied, skip
      return;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      db.exec(sql);

      // Record that this migration has been applied
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);

      console.log(`Migration ${file} applied successfully`);
    } catch (error) {
      console.error(`Error applying migration ${file}:`, error);
      throw error;
    }
  });
}

// Initialize database and run migrations on first import
if (process.env.NODE_ENV !== 'production' || !fs.existsSync(dbPath)) {
  runMigrations();
}

export default db;

# IT Skill Tester — IT Specialist Testing Platform

A modern platform for assessing IT specialists’ knowledge with Russian and English language support.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript  
- **Styling**: Tailwind CSS, shadcn/ui  
- **Database**: SQLite (better-sqlite3)  
- **Authentication**: NextAuth.js (planned)  
- **Internationalization**: next-intl  
- **AI**: AI API (for question generation)

## Project Status

### ✅ Done
- Next.js project initialized with TypeScript
- Tailwind CSS and shadcn/ui configured
- Internationalization (RU/EN) with next-intl
- SQLite database with migrations
- DB schema for users, professions, questions, and test sessions
- Question generation script via an AI API

### 🔄 In Progress
- Generating ~100 questions for the DevOps profession

### 📋 Planned
- Authentication system (NextAuth.js)
- Home page with profession selection
- Testing interface
- Results page with detailed breakdown
- Test history
- Rankings and statistics

## Installation & Run

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in the required variables:

```env
ANTHROPIC_API_KEY=your_api_key_here
DATABASE_URL=./data/database.db
```

### 3. Generate questions

Run the script to generate ~100 DevOps questions:

```bash
npm run generate-questions
```

**Note**: Question generation requires an API key. The process may take around 10–15 minutes and typically costs about $1–2.

### 4. Start the project

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Open `http://localhost:3000` in your browser.

## Project Structure

```
skill-tester/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── [locale]/       # Localized pages
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Utilities
│   │   └── db/           # Database
│   ├── types/            # TypeScript types
│   └── i18n/             # Translations
├── scripts/              # Scripts
│   └── generate-questions.ts
├── data/                 # SQLite database
└── public/              # Static files
```

## Database

The project uses SQLite with the following tables:

- **users** — Users
- **professions** — Professions (DevOps, Backend, Frontend, etc.)
- **questions** — Test questions (bilingual)
- **test_sessions** — Testing sessions
- **user_answers** — User answers

The database is automatically initialized on the first run.

## Available Commands

```bash
npm run dev                 # Start development server
npm run build               # Build production version
npm start                   # Start production server
npm run lint                # Lint the codebase
npm run generate-questions  # Generate questions via AI (with duplicate warnings)
npm run clean-questions     # Remove all questions from the database
npm run remove-duplicates   # Remove duplicate questions
```

**Important:** The `generate-questions` script does NOT delete old questions; it appends new ones. If you want a clean database, run `npm run clean-questions` first.

## License

MIT

## Author

Nika Lukava

import Anthropic from '@anthropic-ai/sdk';
import db from '../src/lib/db/client';
import type { QuestionInsert } from '../src/lib/db/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
  console.log('Please set it in your .env file or export it in your shell');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

interface GeneratedQuestion {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

async function generateQuestion(profession: string, language: 'en' | 'ru'): Promise<GeneratedQuestion> {
  const prompt = language === 'en'
    ? `Generate a technical quiz question for a ${profession} professional.

The question should:
- Be practical and relevant to real-world scenarios
- Test actual knowledge, not just definitions
- Have 4 answer options (A, B, C, D) with only one correct answer
- Include a detailed explanation of the correct answer
- Be at an appropriate difficulty level (easy, medium, or hard)

Return ONLY a valid JSON object with this exact structure:
{
  "question": "The question text",
  "option_a": "First option",
  "option_b": "Second option",
  "option_c": "Third option",
  "option_d": "Fourth option",
  "correct_answer": "A",
  "explanation": "Detailed explanation of why the answer is correct",
  "difficulty": "medium"
}

Do not include any markdown formatting or code blocks, just the raw JSON.`
    : `Сгенерируй технический вопрос для теста для специалиста ${profession}.

Вопрос должен:
- Быть практическим и релевантным для реальных сценариев
- Проверять реальные знания, а не только определения
- Иметь 4 варианта ответа (A, B, C, D) с только одним правильным ответом
- Включать детальное объяснение правильного ответа
- Быть соответствующего уровня сложности (easy, medium или hard)

Верни ТОЛЬКО валидный JSON объект с такой структурой:
{
  "question": "Текст вопроса",
  "option_a": "Первый вариант",
  "option_b": "Второй вариант",
  "option_c": "Третий вариант",
  "option_d": "Четвертый вариант",
  "correct_answer": "A",
  "explanation": "Детальное объяснение, почему ответ правильный",
  "difficulty": "medium"
}

Не включай markdown форматирование или блоки кода, только чистый JSON.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from API');
    }

    // Extract JSON from response (in case it's wrapped in markdown)
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const question: GeneratedQuestion = JSON.parse(jsonText);

    // Validate the response
    if (!question.question || !question.option_a || !question.option_b ||
        !question.option_c || !question.option_d || !question.correct_answer ||
        !question.explanation || !question.difficulty) {
      throw new Error('Invalid question structure returned from API');
    }

    return question;
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

async function saveQuestion(question: GeneratedQuestion, questionRu: GeneratedQuestion, professionId: number) {
  const insert: QuestionInsert = {
    profession_id: professionId,
    question_en: question.question,
    question_ru: questionRu.question,
    option_a_en: question.option_a,
    option_a_ru: questionRu.option_a,
    option_b_en: question.option_b,
    option_b_ru: questionRu.option_b,
    option_c_en: question.option_c,
    option_c_ru: questionRu.option_c,
    option_d_en: question.option_d,
    option_d_ru: questionRu.option_d,
    correct_answer: question.correct_answer,
    explanation_en: question.explanation,
    explanation_ru: questionRu.explanation,
    difficulty: question.difficulty,
  };

  const stmt = db.prepare(`
    INSERT INTO questions (
      profession_id, question_en, question_ru,
      option_a_en, option_a_ru, option_b_en, option_b_ru,
      option_c_en, option_c_ru, option_d_en, option_d_ru,
      correct_answer, explanation_en, explanation_ru, difficulty
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    insert.profession_id,
    insert.question_en,
    insert.question_ru,
    insert.option_a_en,
    insert.option_a_ru,
    insert.option_b_en,
    insert.option_b_ru,
    insert.option_c_en,
    insert.option_c_ru,
    insert.option_d_en,
    insert.option_d_ru,
    insert.correct_answer,
    insert.explanation_en,
    insert.explanation_ru,
    insert.difficulty
  );
}

async function main() {
  console.log('Starting DevOps question generation...\n');

  // Get DevOps profession ID
  const profession = db.prepare('SELECT id FROM professions WHERE slug = ?').get('devops') as { id: number } | undefined;

  if (!profession) {
    console.error('DevOps profession not found in database');
    process.exit(1);
  }

  // Check existing questions
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM questions WHERE profession_id = ?')
    .get(profession.id) as { count: number };

  console.log(`Current questions in database: ${existingCount.count}`);

  if (existingCount.count > 0) {
    console.log('\n⚠️  Warning: Questions already exist in the database!');
    console.log('This script will ADD more questions, not replace existing ones.');
    console.log('If you want to start fresh, run: npm run clean-questions\n');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const totalQuestions = 100; // ~50 will be unique pairs (EN + RU versions)
  const questionsPerBatch = 2; // Generate EN and RU together

  for (let i = 0; i < totalQuestions / 2; i++) {
    try {
      console.log(`Generating question pair ${i + 1}/${totalQuestions / 2}...`);

      // Generate English version
      console.log('  - Generating English version...');
      const questionEn = await generateQuestion('DevOps Engineer', 'en');

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate Russian version
      console.log('  - Generating Russian version...');
      const questionRu = await generateQuestion('DevOps Инженер', 'ru');

      // Save to database
      saveQuestion(questionEn, questionRu, profession.id);
      console.log(`  ✓ Question pair ${i + 1} saved successfully\n`);

      // Delay between pairs to avoid rate limiting
      if (i < (totalQuestions / 2) - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error generating question pair ${i + 1}:`, error);
      console.log('Continuing with next question...\n');
    }
  }

  // Get final count
  const count = db.prepare('SELECT COUNT(*) as count FROM questions WHERE profession_id = ?')
    .get(profession.id) as { count: number };

  console.log(`\nGeneration complete! Total questions in database: ${count.count}`);

  db.close();
}

main().catch(console.error);

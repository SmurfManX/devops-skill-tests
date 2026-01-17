import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { professionSlug, questionsCount } = body;

    if (!professionSlug || !questionsCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get profession
    const profession = db.prepare('SELECT * FROM professions WHERE slug = ?').get(professionSlug) as any;

    if (!profession) {
      return NextResponse.json(
        { error: 'Profession not found' },
        { status: 404 }
      );
    }

    // Create test session
    const insertSession = db.prepare(`
      INSERT INTO test_sessions (user_id, profession_id, status, questions_count)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertSession.run(null, profession.id, 'in_progress', questionsCount);
    const sessionId = result.lastInsertRowid;

    // Get random questions
    const questions = db.prepare(`
      SELECT id, question_en, question_ru,
             option_a_en, option_a_ru,
             option_b_en, option_b_ru,
             option_c_en, option_c_ru,
             option_d_en, option_d_ru,
             difficulty
      FROM questions
      WHERE profession_id = ?
      ORDER BY RANDOM()
      LIMIT ?
    `).all(profession.id, questionsCount) as any[];

    // Create user_answers entries
    const insertAnswer = db.prepare(`
      INSERT INTO user_answers (test_session_id, question_id, user_answer, is_correct)
      VALUES (?, ?, NULL, NULL)
    `);

    for (const question of questions) {
      insertAnswer.run(sessionId, question.id);
    }

    return NextResponse.json({
      sessionId: sessionId.toString(),
      professionId: profession.id,
      questionsCount,
      questions: questions.map((q, index) => ({
        id: q.id,
        order: index + 1,
        question_en: q.question_en,
        question_ru: q.question_ru,
        options: {
          A: { en: q.option_a_en, ru: q.option_a_ru },
          B: { en: q.option_b_en, ru: q.option_b_ru },
          C: { en: q.option_c_en, ru: q.option_c_ru },
          D: { en: q.option_d_en, ru: q.option_d_ru },
        },
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    console.error('Error creating test session:', error);
    return NextResponse.json(
      { error: 'Failed to create test session' },
      { status: 500 }
    );
  }
}

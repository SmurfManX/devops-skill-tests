import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get test session
    const session = db.prepare(`
      SELECT ts.*, p.name_ru, p.name_en, p.slug
      FROM test_sessions ts
      JOIN professions p ON ts.profession_id = p.id
      WHERE ts.id = ?
    `).get(sessionId) as any;

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update session status to completed if not already
    if (session.status !== 'completed') {
      db.prepare(`
        UPDATE test_sessions
        SET status = 'completed', completed_at = datetime('now')
        WHERE id = ?
      `).run(sessionId);
    }

    // Get all questions with user answers
    const questions = db.prepare(`
      SELECT
        q.*,
        ua.user_answer,
        ua.is_correct,
        ua.answered_at
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.test_session_id = ?
      ORDER BY ua.id ASC
    `).all(sessionId) as any[];

    // Calculate statistics
    const totalQuestions = questions.length;
    const correctAnswers = questions.filter(q => q.is_correct === 1).length;
    const incorrectAnswers = questions.filter(q => q.is_correct === 0).length;
    const skippedAnswers = questions.filter(q => q.user_answer === null).length;
    const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Update session with final score
    db.prepare(`
      UPDATE test_sessions
      SET score_percentage = ?, correct_answers = ?
      WHERE id = ?
    `).run(percentage, correctAnswers, sessionId);

    return NextResponse.json({
      sessionId,
      professionName: session.name_en,
      professionSlug: session.slug,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      skippedAnswers,
      percentage,
      questions: questions.map(q => ({
        id: q.id,
        question_en: q.question_en,
        question_ru: q.question_ru,
        user_answer: q.user_answer,
        correct_answer: q.correct_answer,
        is_correct: q.is_correct === 1,
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
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}

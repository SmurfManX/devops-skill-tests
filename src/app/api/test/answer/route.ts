import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, answer } = body;

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get correct answer
    const question = db.prepare('SELECT correct_answer FROM questions WHERE id = ?').get(questionId) as any;

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const isCorrect = question.correct_answer === answer ? 1 : 0;

    // Update user answer
    const updateAnswer = db.prepare(`
      UPDATE user_answers
      SET user_answer = ?, is_correct = ?, answered_at = datetime('now')
      WHERE test_session_id = ? AND question_id = ?
    `);

    updateAnswer.run(answer, isCorrect, sessionId, questionId);

    return NextResponse.json({
      isCorrect: isCorrect === 1,
      correctAnswer: question.correct_answer,
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}

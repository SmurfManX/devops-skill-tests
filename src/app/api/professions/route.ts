import { NextResponse } from 'next/server';
import db from '@/lib/db/client';
import type { Profession } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const professions = db.prepare(`
      SELECT
        p.*,
        COUNT(q.id) as questions_count
      FROM professions p
      LEFT JOIN questions q ON p.id = q.profession_id
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `).all() as (Profession & { questions_count: number })[];

    return NextResponse.json(professions);
  } catch (error) {
    console.error('Error fetching professions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch professions' },
      { status: 500 }
    );
  }
}

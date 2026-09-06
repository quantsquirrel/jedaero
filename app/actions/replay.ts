'use server';
// AI-9 서버 액션 — 저장된 한 줄을 다시 필터한 뒤 편성과 함께 되짚는다.
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { allocations, reviews } from '../../db/schema';
import { guardedAiCall } from '../../lib/ai/guard';
import {
  buildReplayAiInput,
  generateReplayNarrative,
  replayFallback,
  type ReplayNarrative,
} from '../../lib/ai/replay';
import { detectInjection } from '../../lib/filters/injection-filter';
import { buildReplayWeeks } from '../../lib/principles/replay';
import { getSessionUser } from '../../lib/session';
import type { Weights } from '../../lib/constants';

export type ReplayResult =
  | { narrative: ReplayNarrative; source: 'ai' | 'rule'; notice?: string }
  | { error: string };

export async function generateReplayAction(): Promise<ReplayResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const [allocRows, reviewRows] = await Promise.all([
    db
      .select({ weekOf: allocations.weekOf, weights: allocations.weights })
      .from(allocations)
      .where(eq(allocations.userId, user.id))
      .orderBy(asc(allocations.weekOf)),
    db
      .select({ weekOf: reviews.weekOf, body: reviews.body })
      .from(reviews)
      .where(eq(reviews.userId, user.id)),
  ]);

  const safeReviews = reviewRows.filter((r) => !detectInjection(r.body).blocked);
  if (safeReviews.length === 0) {
    return { error: '남긴 한 줄이 있으면 이 자리가 열립니다.' };
  }

  const weeks = buildReplayWeeks({
    allocations: allocRows.map((r) => ({ weekOf: r.weekOf, weights: r.weights as Weights })),
    reviews: safeReviews,
  });
  const input = buildReplayAiInput(weeks);

  const result = await guardedAiCall(user.id, 'AI-9', () => generateReplayNarrative(input));
  if ('ok' in result) return { narrative: result.ok, source: 'ai' };
  return { narrative: replayFallback(input), source: 'rule', notice: result.message };
}

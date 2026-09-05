'use server';
// AI-8 서버 액션 — guardedAiCall이 킬스위치·429·호출 기록을 담당한다 (기존 파이프라인 그대로).
// ★ 요일로 잠그지 않는다. 심사 5일이 전부 평일이므로 잠기면 평가에서 사라진다.
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { allocations } from '../../db/schema';
import { guardedAiCall } from '../../lib/ai/guard';
import {
  buildPrinciplesInput,
  generatePrinciplesNarrative,
  principlesFallback,
  type PrincipleNarrative,
} from '../../lib/ai/principles';
import { myAssetMix } from '../../lib/principles/facts';
import { getSessionUser } from '../../lib/session';
import type { Weights } from '../../lib/constants';

export type PrinciplesResult =
  | { narrative: PrincipleNarrative; source: 'ai' | 'rule'; notice?: string }
  | { error: string };

export async function generatePrinciplesAction(): Promise<PrinciplesResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const rows = await db
    .select({ weights: allocations.weights })
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom));
  if (rows.length === 0) return { error: '아직 편성 기록이 없습니다. 주말에 첫 편성을 확정하면 열립니다.' };

  const latest = rows[rows.length - 1].weights as Weights;
  const input = buildPrinciplesInput(myAssetMix(latest));

  const result = await guardedAiCall(user.id, 'AI-8', () => generatePrinciplesNarrative(input));
  if ('ok' in result) return { narrative: result.ok, source: 'ai' };
  return { narrative: principlesFallback(input), source: 'rule', notice: result.message };
}

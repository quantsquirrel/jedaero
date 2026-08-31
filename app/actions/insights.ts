'use server';
// AI-7 옵트인·AI 서술 생성
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import { guardedAiCall } from '../../lib/ai/guard';
import { generateNarrative } from '../../lib/ai/narrative';
import { computeInsightStats } from '../../lib/insights-data';
import { getSessionUser } from '../../lib/session';

export async function setAnalyticsOptIn(agree: boolean): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  await db.update(users).set({ analyticsOptIn: agree }).where(eq(users.id, user.id));
  revalidatePath('/insights');
  return {};
}

export type NarrativeResult = { text: string; source: 'ai' } | { error: string };

/** AI 사실 서술 생성 — 킬스위치·rate limit 가드 적용. 실패 시 화면의 규칙 기반 서술이 남는다 */
export async function generateNarrativeAction(): Promise<NarrativeResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  if (!user.analyticsOptIn) return { error: '집단 성향 분석에 동의한 뒤 이용할 수 있습니다.' };

  const data = await computeInsightStats(user);
  if (!data) return { error: '아직 배분 이력이 없습니다.' };

  const result = await guardedAiCall(user.id, 'AI-7', () =>
    generateNarrative(data.stats, data.themeName),
  );
  if ('ok' in result) return { text: result.ok, source: 'ai' };
  return { error: result.message };
}

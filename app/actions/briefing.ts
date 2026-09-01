'use server';
// AI-4 주간 브리핑 — 규칙 기반 등락 계산 + LLM 요약. 주말·공휴일에만 연다 (SPEC §3-4).
// 평일에 열지 않는 이유는 "접속을 못 해서"가 아니라 장중에 보지 않는 훈련이기 때문이다.
import { desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { allocations } from '../../db/schema';
import { generateBriefing, briefingFallback, type Briefing } from '../../lib/ai/briefing';
import { guardedAiCall } from '../../lib/ai/guard';
import { currentDayType } from '../../lib/day-context';
import { kstToday } from '../../lib/day-type';
import { computeMarketWeek } from '../../lib/market-week';
import { getSessionUser } from '../../lib/session';
import type { ThemeCode } from '../../lib/constants';

export type BriefingResult =
  | { briefing: Briefing; source: 'ai' | 'rule'; notice?: string }
  | { error: string };

export async function generateBriefingAction(): Promise<BriefingResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  if ((await currentDayType()) !== 'WEEKEND')
    return { error: '주간 브리핑은 주말에 열립니다. 장중에 보지 않는 훈련입니다.' };

  const [latest] = await db
    .select({ weights: allocations.weights })
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(desc(allocations.effectiveFrom))
    .limit(1);

  const week = computeMarketWeek(kstToday(), (latest?.weights ?? {}) as Partial<Record<ThemeCode, number>>);
  if (!week) return { error: '아직 집계할 거래 구간이 없습니다.' };

  const result = await guardedAiCall(user.id, 'AI-4', () => generateBriefing(week));
  if ('ok' in result) return { briefing: result.ok, source: 'ai' };

  // 킬스위치·429·호출 실패 — 어느 쪽이든 규칙 기반 요약이 같은 자리에 뜬다. 화면은 비지 않는다.
  return { briefing: briefingFallback(week), source: 'rule', notice: result.message };
}

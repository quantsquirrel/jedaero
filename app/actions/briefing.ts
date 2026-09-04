'use server';
// AI-4 주간 브리핑 — 주말 가드와 평일 액션을 분리한다.
// 주말 액션은 가중 등락을 넣는다. 평일 액션은 전선 등락만.
import { desc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { allocations } from '../../db/schema';
import { generateBriefing, briefingFallback, generateWeekdayBriefing, weekdayBriefingFallback, type Briefing, type WeekdayBriefing } from '../../lib/ai/briefing';
import { guardedAiCall } from '../../lib/ai/guard';
import { currentDayType } from '../../lib/day-context';
import { kstToday } from '../../lib/day-type';
import { computeMarketWeek } from '../../lib/market-week';
import { getSessionUser } from '../../lib/session';
import type { ThemeCode } from '../../lib/constants';

export type BriefingResult =
  | { briefing: Briefing; source: 'ai' | 'rule'; notice?: string }
  | { error: string };

export type WeekdayBriefingResult =
  | { briefing: WeekdayBriefing; source: 'ai' | 'rule'; notice?: string }
  | { error: string };

async function latestWeights(userId: string) {
  const [latest] = await db
    .select({ weights: allocations.weights })
    .from(allocations)
    .where(eq(allocations.userId, userId))
    .orderBy(desc(allocations.effectiveFrom))
    .limit(1);
  return (latest?.weights ?? {}) as Partial<Record<ThemeCode, number>>;
}

export async function generateBriefingAction(): Promise<BriefingResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  if ((await currentDayType()) !== 'WEEKEND')
    return { error: '주간 브리핑은 주말에 열립니다. 장중에 보지 않는 훈련입니다.' };

  const weights = await latestWeights(user.id);
  const week = computeMarketWeek(kstToday(), weights);
  if (!week) return { error: '아직 집계할 거래 구간이 없습니다.' };

  const result = await guardedAiCall(user.id, 'AI-4', () => generateBriefing(week));
  if ('ok' in result) return { briefing: result.ok, source: 'ai' };

  // 킬스위치·429·호출 실패 — 어느 쪽이든 규칙 기반 요약이 같은 자리에 뜬다. 화면은 비지 않는다.
  return { briefing: briefingFallback(week), source: 'rule', notice: result.message };
}

export async function generateWeekdayBriefingAction(): Promise<WeekdayBriefingResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  if ((await currentDayType()) !== 'WEEKDAY')
    return { error: '평일 지형 요약은 평일에 열립니다. 이번 주 손익은 주말에 봅니다.' };

  const weights = await latestWeights(user.id);
  const week = computeMarketWeek(kstToday(), weights);
  if (!week) return { error: '아직 집계할 거래 구간이 없습니다.' };

  const result = await guardedAiCall(user.id, 'AI-4', () => generateWeekdayBriefing(week));
  if ('ok' in result) return { briefing: result.ok, source: 'ai' };
  return { briefing: weekdayBriefingFallback(week), source: 'rule', notice: result.message };
}

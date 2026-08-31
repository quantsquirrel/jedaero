// 동기 코호트 리그 (SPEC §3-8) — 주간 시즌제, 누적 순위 없음 (C7)
// 지표는 예산 준수율 + XP. 수익률은 순위 대신 코호트 분포 안의 백분위로만 보여주고,
// 변동성·최대낙폭·집중도를 반드시 함께 표시한다.
// ★ 랭킹은 전역(일시금) 곡선의 TWR만 사용한다. 다른 곡선은 여기에 절대 넣지 않는다.
import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { db } from '../db';
import { allocations, budgetEnvelopes, budgetMonths, users, weeklyScores } from '../db/schema';
import { budgetAccuracy } from './budget';
import { SEED_AMOUNT } from './constants';
import { kstToday } from './day-type';
import { computeCurve, type WeightHistoryItem } from './portfolio/engine';
import { pricesUpTo } from './portfolio/prices';
import { twr } from './portfolio/twr';
import { weekXp } from './quests';
import { mondayOfWeeksAgo, weekOf } from './week';
import type { SessionUser } from './session';

export type WeeklyScore = { twrPct: number | null; budgetAccuracy: number | null; xp: number };

/** 내 이번 주 점수를 요청 시점에 계산해 weekly_scores에 lazy upsert (크론 없음) */
export async function computeAndStoreWeeklyScore(user: SessionUser): Promise<WeeklyScore> {
  const week = weekOf(new Date());
  const today = kstToday();

  // 이번 주 TWR — 전역(일시금) 곡선. 주 시작 전 마지막 평가액 → 최신 평가액
  let twrPct: number | null = null;
  const allocs = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(allocations.effectiveFrom);
  if (allocs.length > 0) {
    const { dates, series } = pricesUpTo(today);
    const history: WeightHistoryItem[] = allocs.map((a) => ({
      effectiveFrom: a.effectiveFrom,
      weights: a.weights as Record<string, number>,
      details: (a.details as Record<string, Record<string, number>> | null) ?? null,
    }));
    const { values } = computeCurve(dates, series, history, {
      [allocs[0].effectiveFrom]: SEED_AMOUNT,
    });
    const monday = mondayOfWeeksAgo(new Date(), 0);
    let startIdx = -1;
    for (let i = 0; i < dates.length; i++) if (dates[i] < monday) startIdx = i;
    const start = startIdx >= 0 ? values[startIdx] : 0;
    const end = values[values.length - 1] ?? 0;
    if (start > 0 && end > 0) twrPct = twr([{ start, flow: 0, end }]) * 100;
  }

  // 이번 달 예산 준수율
  let accuracy: number | null = null;
  const ym = today.slice(0, 7);
  const [bm] = await db
    .select()
    .from(budgetMonths)
    .where(and(eq(budgetMonths.userId, user.id), eq(budgetMonths.yearMonth, ym)))
    .limit(1);
  if (bm) {
    const envs = await db
      .select()
      .from(budgetEnvelopes)
      .where(eq(budgetEnvelopes.budgetMonthId, bm.id));
    if (envs.length > 0) accuracy = budgetAccuracy(envs);
  }

  const xp = await weekXp(user.id, week);

  const existing = await db
    .select({ id: weeklyScores.id })
    .from(weeklyScores)
    .where(and(eq(weeklyScores.userId, user.id), eq(weeklyScores.weekOf, week)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(weeklyScores)
      .set({ twrPct, budgetAccuracy: accuracy, xp })
      .where(eq(weeklyScores.id, existing[0].id));
  } else {
    await db.insert(weeklyScores).values({ userId: user.id, weekOf: week, twrPct, budgetAccuracy: accuracy, xp });
  }
  return { twrPct, budgetAccuracy: accuracy, xp };
}

/** 값 배열에서 내 값의 백분위 (0~100, 내 값보다 작은 비율) */
export function percentile(values: number[], mine: number): number {
  if (values.length === 0) return 50;
  const below = values.filter((v) => v < mine).length;
  return Math.round((below / values.length) * 100);
}

export type CohortView = {
  cohortMonth: string; // 전역 예정 연월
  n: number;
  accuracyPercentile: number | null;
  xpPercentile: number;
  twrPercentile: number | null;
};

/** 동기 코호트(전역 예정 월 자동 배정) 안에서 내 위치. 수익률은 백분위만 — 순위·금액 없음 */
export async function cohortView(user: SessionUser, mine: WeeklyScore): Promise<CohortView> {
  const week = weekOf(new Date());
  const cohortMonth = user.dischargeAt.slice(0, 7);
  const monthStart = `${cohortMonth}-01`;
  const nextMonth = new Date(`${monthStart}T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const peers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(gte(users.dischargeAt, monthStart), lt(users.dischargeAt, monthEnd)));
  const peerIds = peers.map((p) => p.id).filter((id) => id !== user.id);

  let scores: { twrPct: number | null; budgetAccuracy: number | null; xp: number | null }[] = [];
  if (peerIds.length > 0) {
    scores = await db
      .select({
        twrPct: weeklyScores.twrPct,
        budgetAccuracy: weeklyScores.budgetAccuracy,
        xp: weeklyScores.xp,
      })
      .from(weeklyScores)
      .where(and(inArray(weeklyScores.userId, peerIds), eq(weeklyScores.weekOf, week)));
  }

  const accs = scores.map((s) => s.budgetAccuracy).filter((v): v is number => v != null);
  const twrs = scores.map((s) => s.twrPct).filter((v): v is number => v != null);
  const xps = scores.map((s) => s.xp ?? 0);

  return {
    cohortMonth,
    n: scores.length + 1,
    accuracyPercentile: mine.budgetAccuracy != null && accs.length > 0 ? percentile(accs, mine.budgetAccuracy) : null,
    xpPercentile: percentile(xps, mine.xp),
    twrPercentile: mine.twrPct != null && twrs.length > 0 ? percentile(twrs, mine.twrPct) : null,
  };
}

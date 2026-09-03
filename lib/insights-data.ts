// AI-7 통계 계산 (DB 접근층). 숫자는 전부 서버에서 규칙 기반으로 계산한다 — AI가 아니다.
// LLM(narrative)은 이 숫자를 문장으로 서술만 한다.
import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { db } from '../db';
import { allocations, users } from '../db/schema';
import { SEED_AMOUNT, THEMES, THEME_CODES, type ThemeCode, type Weights } from './constants';
import { kstToday } from './day-type';
import {
  annualizedVol,
  hhi,
  maxWeightOf,
  median,
  reserveWeight,
  resolveCohort,
  turnover,
  type InsightStats,
} from './insights';
import { computeCurve, type WeightHistoryItem } from './portfolio/engine';
import { pricesUpTo } from './portfolio/prices';
import { weekOf } from './week';
import type { SessionUser } from './session';

function monthRange(ym: string): [string, string] {
  const start = `${ym}-01`;
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return [start, d.toISOString().slice(0, 10)];
}

function quarterRange(ym: string): [string, string] {
  const year = Number(ym.slice(0, 4));
  const q = Math.floor((Number(ym.slice(5, 7)) - 1) / 3);
  const start = new Date(Date.UTC(year, q * 3, 1));
  const end = new Date(Date.UTC(year, q * 3 + 3, 1));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

async function optedInUserIds(range: [string, string] | null, exclude: string): Promise<string[]> {
  const conds = [eq(users.analyticsOptIn, true)];
  if (range) conds.push(gte(users.dischargeAt, range[0]), lt(users.dischargeAt, range[1]));
  const rows = await db.select({ id: users.id }).from(users).where(and(...conds));
  return rows.map((r) => r.id).filter((id) => id !== exclude);
}

export type InsightData = { stats: InsightStats; themeName: string };

/** 내 배분 + 동의자 코호트 분포로 5개 축 통계 계산. 내 배분이 없으면 null */
export async function computeInsightStats(user: SessionUser): Promise<InsightData | null> {
  const myAllocs = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(allocations.effectiveFrom);
  if (myAllocs.length === 0) return null;

  const myHistory = myAllocs.map((a) => a.weights as Weights);
  const myWeights = myHistory[myHistory.length - 1];

  // k-익명성: 코호트 n<20 → 상위 코호트로 합산 (월 → 분기 → 전체)
  const cohortMonth = user.dischargeAt.slice(0, 7);
  const monthIds = await optedInUserIds(monthRange(cohortMonth), user.id);
  const quarterIds = await optedInUserIds(quarterRange(cohortMonth), user.id);
  const cohort = resolveCohort(monthIds.length, quarterIds.length);
  const cohortIds =
    cohort === 'MONTH' ? monthIds : cohort === 'QUARTER' ? quarterIds : await optedInUserIds(null, user.id);

  // 코호트 구성원별 최신 배분·이력
  const cohortAllocs =
    cohortIds.length > 0
      ? await db
          .select()
          .from(allocations)
          .where(inArray(allocations.userId, cohortIds))
          .orderBy(allocations.effectiveFrom)
      : [];
  const byUser = new Map<string, Weights[]>();
  for (const a of cohortAllocs) {
    const list = byUser.get(a.userId) ?? [];
    list.push(a.weights as Weights);
    byUser.set(a.userId, list);
  }
  const latestList = [...byUser.values()].map((l) => l[l.length - 1]);
  const turnoverList = [...byUser.values()].map((l) => turnover(l));

  // 내 변동성: 전역(일시금) 곡선의 연환산 변동성
  const { dates, series } = pricesUpTo(kstToday());
  const history: WeightHistoryItem[] = myAllocs.map((a) => ({
    effectiveFrom: a.effectiveFrom,
    weights: a.weights as Record<string, number>,
    details: (a.details as Record<string, Record<string, number>> | null) ?? null,
  }));
  const { values } = computeCurve(dates, series, history, {
    [myAllocs[0].effectiveFrom]: SEED_AMOUNT,
  });

  // 최근 몇 주 동안 비중을 바꾸지 않았나 (최신 결정 주차와 현재 주차의 간격)
  const lastWeek = myAllocs[myAllocs.length - 1].weekOf;
  const nowWeek = weekOf(new Date());
  const weeksUnchanged = Math.max(0, weekIndex(nowWeek) - weekIndex(lastWeek));

  const myMaxWeight = maxWeightOf(myWeights);
  const myMaxCode = THEME_CODES.find((c) => (myWeights[c] ?? 0) === myMaxWeight) ?? THEME_CODES[0];

  const stats: InsightStats = {
    cohort,
    cohortN: cohortIds.length,
    myMaxTheme: { code: myMaxCode as ThemeCode, weight: myMaxWeight },
    cohortMaxWeightMedian: median(latestList.map(maxWeightOf)),
    myHhi: hhi(myWeights),
    myTurnover: turnover(myHistory),
    cohortTurnoverMedian: median(turnoverList),
    // 현금 = 예비대(미배치분). 「현금성」 축을 없앴으므로 잔여로 계산한다 (DESIGN-DECISIONS §3)
    myCash: reserveWeight(myWeights),
    cohortCashMedian: median(latestList.map(reserveWeight)),
    myVol: annualizedVol(values),
    weeksUnchanged,
  };
  const themeName = THEMES.find((t) => t.code === myMaxCode)?.name ?? myMaxCode;
  return { stats, themeName };
}

/** 'YYYY-WW' → 대략적 절대 주차 인덱스 (주차 간격 계산용) */
function weekIndex(weekStr: string): number {
  const [y, w] = weekStr.split('-').map(Number);
  return y * 53 + w;
}

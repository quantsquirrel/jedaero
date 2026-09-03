// 내 편성 한 줄 요약 — 홈·포트폴리오가 같은 숫자를 보게 하는 단일 창구.
// ★ 보유수량을 저장하지 않는다. 여기서도 (비중 이력 × 종가)로 요청 시점에 계산한다.
// ★ 곡선은 전역(일시금) 하나뿐이다. 두 곡선을 합산한 "총 자산"을 만들지 말 것.
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { allocations } from '../../db/schema';
import { SEED_AMOUNT, type Weights } from '../constants';
import { kstToday } from '../day-type';
import { computeCurve, type WeightHistoryItem } from './engine';
import { pricesUpTo } from './prices';
import type { Details } from './details';

export type PortfolioSummary = {
  hasAllocation: boolean;
  /** 첫 체결 전이면 true — 곡선에 아직 아무것도 담기지 않았다 */
  awaitingFirstFill: boolean;
  weights: Partial<Weights>;
  details: Details | null;
  /** 마지막으로 확정한 편성의 체결 기준일 */
  effectiveFrom: string | null;
  value: number;
  /** 시드 대비 누적 (0.032 = +3.2%) */
  cumulativePct: number;
};

const EMPTY: PortfolioSummary = {
  hasAllocation: false,
  awaitingFirstFill: true,
  weights: {},
  details: null,
  effectiveFrom: null,
  value: SEED_AMOUNT,
  cumulativePct: 0,
};

export async function portfolioSummary(userId: string): Promise<PortfolioSummary> {
  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, userId))
    .orderBy(asc(allocations.effectiveFrom), asc(allocations.decidedAt));
  if (rows.length === 0) return EMPTY;

  const latest = rows[rows.length - 1];
  const { dates, series } = pricesUpTo(kstToday());
  const history: WeightHistoryItem[] = rows.map((r) => ({
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Record<string, number>,
    details: (r.details as Record<string, Record<string, number>> | null) ?? null,
  }));
  const curve = computeCurve(dates, series, history, { [rows[0].effectiveFrom]: SEED_AMOUNT });
  const value = curve.values[curve.values.length - 1] ?? 0;

  return {
    hasAllocation: true,
    awaitingFirstFill: curve.invested === 0,
    weights: (latest.weights ?? {}) as Partial<Weights>,
    details: (latest.details as Details | null) ?? null,
    effectiveFrom: latest.effectiveFrom,
    value,
    cumulativePct: curve.invested === 0 ? 0 : value / SEED_AMOUNT - 1,
  };
}

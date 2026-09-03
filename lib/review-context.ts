// AI-3 회고에 넣을 "이번 주 사실" 수집 — 전부 규칙 기반. LLM은 이 숫자를 받기만 한다.
// 회고 텍스트는 저장하지 않는다 (스키마에 컬럼 없음). 여기서 만든 사실도 저장하지 않는다.
// ★ 가계부 제거로 지출·봉투 사실이 빠졌다. 남은 것은 전부 편성에 관한 사실이다.
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { allocations } from '../db/schema';
import { THEME_CODES, type Weights } from './constants';
import { weekOf } from './week';

export type ReviewFacts = {
  weekOf: string;
  changedThisWeek: boolean;
  /** 회전율 = Σ|Δ비중| ÷ 2 (%p). 바꾸지 않았으면 0 */
  turnoverPp: number;
  weeksUnchanged: number;
  /** 이번 주 편성에서 어느 전선에도 놓지 않은 몫 (%) */
  reservePct: number;
};

/** 두 배분 사이의 회전율(%p). Σ|Δ| ÷ 2 — 한쪽이 늘면 다른 쪽이 줄기 때문에 반으로 나눈다 */
export function turnover(a: Weights, b: Weights): number {
  let sum = 0;
  for (const c of THEME_CODES) sum += Math.abs((b[c] ?? 0) - (a[c] ?? 0));
  return sum / 2;
}

export async function collectReviewFacts(userId: string): Promise<ReviewFacts> {
  const now = new Date();
  const thisWeek = weekOf(now);

  const allocRows = await db
    .select({ weekOf: allocations.weekOf, weights: allocations.weights })
    .from(allocations)
    .where(eq(allocations.userId, userId))
    .orderBy(allocations.effectiveFrom);

  const changedThisWeek = allocRows.some((r) => r.weekOf === thisWeek);
  const n = allocRows.length;
  const turnoverPp =
    changedThisWeek && n >= 2
      ? turnover(allocRows[n - 2].weights as Weights, allocRows[n - 1].weights as Weights)
      : 0;

  // 마지막 조정 이후 몇 주가 지났나 — 아무것도 안 한 것도 유효한 선택이므로 사실로 보여준다
  let weeksUnchanged = 0;
  if (!changedThisWeek && n > 0) {
    const [y, w] = thisWeek.split('-').map(Number);
    const [ly, lw] = allocRows[n - 1].weekOf.split('-').map(Number);
    weeksUnchanged = Math.max(0, (y - ly) * 52 + (w - lw));
  }

  const latest = n > 0 ? (allocRows[n - 1].weights as Weights) : null;
  const reservePct = latest
    ? Math.max(0, 100 - THEME_CODES.reduce((s, c) => s + (latest[c] ?? 0), 0))
    : 0;

  return { weekOf: thisWeek, changedThisWeek, turnoverPp, weeksUnchanged, reservePct };
}

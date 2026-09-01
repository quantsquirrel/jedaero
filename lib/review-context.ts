// AI-3 회고에 넣을 "이번 주 사실" 수집 — 전부 규칙 기반. LLM은 이 숫자를 받기만 한다.
// 회고 텍스트는 저장하지 않는다 (스키마에 컬럼 없음). 여기서 만든 사실도 저장하지 않는다.
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../db';
import { allocations, budgetEnvelopes, budgetMonths, expenses } from '../db/schema';
import { matchCategory } from './budget';
import { THEME_CODES, type Weights } from './constants';
import { kstToday } from './day-type';
import { weekOf } from './week';

export type ReviewFacts = {
  weekOf: string;
  changedThisWeek: boolean;
  /** 회전율 = Σ|Δ비중| ÷ 2 (%p). 바꾸지 않았으면 0 */
  turnoverPp: number;
  weeksUnchanged: number;
  recordedCount: number; // 이번 달 기록한 지출 건수 (주 단위로는 표본이 너무 작다)
  unconfirmedCount: number; // 아직 확정하지 않은 분류
  overspent: { category: string; allocated: number; spent: number }[];
  envelopeCount: number;
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
  const today = kstToday();
  const thisMonth = today.slice(0, 7);

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

  const monthExpenses = await db
    .select({ confirmedByUser: expenses.confirmedByUser })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), gte(expenses.occurredOn, `${thisMonth}-01`)));

  // 봉투 초과 — /budget과 같은 규칙으로 요청 시점에 집계한다
  const [month] = await db
    .select({ id: budgetMonths.id })
    .from(budgetMonths)
    .where(and(eq(budgetMonths.userId, userId), eq(budgetMonths.yearMonth, thisMonth)))
    .limit(1);

  const overspent: ReviewFacts['overspent'] = [];
  let envelopeCount = 0;
  if (month) {
    const envs = await db.select().from(budgetEnvelopes).where(eq(budgetEnvelopes.budgetMonthId, month.id));
    envelopeCount = envs.length;
    const confirmedB = await db
      .select({ memo: expenses.memo, category: expenses.category, amount: expenses.amount })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.confirmedByUser, true),
          eq(expenses.tier, 'B'),
          gte(expenses.occurredOn, `${thisMonth}-01`),
        ),
      );
    const spentBy = new Map<string, number>();
    for (const e of confirmedB) {
      const cat = e.category ?? matchCategory(e.memo);
      spentBy.set(cat, (spentBy.get(cat) ?? 0) + e.amount);
    }
    for (const env of envs) {
      const spent = spentBy.get(env.category) ?? 0;
      if (spent > env.allocated) overspent.push({ category: env.category, allocated: env.allocated, spent });
    }
  }

  return {
    weekOf: thisWeek,
    changedThisWeek,
    turnoverPp,
    weeksUnchanged,
    recordedCount: monthExpenses.length,
    unconfirmedCount: monthExpenses.filter((e) => !e.confirmedByUser).length,
    overspent,
    envelopeCount,
  };
}

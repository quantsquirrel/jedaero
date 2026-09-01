// AI-2 입력용 과거 3개월 지출 집계 (DB 조회층) — 규칙 기반. LLM은 이 숫자를 받기만 한다.
// B(계획 지출)만 본다. A는 면제로, C는 기록으로 다루므로 봉투의 대상이 아니다 (SPEC §3-2).
// 순수 계산(중앙값·폴백 제안)은 lib/budget-plan.ts에 있다.
import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '../db';
import { expenses } from '../db/schema';
import { BUDGET_CATEGORIES, matchCategory } from './budget';
import { median, previousMonths, type CategoryHistory } from './budget-plan';

/** 확정된 B 지출만 집계한다. 미확정 지출은 tier가 반영되지 않으므로 제외한다. */
export async function collectBudgetHistory(userId: string, yearMonth: string): Promise<CategoryHistory[]> {
  const months = previousMonths(yearMonth, 3);
  const from = `${months[0]}-01`;
  const to = `${yearMonth}-01`;

  const rows = await db
    .select({
      occurredOn: expenses.occurredOn,
      amount: expenses.amount,
      memo: expenses.memo,
      category: expenses.category,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        eq(expenses.confirmedByUser, true),
        eq(expenses.tier, 'B'),
        gte(expenses.occurredOn, from),
        lt(expenses.occurredOn, to),
      ),
    );

  const byCat = new Map<string, { sums: Map<string, number>; count: number }>();
  for (const cat of BUDGET_CATEGORIES) byCat.set(cat, { sums: new Map(), count: 0 });
  for (const r of rows) {
    const cat = r.category ?? matchCategory(r.memo);
    const bucket = byCat.get(cat) ?? byCat.get('기타')!;
    const ym = r.occurredOn.slice(0, 7);
    bucket.sums.set(ym, (bucket.sums.get(ym) ?? 0) + r.amount);
    bucket.count += 1;
  }

  return BUDGET_CATEGORIES.map((category) => {
    const b = byCat.get(category)!;
    const monthly = months.map((m) => b.sums.get(m) ?? 0);
    return { category, monthly, median: median(monthly), max: Math.max(0, ...monthly), count: b.count };
  });
}

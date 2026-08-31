import { redirect } from 'next/navigation';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { BudgetForm } from '@/components/budget-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { budgetEnvelopes, budgetMonths, expenses } from '@/db/schema';
import { BUDGET_CATEGORIES, budgetAccuracy, matchCategory } from '@/lib/budget';
import { SALARY_2026, type Rank } from '@/lib/constants';
import { kstToday } from '@/lib/day-type';
import { pct, won } from '@/lib/format';
import { getSessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';

// S6 예산 봉투 — 월초에 정하고 그 달에 바꾸지 않는다. 확정 후 잠금 표시
export default async function BudgetPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const today = kstToday();
  const thisMonth = today.slice(0, 7);
  const nextDate = new Date(`${thisMonth}-01T00:00:00Z`);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  const nextMonth = nextDate.toISOString().slice(0, 7);
  const salary = SALARY_2026[user.rank as Rank] ?? 0;

  const months = await db
    .select()
    .from(budgetMonths)
    .where(and(eq(budgetMonths.userId, user.id), inArray(budgetMonths.yearMonth, [thisMonth, nextMonth])));
  const byMonth = new Map(months.map((m) => [m.yearMonth, m]));

  // 이번 달 확정 지출을 카테고리로 집계해 봉투 spent 갱신 (요청 시점 계산)
  const monthExpenses = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, user.id),
        eq(expenses.confirmedByUser, true),
        eq(expenses.tier, 'B'),
        gte(expenses.occurredOn, `${thisMonth}-01`),
      ),
    );
  const spentByCategory = new Map<string, number>();
  for (const e of monthExpenses) {
    const cat = e.category ?? matchCategory(e.memo);
    spentByCategory.set(cat, (spentByCategory.get(cat) ?? 0) + e.amount);
  }

  const current = byMonth.get(thisMonth);
  let envelopes: { id: string; category: string; allocated: number; spent: number }[] = [];
  let accuracy: number | null = null;
  if (current) {
    const rows = await db.select().from(budgetEnvelopes).where(eq(budgetEnvelopes.budgetMonthId, current.id));
    envelopes = rows.map((r) => ({ ...r, spent: spentByCategory.get(r.category) ?? 0 }));
    for (const e of envelopes) {
      await db.update(budgetEnvelopes).set({ spent: e.spent }).where(eq(budgetEnvelopes.id, e.id));
    }
    if (envelopes.length > 0) accuracy = budgetAccuracy(envelopes);
  }

  const next = byMonth.get(nextMonth);
  let nextInitial: Record<string, number> | undefined;
  if (next) {
    const rows = await db.select().from(budgetEnvelopes).where(eq(budgetEnvelopes.budgetMonthId, next.id));
    nextInitial = Object.fromEntries(rows.map((r) => [r.category, r.allocated]));
  }

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">예산 봉투</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {thisMonth} {current?.lockedAt ? '· 🔒 확정됨' : '· 미확정'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {current && envelopes.length > 0 ? (
            <>
              {envelopes.map((e) => {
                const ratio = e.allocated > 0 ? e.spent / e.allocated : 0;
                return (
                  <div key={e.id} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span>{e.category}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {won(e.spent)} / {won(e.allocated)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', ratio > 1 ? 'bg-red-500' : 'bg-emerald-500')}
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {accuracy != null ? (
                <p className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                  예산 준수율 <b>{pct(accuracy, 1).replace('+', '')}</b>{' '}
                  <span className="text-xs text-muted-foreground">
                    = 1 − Σ|배정 − 실지출| ÷ Σ배정. 절약이 아니라 예측 정확도입니다.
                  </span>
                </p>
              ) : null}
              {!current.lockedAt ? (
                <BudgetForm
                  yearMonth={thisMonth}
                  categories={BUDGET_CATEGORIES}
                  salary={salary}
                  initial={Object.fromEntries(envelopes.map((e) => [e.category, e.allocated]))}
                />
              ) : null}
            </>
          ) : (
            <BudgetForm yearMonth={thisMonth} categories={BUDGET_CATEGORIES} salary={salary} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {nextMonth} 미리 배정 {next?.lockedAt ? '· 🔒 확정됨' : next ? '· 임시 저장됨' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {next?.lockedAt ? (
            <p className="text-sm text-muted-foreground">다음 달 봉투가 확정되어 있습니다.</p>
          ) : (
            <BudgetForm yearMonth={nextMonth} categories={BUDGET_CATEGORIES} salary={salary} initial={nextInitial} />
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        봉투는 B(계획 지출)의 도구입니다. A(구조적)는 면제로, C(재량)는 기록으로 다룹니다. 잠긴
        봉투는 다음 달에 다시 배정할 수 있습니다.
      </p>
    </main>
  );
}

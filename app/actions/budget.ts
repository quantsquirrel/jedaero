'use server';
// 예산 봉투 (SPEC §3-2 B, §8 P1-10)
// 각 달의 봉투는 1회 확정(잠금)되면 그 달에는 수정할 수 없다 — UNIQUE(user_id, year_month)와
// locked_at이 강제한다. 요일·시각으로 접속을 막지 않는다 (C11).
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { budgetEnvelopes, budgetMonths } from '../../db/schema';
import { suggestBudget } from '../../lib/ai/budget-suggest';
import { guardedAiCall } from '../../lib/ai/guard';
import { BUDGET_CATEGORIES } from '../../lib/budget';
import { collectBudgetHistory } from '../../lib/budget-history';
import { suggestBudgetFallback } from '../../lib/budget-plan';
import { SALARY_2026, type Rank } from '../../lib/constants';
import { kstToday } from '../../lib/day-type';
import { getSessionUser } from '../../lib/session';

export type BudgetState = { error?: string; ok?: boolean };

export async function saveBudget(_prev: BudgetState, formData: FormData): Promise<BudgetState> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const yearMonth = String(formData.get('yearMonth') ?? '');
  const lock = formData.get('lock') === 'true';

  const today = kstToday();
  const thisMonth = today.slice(0, 7);
  const next = new Date(`${thisMonth}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const nextMonth = next.toISOString().slice(0, 7);
  if (yearMonth !== thisMonth && yearMonth !== nextMonth)
    return { error: '이번 달 또는 다음 달만 배정할 수 있습니다.' };

  const entries: { category: string; allocated: number }[] = [];
  for (const cat of BUDGET_CATEGORIES) {
    const raw = formData.get(`cat:${cat}`);
    const v = Number(raw ?? 0);
    if (!Number.isInteger(v) || v < 0 || v > 10_000_000) return { error: `${cat} 금액을 확인해주세요.` };
    if (v > 0) entries.push({ category: cat, allocated: v });
  }
  if (entries.length === 0) return { error: '봉투를 하나 이상 배정해주세요.' };

  const [existing] = await db
    .select()
    .from(budgetMonths)
    .where(and(eq(budgetMonths.userId, user.id), eq(budgetMonths.yearMonth, yearMonth)))
    .limit(1);

  if (existing?.lockedAt) return { error: '이미 확정된 달입니다. 확정 후에는 수정할 수 없어요.' };

  let monthId: string;
  if (existing) {
    monthId = existing.id;
    await db.delete(budgetEnvelopes).where(eq(budgetEnvelopes.budgetMonthId, monthId));
    if (lock) await db.update(budgetMonths).set({ lockedAt: new Date() }).where(eq(budgetMonths.id, monthId));
  } else {
    const [created] = await db
      .insert(budgetMonths)
      .values({
        userId: user.id,
        yearMonth,
        baseSalary: SALARY_2026[user.rank as Rank] ?? 0,
        lockedAt: lock ? new Date() : null,
      })
      .returning({ id: budgetMonths.id });
    monthId = created.id;
  }
  await db.insert(budgetEnvelopes).values(entries.map((e) => ({ budgetMonthId: monthId, ...e })));

  revalidatePath('/budget');
  return { ok: true };
}

export type SuggestState =
  | {
      entries: { category: string; allocated: number; reason: string }[];
      note: string;
      source: 'ai' | 'rule';
      notice?: string;
    }
  | { error: string };

/** AI-2 봉투 예산 제안. 값을 저장하지 않는다 — 폼을 채워줄 뿐이고 확정은 사용자가 누른다 (C8). */
export async function suggestBudgetAction(yearMonth: string): Promise<SuggestState> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const salary = SALARY_2026[user.rank as Rank] ?? 0;
  const history = await collectBudgetHistory(user.id, yearMonth);
  if (history.every((h) => h.count === 0))
    return { error: '아직 확정된 B(계획) 지출이 없어 제안할 근거가 없습니다. 가계부에서 몇 건 확정해주세요.' };

  const result = await guardedAiCall(user.id, 'AI-2', () => suggestBudget(history, salary, yearMonth));
  if ('ok' in result) return { ...result.ok, source: 'ai' };

  const entries = suggestBudgetFallback(history, salary);
  if (entries.length === 0) return { error: '제안할 근거가 부족합니다. 직접 배정해주세요.' };
  return {
    entries,
    note: '최근 3개월 중앙값입니다. 한 달 튄 지출이 다음 달을 끌어올리지 않게 평균 대신 중앙값을 씁니다.',
    source: 'rule',
    notice: result.message,
  };
}

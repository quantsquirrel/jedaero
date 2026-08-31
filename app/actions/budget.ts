'use server';
// 예산 봉투 (SPEC §3-2 B, §8 P1-10)
// 각 달의 봉투는 1회 확정(잠금)되면 그 달에는 수정할 수 없다 — UNIQUE(user_id, year_month)와
// locked_at이 강제한다. 요일·시각으로 접속을 막지 않는다 (C11).
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { budgetEnvelopes, budgetMonths } from '../../db/schema';
import { BUDGET_CATEGORIES } from '../../lib/budget';
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

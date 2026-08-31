'use server';
// 지출 기록 + AI-1 분류 제안 (P0-5)
// 기록·확정은 평일에도 언제나 가능하다 (잠기는 건 수익률 표시와 비중 조정뿐).
// AI 제안이 실패하면 미분류로 남고 사용자가 직접 고른다 — 오분류 비용 > 미분류 비용.
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { expenses } from '../../db/schema';
import { classifyExpense } from '../../lib/ai/classify';
import { kstToday } from '../../lib/day-type';
import { getSessionUser } from '../../lib/session';

export type AddExpenseState = { error?: string; ok?: boolean };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function addExpense(_prev: AddExpenseState, formData: FormData): Promise<AddExpenseState> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다. 처음 화면에서 다시 시작해주세요.' };

  const amount = Number(formData.get('amount'));
  const memo = String(formData.get('memo') ?? '').trim();
  let occurredOn = String(formData.get('occurredOn') ?? '');

  if (!Number.isInteger(amount) || amount <= 0 || amount > 100_000_000)
    return { error: '금액은 1원 이상의 정수로 입력해주세요.' };
  if (memo.length < 1 || memo.length > 60) return { error: '메모는 1~60자로 입력해주세요.' };
  if (!DATE_RE.test(occurredOn)) occurredOn = kstToday();

  const [row] = await db
    .insert(expenses)
    .values({ userId: user.id, occurredOn, amount, memo })
    .returning({ id: expenses.id });

  // AI 분류 제안 (실패해도 지출 기록은 유지)
  const suggestion = await classifyExpense({ userId: user.id, amount, memo, occurredOn });
  if (suggestion) {
    await db
      .update(expenses)
      .set({ aiSuggestedTier: suggestion.tier, aiConfidence: suggestion.confidence })
      .where(eq(expenses.id, row.id));
  }

  revalidatePath('/expenses');
  return { ok: true };
}

export async function confirmExpenseTier(id: string, tier: 'A' | 'B' | 'C'): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  if (!['A', 'B', 'C'].includes(tier)) return { error: '잘못된 분류입니다.' };

  await db
    .update(expenses)
    .set({ tier, confirmedByUser: true })
    .where(and(eq(expenses.id, id), eq(expenses.userId, user.id)));

  revalidatePath('/expenses');
  return {};
}

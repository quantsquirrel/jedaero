'use server';
// 지출 기록 + AI-1 분류 제안 (P0-5) + 퀘스트·A계층 면제 연동 (P1)
// 기록·확정은 평일에도 언제나 가능하다. AI 제안이 실패하면 미분류로 남고 사용자가 직접 고른다.
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { exemptionClaims, expenses } from '../../db/schema';
import { classifyExpense, type ClassifyResult } from '../../lib/ai/classify';
import { classifyExpenseFallback } from '../../lib/ai/fallback';
import { guardedAiCall, recordAiCall } from '../../lib/ai/guard';
import { matchCategory } from '../../lib/budget';
import { TRANSPORT_CAP, type HomeDistance } from '../../lib/constants';
import { kstToday } from '../../lib/day-type';
import { detectInjection } from '../../lib/filters/injection-filter';
import { bumpQuest } from '../../lib/quests';
import { getSessionUser } from '../../lib/session';

export type AddExpenseState = { error?: string; ok?: boolean; notice?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TRANSPORT_RE = /KTX|기차|버스|택시|교통|왕복|시외|고속|항공|여객선|배편/i;

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
  await bumpQuest(user.id, 'RECORD_3', 1);

  // LLM 입력 필터 — 인젝션·개인정보 패턴이면 AI 호출 없이 미분류로 남긴다 (SPEC §5)
  let notice: string | undefined;
  const injection = detectInjection(memo);
  if (injection.blocked) {
    await recordAiCall(user.id, 'AI-1', true);
    notice = '메모에 허용되지 않는 패턴이 있어 AI 분류를 건너뛰었습니다. 직접 선택해주세요.';
  } else {
    const result = await guardedAiCall(user.id, 'AI-1', () =>
      classifyExpense({ amount, memo, occurredOn }),
    );
    let suggestion: ClassifyResult | null = null;
    if ('ok' in result) {
      suggestion = result.ok;
    } else if (result.error === 'disabled') {
      // 킬스위치 → 룰 기반 폴백 (생성형 AI 아님 — UI에서 구분 표기)
      suggestion = classifyExpenseFallback({ amount, memo });
      notice = result.message;
    } else {
      notice = result.message; // rate limit(429) 또는 호출 실패
    }
    if (suggestion) {
      await db
        .update(expenses)
        .set({ aiSuggestedTier: suggestion.tier, aiConfidence: suggestion.confidence })
        .where(eq(expenses.id, row.id));
    }
  }

  revalidatePath('/expenses');
  return { ok: true, notice };
}

export async function confirmExpenseTier(id: string, tier: 'A' | 'B' | 'C'): Promise<{ error?: string }> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  if (!['A', 'B', 'C'].includes(tier)) return { error: '잘못된 분류입니다.' };

  const [row] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, user.id), eq(expenses.confirmedByUser, false)))
    .limit(1);
  if (!row) return { error: '이미 확정됐거나 찾을 수 없는 지출입니다.' };

  await db
    .update(expenses)
    .set({ tier, confirmedByUser: true, category: tier === 'B' ? matchCategory(row.memo) : null })
    .where(eq(expenses.id, id));
  await bumpQuest(user.id, 'CONFIRM_AI', 1);

  // A계층 교통비 — home_distance 기반 표준 왕복 상한까지 자동 면제 인정 (SPEC §3-2)
  if (tier === 'A' && row.memo && TRANSPORT_RE.test(row.memo)) {
    const cap = TRANSPORT_CAP[user.homeDistance as HomeDistance] ?? TRANSPORT_CAP.MID;
    const today = kstToday();
    const quarter = `${today.slice(0, 4)}-${Math.ceil(Number(today.slice(5, 7)) / 3)}`;
    await db.insert(exemptionClaims).values({
      userId: user.id,
      yearQuarter: quarter,
      type: 'TRANSPORT',
      amount: row.amount,
      reason: row.memo,
      capApplied: Math.min(row.amount, cap),
    });
  }

  revalidatePath('/expenses');
  return {};
}

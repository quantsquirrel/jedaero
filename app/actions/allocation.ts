'use server';
// 6축 비중 조정 확정 (SPEC §3-5)
// 주말·공휴일만, 주 1회, 일요일 21:00 마감, 체결은 다음 거래일 종가.
// 주 1회는 UNIQUE(user_id, week_of)가 DB에서 최종 강제한다.
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { allocations } from '../../db/schema';
import { currentRebalanceOpen } from '../../lib/day-context';
import { kstToday } from '../../lib/day-type';
import { nextTradingDay } from '../../lib/portfolio/prices';
import { isValidWeights } from '../../lib/portfolio/weights';
import { getSessionUser } from '../../lib/session';
import { weekOf } from '../../lib/week';

export type SaveAllocationResult = { ok: true; effectiveFrom: string } | { error: string };

export async function saveAllocation(weights: Record<string, number>): Promise<SaveAllocationResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다. 처음 화면에서 다시 시작해주세요.' };

  if (!(await currentRebalanceOpen())) return { error: '주말에만 조정할 수 있습니다.' };
  if (!isValidWeights(weights)) return { error: '비중 합계가 100이 아닙니다.' };

  const week = weekOf(new Date());
  const existing = await db
    .select({ id: allocations.id })
    .from(allocations)
    .where(and(eq(allocations.userId, user.id), eq(allocations.weekOf, week)))
    .limit(1);
  if (existing.length > 0) return { error: '이번 주는 이미 조정했습니다. 다음 주말에 다시 열려요.' };

  const effectiveFrom = nextTradingDay(kstToday());
  if (!effectiveFrom) return { error: '체결 가능한 거래일이 없습니다.' };

  try {
    await db.insert(allocations).values({
      userId: user.id,
      weekOf: week,
      weights,
      details: null,
      templateId: null,
      decidedAt: new Date(),
      effectiveFrom,
    });
  } catch (e) {
    // 동시 요청 등으로 UNIQUE 제약에 걸린 경우
    const code = (e as { cause?: { code?: string }; code?: string })?.cause?.code ?? (e as { code?: string })?.code;
    if (code === '23505') return { error: '이번 주는 이미 조정했습니다. 다음 주말에 다시 열려요.' };
    return { error: '저장에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }

  revalidatePath('/portfolio');
  return { ok: true, effectiveFrom };
}

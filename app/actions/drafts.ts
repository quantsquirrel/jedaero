'use server';
// 명령하달 — 평일에 남기는 «아직 실행되지 않은 메모» (DESIGN-DECISIONS §14, 잠금 문서 §1)
//
// ★ 이것은 예약 주문이 아니다. 체결되지 않고, 주말 편성을 대신하지도 않는다.
//   저장은 drafts 행이며 allocations 를 건드리지 않는다 — 주 1회 규율은 그대로다.
// ★ 안 적은 주가 «정상»이다. 빈 상태를 꾸짖는 배지·카운터를 만들지 않는다 (C7).
// ★ 근거 한 줄은 자유 텍스트라 DB에 남는다. 그래서 저장 전에 부대정보·개인정보 파이프라인을
//   반드시 통과시킨다 (C4) — 회고와 달리 «저장되는» 텍스트이므로 검사가 더 중요하다.
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import { allocations, drafts } from '../../db/schema';
import { currentDayType } from '../../lib/day-context';
import { NOTE_MAX } from '../../lib/drafts/compare';
import { detectInjection } from '../../lib/filters/injection-filter';
import { isValidWeights } from '../../lib/portfolio/weights';
import { getSessionUser } from '../../lib/session';
import { weekOf } from '../../lib/week';

export type DraftResult = { ok: true } | { error: string };

async function editable(userId: string): Promise<{ week: string } | { error: string }> {
  // 평일에만 쓴다. 주말은 초안을 «보는» 날이고, 그날의 결정은 편성기에서 한다.
  if ((await currentDayType()) !== 'WEEKDAY') {
    return { error: '초안은 평일에 남깁니다. 주말에는 편성기에서 바로 확정합니다.' };
  }
  const week = weekOf(new Date());
  const [confirmed] = await db
    .select({ id: allocations.id })
    .from(allocations)
    .where(and(eq(allocations.userId, userId), eq(allocations.weekOf, week)))
    .limit(1);
  if (confirmed) return { error: '이번 주 편성은 이미 확정됐습니다. 초안은 다음 주에 다시 열려요.' };
  return { week };
}

export async function saveDraft(
  weights: Record<string, number>,
  note: string,
): Promise<DraftResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const gate = await editable(user.id);
  if ('error' in gate) return gate;

  if (!isValidWeights(weights)) {
    return { error: '초안 값이 올바르지 않습니다. 포인트는 20개를 넘을 수 없습니다.' };
  }

  const trimmed = note.trim().slice(0, NOTE_MAX);
  if (trimmed) {
    // 차단 사유·입력 내용을 되풀이하지 않는다
    if (detectInjection(trimmed).blocked) {
      return { error: '한 줄에 사용할 수 없는 내용이 있습니다. 부대·개인 식별 정보는 적지 않습니다.' };
    }
  }

  await db
    .insert(drafts)
    .values({ userId: user.id, weekOf: gate.week, weights, note: trimmed || null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [drafts.userId, drafts.weekOf],
      set: { weights: sql`excluded.weights`, note: sql`excluded.note`, updatedAt: new Date() },
    });

  revalidatePath('/portfolio');
  return { ok: true };
}

export async function deleteDraft(): Promise<DraftResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const gate = await editable(user.id);
  if ('error' in gate) return gate;

  await db.delete(drafts).where(and(eq(drafts.userId, user.id), eq(drafts.weekOf, gate.week)));
  revalidatePath('/portfolio');
  return { ok: true };
}

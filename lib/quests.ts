// 위클리 퀘스트 (SPEC §3-7) — 매주 월요일 새 주차로 자동 전환 (week_of 기반, 크론 없음)
// 완료 보상은 경험치(XP) + 배지까지만. 현금성 보상 절대 금지 (C3).
// 미접속 주간이 있어도 다음 주 퀘스트는 week_of가 바뀌며 새로 시작된다 (C7).
import { and, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '../db';
import { allocations, questProgress, quests } from '../db/schema';
import { mondayOfWeeksAgo, weekOf, weekOfDateStr } from './week';

export const QUEST_TARGETS: Record<string, number> = {
  RECORD_3: 3,
  CONFIRM_AI: 5,
  LEARN_1: 1,
  REVIEW_1: 1,
  HOLD: 1,
};

async function questIdByCode(code: string): Promise<string | null> {
  const rows = await db.select({ id: quests.id }).from(quests).where(eq(quests.code, code)).limit(1);
  return rows[0]?.id ?? null;
}

/** 이번 주 진행도를 inc만큼 올리고, 목표 도달 시 완료 처리 (멱등·경합 안전: UNIQUE upsert) */
export async function bumpQuest(userId: string, code: string, inc = 1): Promise<void> {
  const target = QUEST_TARGETS[code];
  const questId = await questIdByCode(code);
  if (!questId || !target) return;
  const week = weekOf(new Date());
  await db
    .insert(questProgress)
    .values({
      userId,
      questId,
      weekOf: week,
      progress: Math.min(inc, target),
      completedAt: inc >= target ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [questProgress.userId, questProgress.questId, questProgress.weekOf],
      set: {
        progress: sql`least(${target}, ${questProgress.progress} + ${inc})`,
        completedAt: sql`case when ${questProgress.progress} + ${inc} >= ${target} then coalesce(${questProgress.completedAt}, now()) else ${questProgress.completedAt} end`,
      },
    });
}

/** HOLD: "지난주에 비중을 바꾸지 않았다"를 지난주가 끝난 뒤 lazy 판정해 지급.
 *  아무것도 하지 않은 것도 유효한 선택으로 명시적으로 보상한다. */
export async function grantHoldIfEligible(userId: string): Promise<void> {
  const lastMonday = mondayOfWeeksAgo(new Date(), 1);
  const lastWeek = weekOfDateStr(lastMonday);
  const questId = await questIdByCode('HOLD');
  if (!questId) return;

  const [changedLastWeek] = await db
    .select({ n: sql<number>`count(*)` })
    .from(allocations)
    .where(and(eq(allocations.userId, userId), eq(allocations.weekOf, lastWeek)));
  if (Number(changedLastWeek.n) > 0) return;

  // 지난주 이전부터 배분이 존재했던 사용자만 (그 주에 "유지"라는 선택이 실제로 있었던 경우)
  const [hadBefore] = await db
    .select({ n: sql<number>`count(*)` })
    .from(allocations)
    .where(and(eq(allocations.userId, userId), lt(allocations.weekOf, lastWeek)));
  if (Number(hadBefore.n) === 0) return;

  await db
    .insert(questProgress)
    .values({ userId, questId, weekOf: lastWeek, progress: 1, completedAt: new Date() })
    .onConflictDoNothing();
}

export type QuestRow = {
  code: string;
  title: string;
  description: string;
  xp: number;
  badge: string | null;
  progress: number;
  target: number;
  completed: boolean;
};

/** 이번 주 퀘스트 5종 + 진행 상태 */
export async function weeklyQuests(userId: string): Promise<QuestRow[]> {
  const week = weekOf(new Date());
  const qs = await db.select().from(quests);
  const ps = await db
    .select()
    .from(questProgress)
    .where(and(eq(questProgress.userId, userId), eq(questProgress.weekOf, week)));
  const byQuest = new Map(ps.map((p) => [p.questId, p]));
  return qs
    .map((q) => {
      const p = byQuest.get(q.id);
      return {
        code: q.code,
        title: q.title,
        description: q.description,
        xp: q.xp,
        badge: q.badge,
        progress: p?.progress ?? 0,
        target: QUEST_TARGETS[q.code] ?? 1,
        completed: p?.completedAt != null,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** 누적 XP(완료 퀘스트 합)와 획득 배지 */
export async function totalXpAndBadges(userId: string): Promise<{ xp: number; badges: string[] }> {
  const rows = await db
    .select({ xp: quests.xp, badge: quests.badge })
    .from(questProgress)
    .innerJoin(quests, eq(questProgress.questId, quests.id))
    .where(and(eq(questProgress.userId, userId), isNotNull(questProgress.completedAt)));
  const xp = rows.reduce((s, r) => s + r.xp, 0);
  const badges = [...new Set(rows.map((r) => r.badge).filter((b): b is string => !!b))];
  return { xp, badges };
}

/** 이번 주 완료 XP (weekly_scores용) */
export async function weekXp(userId: string, week: string): Promise<number> {
  const rows = await db
    .select({ xp: quests.xp })
    .from(questProgress)
    .innerJoin(quests, eq(questProgress.questId, quests.id))
    .where(
      and(
        eq(questProgress.userId, userId),
        eq(questProgress.weekOf, week),
        isNotNull(questProgress.completedAt),
      ),
    );
  return rows.reduce((s, r) => s + r.xp, 0);
}

/** 규율 스트릭: 주간 퀘스트를 1개 이상 완료한 연속 주 수 (이번 주 포함, 뒤로 계산) */
export async function disciplineStreak(userId: string): Promise<number> {
  const rows = await db
    .selectDistinct({ weekOf: questProgress.weekOf })
    .from(questProgress)
    .where(and(eq(questProgress.userId, userId), isNotNull(questProgress.completedAt)));
  const weeks = new Set(rows.map((r) => r.weekOf));
  let streak = 0;
  for (let ago = 0; ago < 60; ago++) {
    const wk = weekOfDateStr(mondayOfWeeksAgo(new Date(), ago));
    if (weeks.has(wk)) streak += 1;
    else if (ago === 0) continue; // 이번 주는 아직 진행 중 — 스트릭을 끊지 않는다
    else break;
  }
  return streak;
}

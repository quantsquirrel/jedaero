// /demo 진입 시 주입되는 체험용 데이터 (SPEC §7, docs/SEED.md §8)
// - 12주치 비중 변경 이력 (조정하지 않은 주 4주 포함 — 행이 없는 주가 곧 "유지")
// 리그·성향분석용 더미 사용자 200명은 3단계(리그·인사이트 구현)에서 전역 시드로 추가한다.
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { allocations, users } from '../db/schema';
import { addDays, mondayOfWeeksAgo, weekOfDateStr } from './week';
import { nextTradingDay } from './portfolio/prices';
import { ACTIVE_WEIGHT_STORY } from './demo-story';

const NICKNAMES = ['해뜰날', '강철비', '초코우유', '별헤는밤', '든든적금', '월급지킴이'];

/** 이미 발급한 데모 쿠키가 가리키는 체험 계정이면 그대로 재사용한다. */
export async function findDemoUser(id: string | undefined): Promise<{ id: string } | null> {
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }
  const [user] = await db
    .select({ id: users.id, isDemo: users.isDemo })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user?.isDemo ? { id: user.id } : null;
}

export async function createDemoUser(now: Date = new Date()): Promise<{ id: string }> {
  const todayK = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
  const nickname = `${NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]}${Math.floor(10 + Math.random() * 90)}`;

  const [user] = await db
    .insert(users)
    .values({
      nickname,
      rank: 'CORPORAL',
      branch: 'ARMY',
      enlistedAt: addDays(todayK, -430), // 약 14개월차
      dischargeAt: addDays(todayK, 120), // 전역 D-120
      homeDistance: 'FAR',
      isDemo: true,
      // analytics_opt_in은 기본 false로 시작 — 시나리오 15(옵트인 동의 화면)를 시연하기 위해
    })
    .returning({ id: users.id });

  // 12주치 비중 이력 (스킵 주 2주는 행 없음 = 직전 비중 유지)
  const allocRows = ACTIVE_WEIGHT_STORY.map((w) => {
    const monday = mondayOfWeeksAgo(now, w.weeksAgo);
    const sunday = addDays(monday, 6);
    const decidedAt = new Date(`${sunday}T11:00:00Z`); // 일요일 20:00 KST
    return {
      userId: user.id,
      weekOf: weekOfDateStr(monday),
      weights: w.weights,
      details: null,
      templateId: w.templateId ?? null,
      decidedAt,
      effectiveFrom: nextTradingDay(sunday) ?? addDays(sunday, 1),
    };
  });
  await db.insert(allocations).values(allocRows);

  return user;
}

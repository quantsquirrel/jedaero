// AI 호출 가드 — rate limit·킬스위치·호출 기록 (SPEC §5)
// 모든 LLM 호출은 이 가드를 거친다. 카운터·로그는 ai_calls 테이블 (요청 시점 윈도우 집계, 크론 없음).
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '../../db';
import { aiCalls, settings } from '../../db/schema';
import { AI_RATE_LIMIT } from '../constants';

/** 킬스위치: settings.ai_enabled = 'false' → 룰 기반 폴백 (시나리오 18) */
export async function isAiEnabled(): Promise<boolean> {
  const rows = await db.select().from(settings).where(eq(settings.key, 'ai_enabled')).limit(1);
  return rows[0]?.value !== 'false';
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; status: 429; message: string };

/** 사용자당 분당 5회·일 50회 (롤링 윈도우). 초과 시 429 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const [row] = await db
    .select({
      lastMinute: sql<number>`count(*) filter (where ${aiCalls.createdAt} > now() - interval '1 minute')`,
      lastDay: sql<number>`count(*)`,
    })
    .from(aiCalls)
    .where(and(eq(aiCalls.userId, userId), gt(aiCalls.createdAt, sql`now() - interval '24 hours'`)));

  if (Number(row.lastMinute) >= AI_RATE_LIMIT.perMinute || Number(row.lastDay) >= AI_RATE_LIMIT.perDay) {
    await db.insert(aiCalls).values({ userId, kind: 'RATE', blocked: true });
    return {
      allowed: false,
      status: 429,
      message: 'AI 호출 한도를 초과했습니다 (429). 잠시 후 다시 시도해주세요.',
    };
  }
  return { allowed: true };
}

export async function recordAiCall(userId: string, kind: string, blocked = false): Promise<void> {
  await db.insert(aiCalls).values({ userId, kind, blocked });
}

export type GuardedResult<T> =
  | { ok: T }
  | { error: 'disabled' | 'rate_limited' | 'failed'; message: string };

/** 킬스위치 → 'disabled', 한도 초과 → 'rate_limited'(429), 그 외 호출 후 기록 */
export async function guardedAiCall<T>(
  userId: string,
  kind: string,
  fn: () => Promise<T | null>,
): Promise<GuardedResult<T>> {
  if (!(await isAiEnabled())) {
    return { error: 'disabled', message: 'AI 기능이 일시 중지되어 규칙 기반으로 동작합니다.' };
  }
  const limit = await checkRateLimit(userId);
  if (!limit.allowed) return { error: 'rate_limited', message: limit.message };

  const result = await fn();
  await recordAiCall(userId, kind, result === null);
  if (result === null) {
    // ★ 「만들지 못했습니다」는 고장으로 읽힌다. 실제로 가장 흔한 경로는 «검증 폐기»다 —
    //   조언 어미·성향 라벨·입력에 없던 숫자가 잡히면 문장 전체를 버린다.
    //   버렸다는 사실을 숨기지 않는 편이 정확하고, 이 서비스가 무엇을 하는지도 그때 보인다.
    //   호출 자체가 실패했을 때도 「AI 문장이 통과하지 못했다」는 서술은 참이다.
    //   ★ 폴백 문장이 «위»에 있는 화면도 있고 «아래»에 있는 화면도 있다.
    //   공용 문구에서 방향을 가리키지 않는다 — 그건 그리는 쪽이 안다.
    return {
      error: 'failed',
      message: 'AI 문장이 검증을 통과하지 못했습니다.',
    };
  }
  return { ok: result };
}

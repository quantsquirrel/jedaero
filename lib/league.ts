// 리그 — 「제대로 지수」로 겨룬다 (DESIGN-DECISIONS §7, HANDOFF ③)
// ★ 랭킹은 전역(일시금) 곡선만 사용한다. 다른 곡선을 여기에 넣지 않는다.
// ★ 등수 숫자(1위·2위)를 만들지 않는다. 짧은 시즌의 1등은 대개 몰빵이고,
//   그 행동을 표창하는 순간 서비스가 가르치려는 것과 반대로 작동한다.
// ★ 코호트(전역 예정 월 자동 배정)는 폐지했다. 비교 집단은 사용자가 아는 집단이어야 한다 —
//   우리 그룹 / 같은 군종 / 같은 계급. 부대 정보는 어디에도 쓰지 않는다 (C4).
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { allocations, groupMembers, users, weeklyScores } from '../db/schema';
import { SEED_AMOUNT, type Weights } from './constants';
import { kstToday } from './day-type';
import { annualizedVol, turnover } from './insights';
import { jedaeroIndex, type IndexParts } from './jedaero-index';
import { computeCurve, type WeightHistoryItem } from './portfolio/engine';
import { pricesUpTo } from './portfolio/prices';
import { weekOf } from './week';
import type { SessionUser } from './session';

export type WeeklyScore = IndexParts & { hasHistory: boolean };

/** 배분 이력으로 제대로 지수의 세 축을 계산한다. DB 쓰기는 하지 않는다. */
function scoreFromAllocations(
  allocs: { effectiveFrom: string; weights: unknown; details: unknown }[],
  today: string,
): WeeklyScore {
  if (allocs.length === 0) {
    return { grown: 0, spread: 0, held: 0, total: 0, hasHistory: false };
  }
  const { dates, series } = pricesUpTo(today);
  const history: WeightHistoryItem[] = allocs.map((a) => ({
    effectiveFrom: a.effectiveFrom,
    weights: a.weights as Record<string, number>,
    details: (a.details as Record<string, Record<string, number>> | null) ?? null,
  }));
  const { values } = computeCurve(dates, series, history, { [allocs[0].effectiveFrom]: SEED_AMOUNT });

  const first = values.find((v) => v > 0) ?? 0;
  const last = values[values.length - 1] ?? 0;
  const tradingDays = values.filter((v) => v > 0).length;
  // 연환산 수익률 — 구간이 1년보다 짧으면 늘려 잡는다 (252 영업일 기준)
  const annualReturn =
    first > 0 && tradingDays > 1 ? (last / first) ** (252 / tradingDays) - 1 : null;

  const weightsHistory = allocs.map((a) => a.weights as Weights);
  const parts = jedaeroIndex({
    annualReturn,
    annualVol: annualizedVol(values),
    weights: weightsHistory[weightsHistory.length - 1],
    turnoverPct: turnover(weightsHistory),
  });
  return { ...parts, hasHistory: true };
}

/** 내 이번 주 점수를 요청 시점에 계산해 weekly_scores에 lazy upsert (크론 없음) */
export async function computeAndStoreWeeklyScore(user: SessionUser): Promise<WeeklyScore> {
  const week = weekOf(new Date());
  const allocs = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(allocations.effectiveFrom);

  const score = scoreFromAllocations(allocs, kstToday());

  const existing = await db
    .select({ id: weeklyScores.id })
    .from(weeklyScores)
    .where(and(eq(weeklyScores.userId, user.id), eq(weeklyScores.weekOf, week)))
    .limit(1);
  const row = { grown: score.grown, spread: score.spread, held: score.held, total: score.total };
  if (existing.length > 0) {
    await db.update(weeklyScores).set(row).where(eq(weeklyScores.id, existing[0].id));
  } else {
    await db.insert(weeklyScores).values({ userId: user.id, weekOf: week, ...row });
  }
  return score;
}

export type BoardScope = 'GROUP' | 'BRANCH' | 'RANK';

export const BOARD_LABEL: Record<BoardScope, string> = {
  GROUP: '우리 그룹',
  BRANCH: '같은 군종',
  RANK: '같은 계급',
};

export type BoardEntry = {
  nickname: string;
  isMe: boolean;
  total: number | null; // 이번 주 집계가 없으면 null
};

export type Board = { scope: BoardScope; n: number; entries: BoardEntry[] };

/** 비교 집단 안의 구성원과 각자의 제대로 지수.
 *  ★ 정렬은 가입순(=조회 순서)이다. 점수 내림차순으로 두면 등수를 지워도 등수가 남는다. */
export async function board(user: SessionUser, scope: BoardScope): Promise<Board> {
  const week = weekOf(new Date());

  let memberIds: string[];
  if (scope === 'GROUP') {
    const mine = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, user.id));
    if (mine.length === 0) return { scope, n: 0, entries: [] };
    const rows = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        inArray(
          groupMembers.groupId,
          mine.map((m) => m.groupId),
        ),
      );
    memberIds = [...new Set(rows.map((r) => r.userId))];
  } else {
    const col = scope === 'BRANCH' ? users.branch : users.rank;
    const val = scope === 'BRANCH' ? user.branch : user.rank;
    const rows = await db.select({ id: users.id }).from(users).where(eq(col, val));
    memberIds = rows.map((r) => r.id);
  }
  if (memberIds.length === 0) return { scope, n: 0, entries: [] };

  const people = await db
    .select({ id: users.id, nickname: users.nickname })
    .from(users)
    .where(inArray(users.id, memberIds));
  const scores = await db
    .select({ userId: weeklyScores.userId, total: weeklyScores.total })
    .from(weeklyScores)
    .where(and(inArray(weeklyScores.userId, memberIds), eq(weeklyScores.weekOf, week)));
  const byUser = new Map(scores.map((s) => [s.userId, s.total]));

  return {
    scope,
    n: people.length,
    entries: people.map((p) => ({
      nickname: p.nickname,
      isMe: p.id === user.id,
      total: byUser.get(p.id) ?? null,
    })),
  };
}

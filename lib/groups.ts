// 초대코드 그룹 (SPEC §3-8) — 정원 30명, 지표는 제대로 지수.
// ★ 부대 정보는 어디에도 쓰지 않는다 (C4). 그룹명은 AI-5 필터를 통과한 것만.
// ★ 그룹 내 수익률은 비공개다. 부대 내 "얼마 벌었다" 자랑 문화(군기문란 리스크)를 차단한다.
//   이 파일과 그룹 화면은 수익률 필드를 참조하지 않는다 (P1-10).
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { groupMembers, groups, users, weeklyScores } from '../db/schema';
import { checkGroupName } from './filters/unit-filter';
import { weekOf } from './week';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외

function randomInviteCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

export type GroupActionResult = { ok: true; groupId: string } | { error: string };

export async function createGroup(userId: string, rawName: string): Promise<GroupActionResult> {
  const name = rawName.trim();
  const check = checkGroupName(name);
  if (check.blocked) return { error: check.reason ?? '사용할 수 없는 그룹명입니다.' };
  // 의심 케이스의 LLM 2차 가드는 호출부(actions)에서 수행 — 여기는 순수 규칙 계층

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [g] = await db
        .insert(groups)
        .values({ name, inviteCode: randomInviteCode(), ownerId: userId })
        .returning({ id: groups.id });
      await db.insert(groupMembers).values({ groupId: g.id, userId });
      return { ok: true, groupId: g.id };
    } catch {
      // invite_code 충돌 — 재시도
    }
  }
  return { error: '초대코드 생성에 실패했습니다. 다시 시도해주세요.' };
}

export async function joinGroup(userId: string, rawCode: string): Promise<GroupActionResult> {
  const code = rawCode.trim().toUpperCase();
  const [g] = await db.select().from(groups).where(eq(groups.inviteCode, code)).limit(1);
  if (!g) return { error: '초대코드를 찾을 수 없습니다.' };

  const members = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, g.id));
  if (members.some((m) => m.userId === userId)) return { error: '이미 참여한 그룹입니다.' };
  if (members.length >= g.memberLimit) return { error: `정원(${g.memberLimit}명)이 가득 찼습니다.` };

  await db.insert(groupMembers).values({ groupId: g.id, userId });
  return { ok: true, groupId: g.id };
}

export type GroupBoardMember = {
  nickname: string;
  isMe: boolean;
  total: number | null; // 이번 주 제대로 지수 (집계 전이면 null)
};

export type GroupBoard = {
  id: string;
  name: string;
  inviteCode: string;
  memberLimit: number;
  members: GroupBoardMember[];
};

export async function myGroupBoards(userId: string): Promise<GroupBoard[]> {
  const mine = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));
  if (mine.length === 0) return [];

  const gs = await db
    .select()
    .from(groups)
    .where(inArray(groups.id, mine.map((m) => m.groupId)));

  const week = weekOf(new Date());
  const boards: GroupBoard[] = [];
  for (const g of gs) {
    const memberRows = await db
      .select({ userId: users.id, nickname: users.nickname })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, g.id));

    const memberIds = memberRows.map((m) => m.userId);
    const scores = await db
      .select({ userId: weeklyScores.userId, total: weeklyScores.total })
      .from(weeklyScores)
      .where(and(inArray(weeklyScores.userId, memberIds), eq(weeklyScores.weekOf, week)));
    const totalByUser = new Map(scores.map((s) => [s.userId, s.total]));

    // ★ 점수 내림차순으로 정렬하지 않는다. 등수 숫자를 지워도 정렬이 등수를 만든다.
    //   가입순(조회 순서)을 그대로 둔다.
    const members: GroupBoardMember[] = memberRows.map((m) => ({
      nickname: m.nickname,
      isMe: m.userId === userId,
      total: totalByUser.get(m.userId) ?? null,
    }));
    boards.push({ id: g.id, name: g.name, inviteCode: g.inviteCode, memberLimit: g.memberLimit, members });
  }
  return boards;
}

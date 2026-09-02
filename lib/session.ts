// 익명 쿠키 세션 (SPEC §1-1). 회원가입·로그인 없음. 인증 라이브러리 없음.
import { cache } from 'react';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

export const USER_COOKIE = 'user_id';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SessionUser = typeof users.$inferSelect;

// cache()는 렌더 요청 객체에 붙는 요청 단위 메모다 — 요청이 끝나면 사라지고 요청 간에 공유되지 않는다.
// 한 화면에서 레이아웃·페이지가 각각 세션을 물어도 users 조회는 1회로 끝난다.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const id = store.get(USER_COOKIE)?.value;
  if (!id || !UUID_RE.test(id)) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
});

export const userCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 180 * 24 * 3600, // 180일
  path: '/',
};

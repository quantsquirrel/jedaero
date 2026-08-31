// /admin 접근 제어 — 환경변수 ADMIN_PASSWORD 단순 비교 (SPEC §1-1)
// 쿠키에는 비밀번호 원문 대신 해시를 저장한다.
import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'admin_auth';

export function adminHash(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash('sha256').update(pw).digest('hex');
}

export async function isAdminAuthed(): Promise<boolean> {
  const expected = adminHash();
  if (!expected) return false;
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === expected;
}

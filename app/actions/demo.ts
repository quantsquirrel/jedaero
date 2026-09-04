'use server';
// 데모 요일 전환 토글 (SPEC §7) — 쿠키에 저장하고 서버 판정이 이를 우선 참조한다
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { DEMO_DAY_COOKIE } from '../../lib/day-context';
import { getSessionUser } from '../../lib/session';

export async function setDemoDay(
  mode: 'WEEKDAY' | 'WEEKEND',
): Promise<{ ok: true; mode: 'WEEKDAY' | 'WEEKEND' } | { ok: false; error: string }> {
  if (mode !== 'WEEKDAY' && mode !== 'WEEKEND') return { ok: false, error: '올바르지 않은 화면입니다.' };
  const user = await getSessionUser();
  if (!user?.isDemo) return { ok: false, error: '데모 세션에서만 전환할 수 있습니다.' };
  const store = await cookies();
  store.set(DEMO_DAY_COOKIE, mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600,
    path: '/',
  });
  revalidatePath('/', 'layout');
  return { ok: true, mode };
}

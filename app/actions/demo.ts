'use server';
// 데모 요일 전환 토글 (SPEC §7) — 쿠키에 저장하고 서버 판정이 이를 우선 참조한다
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { DEMO_DAY_COOKIE } from '../../lib/day-context';

export async function setDemoDay(mode: 'WEEKDAY' | 'WEEKEND') {
  if (mode !== 'WEEKDAY' && mode !== 'WEEKEND') return;
  const store = await cookies();
  store.set(DEMO_DAY_COOKIE, mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600,
    path: '/',
  });
  revalidatePath('/', 'layout');
}

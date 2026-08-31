// /demo — 심사자 진입점 (SPEC §7). 로그인 없이 즉시 체험 세션을 만들고 데모 데이터를 주입한다.
import { NextRequest, NextResponse } from 'next/server';
import { DEMO_DAY_COOKIE } from '../../lib/day-context';
import { dayType } from '../../lib/day-type';
import { createDemoUser } from '../../lib/demo-seed';
import { USER_COOKIE, userCookieOptions } from '../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await createDemoUser();
  const res = NextResponse.redirect(new URL('/home', req.url), 303);
  res.cookies.set(USER_COOKIE, user.id, userCookieOptions);
  // 요일 토글 초기값 = 실제 오늘의 요일. 이후 화면 최상단 토글로 전환
  res.cookies.set(DEMO_DAY_COOKIE, dayType(new Date()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600,
    path: '/',
  });
  return res;
}

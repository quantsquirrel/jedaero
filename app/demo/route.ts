// /demo — 심사자 진입점 (SPEC §7). 로그인 없이 즉시 체험 세션을 만들고 데모 데이터를 주입한다.
import { NextRequest, NextResponse } from 'next/server';
import { DEMO_DAY_COOKIE } from '../../lib/day-context';
import { createDemoUser, findDemoUser } from '../../lib/demo-seed';
import { USER_COOKIE, userCookieOptions } from '../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 랜딩을 다시 거쳐도 같은 체험 계정과 편성을 유지한다.
  const user = (await findDemoUser(req.cookies.get(USER_COOKIE)?.value)) ?? (await createDemoUser());
  const res = NextResponse.redirect(new URL('/home', req.url), 303);
  res.cookies.set(USER_COOKIE, user.id, userCookieOptions);
  // 새 세션만 평일부터 시작한다. 기존 세션의 토글 선택은 다시 진입해도 보존한다.
  const existingDay = req.cookies.get(DEMO_DAY_COOKIE)?.value;
  const initialDay = existingDay === 'WEEKDAY' || existingDay === 'WEEKEND' ? existingDay : 'WEEKDAY';
  res.cookies.set(DEMO_DAY_COOKIE, initialDay, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600,
    path: '/',
  });
  return res;
}

// 요청 컨텍스트의 요일 판정 — 데모 토글(쿠키)이 있으면 우선 참조 (SPEC §7)
// 판정은 항상 서버에서. 클라이언트 시계를 신뢰하지 않는다.
import { cookies } from 'next/headers';
import { dayType, isRebalanceOpen, type DayType } from './day-type';
import { getSessionUser } from './session';

export const DEMO_DAY_COOKIE = 'demo_day';

// 쿠키는 누구든 위조할 수 있으므로 값만으로는 요일 판정을 덮어쓰지 못한다.
// /demo가 만든 체험 계정(users.is_demo)일 때만 토글을 인정한다 — 실사용자가 쿠키 한 줄로
// 평일 조정 잠금(SPEC §3-5)을 여는 것을 막는다. 세션 조회는 요청 단위로 메모이즈된다(lib/session.ts).
export async function demoOverride(): Promise<DayType | null> {
  const store = await cookies();
  const v = store.get(DEMO_DAY_COOKIE)?.value;
  if (v !== 'WEEKDAY' && v !== 'WEEKEND') return null;
  const user = await getSessionUser();
  return user?.isDemo ? v : null;
}

/** 데모 세션 여부 (토글 표시용) */
export async function isDemoSession(): Promise<boolean> {
  return (await demoOverride()) !== null;
}

export async function currentDayType(): Promise<DayType> {
  return (await demoOverride()) ?? dayType(new Date());
}

/** 비중 조정 가능 여부. 데모 주말 모드에서는 심사자가 언제든 조정을 볼 수 있어야 하므로 열림 */
export async function currentRebalanceOpen(): Promise<boolean> {
  const o = await demoOverride();
  if (o === 'WEEKEND') return true;
  if (o === 'WEEKDAY') return false;
  return isRebalanceOpen(new Date());
}

// 요청 컨텍스트의 요일 판정 — 데모 토글(쿠키)이 있으면 우선 참조 (SPEC §7)
// 판정은 항상 서버에서. 클라이언트 시계를 신뢰하지 않는다.
import { cookies } from 'next/headers';
import { dayType, isRebalanceOpen, type DayType } from './day-type';
import { trustedDemoOverride } from './demo-override';
import { getSessionUser } from './session';

export const DEMO_DAY_COOKIE = 'demo_day';

export async function demoOverride(): Promise<DayType | null> {
  const store = await cookies();
  const v = store.get(DEMO_DAY_COOKIE)?.value;
  const user = await getSessionUser();
  return trustedDemoOverride(v, user?.isDemo === true);
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

import type { DayType } from './day-type';

/** 쿠키 값은 체험 계정이라는 서버 측 근거가 있을 때만 요일 판정을 덮어쓸 수 있다. */
export function trustedDemoOverride(value: string | undefined, isDemo: boolean): DayType | null {
  if (!isDemo) return null;
  return value === 'WEEKDAY' || value === 'WEEKEND' ? value : null;
}

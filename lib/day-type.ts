// 요일 기반 기능 구분 (SPEC §3-4)
// ★ 반드시 서버에서 판정. 클라이언트 시계를 신뢰하지 않는다. KST(UTC+9, DST 없음).
// ★ 시각(hour)으로 접속을 차단하지 않는다. 요일만 본다. (C11)
//   여기의 21:00은 접속 차단이 아니라 "비중 조정 마감" 시각이다.
import { HOLIDAY_SET } from '../db/seed/holidays';

export type DayType = 'WEEKDAY' | 'WEEKEND';

const KST_OFFSET_MS = 9 * 3600_000;

function toKst(now: Date): Date {
  return new Date(now.getTime() + KST_OFFSET_MS);
}

/** KST 기준 오늘 날짜 (YYYY-MM-DD) */
export function kstToday(now: Date = new Date()): string {
  return toKst(now).toISOString().slice(0, 10);
}

export function dayType(now: Date): DayType {
  const k = toKst(now);
  const dow = k.getUTCDay();
  if (dow === 0 || dow === 6) return 'WEEKEND';
  return HOLIDAY_SET.has(k.toISOString().slice(0, 10)) ? 'WEEKEND' : 'WEEKDAY';
}

/**
 * 다음 편성 창까지 남은 일수. 오늘이 이미 편성 창(주말·공휴일)이면 0.
 * 홈 화면의 "다음 편성까지 D-n"에 쓴다 — 전역 D-Day를 대신한다.
 */
export function daysUntilRebalance(now: Date = new Date(), currentType: DayType = dayType(now)): number {
  if (currentType === 'WEEKEND') return 0;
  for (let d = 1; d < 8; d += 1) {
    const probe = new Date(now.getTime() + d * 86_400_000);
    if (dayType(probe) === 'WEEKEND') return d;
  }
  return 0;
}

/** 비중 조정 가능 여부. 일요일 21:00 KST가 그 주 마감 (21:00 정각까지 허용) */
export function isRebalanceOpen(now: Date): boolean {
  if (dayType(now) !== 'WEEKEND') return false;
  const k = toKst(now);
  const minutes = k.getUTCHours() * 60 + k.getUTCMinutes();
  if (k.getUTCDay() === 0 && minutes > 1260) return false; // 일요일 21:00 초과
  return true;
}

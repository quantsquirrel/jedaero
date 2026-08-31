// 가격 시드 접근 유틸. 시드 파일이 원천이며 DB prices 테이블과 내용이 같다 (scripts/seed.ts).
// 미래 가격을 화면에 흘리지 않도록 조회는 항상 "오늘"까지 클램프한다.
import { PRICE_DATES, PRICE_SERIES } from '../../db/seed/prices';

export function pricesUpTo(todayStr: string): { dates: string[]; series: Record<string, number[]> } {
  let n = 0;
  while (n < PRICE_DATES.length && PRICE_DATES[n] <= todayStr) n += 1;
  const dates = PRICE_DATES.slice(0, n);
  const series: Record<string, number[]> = {};
  for (const [tk, arr] of Object.entries(PRICE_SERIES)) series[tk] = arr.slice(0, n);
  return { dates, series };
}

/** 체결일 = 기준일 이후 첫 거래일. 시드 범위를 벗어나면 null */
export function nextTradingDay(afterStr: string): string | null {
  for (const d of PRICE_DATES) if (d > afterStr) return d;
  return null;
}

// 주간 6축 등락 — 규칙 기반 계산. AI가 아니다 (C9 구분 표기 대상).
// 시드 가격만 쓴다. 런타임 외부 API 호출 없음 (C6).
// AI-4 주간 브리핑은 여기서 나온 "숫자"를 입력으로 받는다 — 브리핑이 숫자를 지어내지 않게 하려는 분리다.
import { TICKERS } from '../db/seed/tickers';
import { THEMES, type ThemeCode } from './constants';
import { pricesUpTo } from './portfolio/prices';

// 한 주(영업일 5일)를 등락 구간으로 본다. 거래일이 모자라면 있는 만큼만 본다.
export const WEEK_TRADING_DAYS = 5;

const BY_THEME: Record<string, string[]> = {};
for (const t of TICKERS) (BY_THEME[t.theme] ??= []).push(t.ticker);

export type ThemeMove = {
  code: ThemeCode;
  name: string;
  changePct: number; // 구간 등락률 (0.021 = +2.1%)
  myWeight: number; // 내 목표 비중 %. 배분 이력이 없으면 0
  contributionPct: number; // 등락률 × 비중 — "내 포트폴리오에 얼마나 들어왔나"
};

export type MarketWeek = {
  fromDate: string;
  toDate: string;
  tradingDays: number;
  moves: ThemeMove[]; // 등락률 내림차순
  best: ThemeMove;
  worst: ThemeMove;
  weightedPct: number; // 6축 등락률을 내 비중으로 가중한 값
};

/** 테마 등락률 = 그 테마 종목들의 구간 등락률 동일가중 평균.
 *  종목 수가 축마다 달라 지수를 따로 만들지 않고 평균으로 둔다 — 축 간 비교만 하면 되기 때문이다. */
function themeChange(series: Record<string, number[]>, theme: string, from: number, to: number): number {
  const list = BY_THEME[theme] ?? [];
  let sum = 0;
  let n = 0;
  for (const tk of list) {
    const a = series[tk]?.[from];
    const b = series[tk]?.[to];
    if (!a || !b) continue;
    sum += b / a - 1;
    n += 1;
  }
  return n > 0 ? sum / n : 0;
}

/** 오늘까지의 시드로 최근 한 주(영업일 5일) 6축 등락을 계산한다.
 *  거래일이 2일 미만이면 null — 화면은 "아직 집계할 구간이 없습니다"로 간다. */
export function computeMarketWeek(
  todayStr: string,
  targetWeights: Partial<Record<ThemeCode, number>> = {},
): MarketWeek | null {
  const { dates, series } = pricesUpTo(todayStr);
  if (dates.length < 2) return null;

  const to = dates.length - 1;
  const from = Math.max(0, to - WEEK_TRADING_DAYS);

  const moves: ThemeMove[] = THEMES.map((t) => {
    const changePct = themeChange(series, t.code, from, to);
    const myWeight = targetWeights[t.code] ?? 0;
    return {
      code: t.code,
      name: t.name,
      changePct,
      myWeight,
      contributionPct: changePct * (myWeight / 100),
    };
  }).sort((a, b) => b.changePct - a.changePct);

  return {
    fromDate: dates[from],
    toDate: dates[to],
    tradingDays: to - from,
    moves,
    best: moves[0],
    worst: moves[moves.length - 1],
    weightedPct: moves.reduce((s, m) => s + m.contributionPct, 0),
  };
}

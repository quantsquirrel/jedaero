// 주간 6전선 등락 — 규칙 기반 계산. AI가 아니다 (C9 구분 표기 대상).
// 시드 가격만 쓴다. 런타임 외부 API 호출 없음 (C6).
// AI-4 주간 브리핑은 여기서 나온 "숫자"를 입력으로 받는다 — 브리핑이 숫자를 지어내지 않게 하려는 분리다.
import { REPRESENTATIVE } from '../db/seed/tickers';
import { THEMES, type ThemeCode } from './constants';
import { pricesUpTo } from './portfolio/prices';

// 한 주(영업일 5일)를 등락 구간으로 본다. 거래일이 모자라면 있는 만큼만 본다.
export const WEEK_TRADING_DAYS = 5;

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
  weightedPct: number; // 6전선 등락률을 내 비중으로 가중한 값. 예비대는 0이므로 기여하지 않는다
};

/** 전선 등락률 = 그 전선의 대표지수 등락률.
 *  하위 테마까지 평균 내면 사용자가 고르지도 않은 테마가 전선의 숫자를 흔든다.
 *  기본 편성이 대표지수 추종이므로 화면의 전선 등락률도 대표지수를 따른다. */
function themeChange(series: Record<string, number[]>, theme: ThemeCode, from: number, to: number): number {
  const tk = REPRESENTATIVE[theme];
  const a = series[tk]?.[from];
  const b = series[tk]?.[to];
  if (!a || !b) return 0;
  return b / a - 1;
}

/** 오늘까지의 시드로 최근 한 주(영업일 5일) 6전선 등락을 계산한다.
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

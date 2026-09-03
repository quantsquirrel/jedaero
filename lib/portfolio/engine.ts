// 포트폴리오 곡선 엔진 (SPEC §3-6 e)
// ★ 보유수량을 저장하지 않는다. (비중 이력 × 일별 종가 × 현금흐름)으로 요청 시점에 계산한다.
// ★ 배분 하나, 현금흐름 둘 — 같은 엔진에 현금흐름 배열만 바꿔 넣는다. 로직이 두 벌 생기지 않는다.
// 단순화: 현금 유입일에는 (기존 평가액 + 유입액)을 목표 비중대로 재배분한다.
//   전역(일시금) 곡선은 유입이 1회뿐이므로 이후 목표 vs 현재 갭이 그대로 드러난다.
import { REPRESENTATIVE, TICKERS } from '../../db/seed/tickers';
import { RESERVE, THEME_CODES } from '../constants';

export type WeightHistoryItem = {
  effectiveFrom: string; // 체결 기준일 (그날 종가로 리밸런싱)
  weights: Record<string, number>; // 6전선, 합 100 이하. 나머지는 예비대(현금)다
  details?: Record<string, Record<string, number>> | null; // 전선별 하위 배치(포인트). 없으면 대표지수 추종
};

const BY_THEME: Record<string, string[]> = {};
for (const t of TICKERS) {
  (BY_THEME[t.theme] ??= []).push(t.ticker);
}

/** 비중(전선×하위 테마)을 지수별 비율로 전개.
 *  ★ 하위를 건드리지 않으면 그 전선의 대표지수를 그대로 추종한다 — 동일가중이 아니다.
 *  「기본값 = 지수추종」이 2층 구조의 전제이고, 동일가중으로 두면 사용자가 고르지도 않은
 *  테마 편중이 조용히 생긴다. 하위 합계는 자동 정규화한다. */
export function tickerFractions(h: WeightHistoryItem): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [theme, w] of Object.entries(h.weights)) {
    if (!w) continue;
    const list = BY_THEME[theme] ?? [];
    if (list.length === 0) continue;
    const det = h.details?.[theme];
    const entries = det ? Object.entries(det).filter(([tk, v]) => list.includes(tk) && v > 0) : [];
    if (entries.length > 0) {
      const s = entries.reduce((a, [, v]) => a + v, 0);
      for (const [tk, v] of entries) out[tk] = (out[tk] ?? 0) + (w / 100) * (v / s);
    } else {
      const rep = REPRESENTATIVE[theme as keyof typeof REPRESENTATIVE] ?? list[0];
      out[rep] = (out[rep] ?? 0) + w / 100;
    }
  }
  return out;
}

/** 미배치분 = 예비대 비율. 명목가치가 변하지 않는 현금으로 굴린다 */
export function reserveFraction(h: WeightHistoryItem): number {
  const placed = THEME_CODES.reduce((sum, c) => sum + (h.weights[c] ?? 0), 0);
  return Math.min(1, Math.max(0, (100 - placed) / 100));
}

const THEME_OF: Record<string, string> = {};
for (const t of TICKERS) THEME_OF[t.ticker] = t.theme;

export function computeCurve(
  dates: string[],
  series: Record<string, number[]>,
  history: WeightHistoryItem[],
  cashflows: Record<string, number>,
): { dates: string[]; values: number[]; invested: number; finalThemeValues: Record<string, number> } {
  const sorted = [...history].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  const units: Record<string, number> = {}; // 지수별 수량 (메모리에서만, 저장 금지)
  let cash = 0; // 예비대. 명목가치 고정 — "잃지 않음. 다만 물가만큼 조용히 줄어듦."
  let current: WeightHistoryItem | null = null;
  let hi = 0;
  let invested = 0;
  const values: number[] = [];

  const totalValue = (i: number): number => {
    let s = cash;
    for (const [tk, u] of Object.entries(units)) s += u * (series[tk]?.[i] ?? 0);
    return s;
  };
  const rebalanceTo = (h: WeightHistoryItem, i: number, extraCash = 0) => {
    const total = totalValue(i) + extraCash;
    for (const k of Object.keys(units)) delete units[k];
    cash = 0;
    if (total <= 0) return;
    cash = total * reserveFraction(h);
    for (const [tk, f] of Object.entries(tickerFractions(h))) {
      const price = series[tk]?.[i];
      if (price) units[tk] = (total * f) / price;
    }
  };

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    // 새 비중 발효일 = 체결일. 그날 종가로 전량 리밸런싱
    while (hi < sorted.length && sorted[hi].effectiveFrom <= d) {
      current = sorted[hi];
      hi += 1;
      if (totalValue(i) > 0) rebalanceTo(current, i);
    }
    const cf = cashflows[d];
    if (cf && current) {
      rebalanceTo(current, i, cf);
      invested += cf;
    }
    values.push(totalValue(i));
  }

  // 마지막 시점의 전선별 평가액 — 목표 vs 현재 비중 갭 계산용 (SPEC §3-6 g).
  // 예비대도 한 축처럼 넣는다. 빼면 예비대만 갭 계산에서 사라져 화면이 거짓말을 한다.
  const finalThemeValues: Record<string, number> = {};
  const last = dates.length - 1;
  if (last >= 0) {
    for (const [tk, u] of Object.entries(units)) {
      const theme = THEME_OF[tk];
      if (!theme) continue;
      finalThemeValues[theme] = (finalThemeValues[theme] ?? 0) + u * (series[tk]?.[last] ?? 0);
    }
    if (cash > 0) finalThemeValues[RESERVE.code] = cash;
  }
  return { dates, values, invested, finalThemeValues };
}

export function maxDrawdown(values: number[]): number {
  let peak = -Infinity;
  let mdd = 0;
  for (const v of values) {
    if (v <= 0) continue;
    if (v > peak) peak = v;
    else if (peak > 0) mdd = Math.min(mdd, v / peak - 1);
  }
  return mdd;
}

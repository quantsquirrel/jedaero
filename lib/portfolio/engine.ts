// 포트폴리오 곡선 엔진 (SPEC §3-6 e)
// ★ 보유수량을 저장하지 않는다. (비중 이력 × 일별 종가 × 현금흐름)으로 요청 시점에 계산한다.
// ★ 배분 하나, 현금흐름 둘 — 같은 엔진에 현금흐름 배열만 바꿔 넣는다. 로직이 두 벌 생기지 않는다.
// 단순화: 현금 유입일에는 (기존 평가액 + 유입액)을 목표 비중대로 재배분한다.
//   전역(일시금) 곡선은 유입이 1회뿐이므로 이후 목표 vs 현재 갭이 그대로 드러난다.
import { TICKERS } from '../../db/seed/tickers';

export type WeightHistoryItem = {
  effectiveFrom: string; // 체결 기준일 (그날 종가로 리밸런싱)
  weights: Record<string, number>; // 6축, 합 100
  details?: Record<string, Record<string, number>> | null; // 하위 비중. 없으면 동일가중
};

const BY_THEME: Record<string, string[]> = {};
for (const t of TICKERS) {
  (BY_THEME[t.theme] ??= []).push(t.ticker);
}

/** 비중(상위×하위)을 종목별 비율로 전개. 하위 미조정 시 동일가중, 하위 합계는 자동 정규화 */
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
      for (const tk of list) out[tk] = (out[tk] ?? 0) + w / 100 / list.length;
    }
  }
  return out;
}

export function computeCurve(
  dates: string[],
  series: Record<string, number[]>,
  history: WeightHistoryItem[],
  cashflows: Record<string, number>,
): { dates: string[]; values: number[]; invested: number } {
  const sorted = [...history].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  const units: Record<string, number> = {}; // 종목별 수량 (메모리에서만, 저장 금지)
  let current: WeightHistoryItem | null = null;
  let hi = 0;
  let invested = 0;
  const values: number[] = [];

  const totalValue = (i: number): number => {
    let s = 0;
    for (const [tk, u] of Object.entries(units)) s += u * (series[tk]?.[i] ?? 0);
    return s;
  };
  const rebalanceTo = (h: WeightHistoryItem, i: number, extraCash = 0) => {
    const total = totalValue(i) + extraCash;
    for (const k of Object.keys(units)) delete units[k];
    if (total <= 0) return;
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
  return { dates, values, invested };
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

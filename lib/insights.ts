// AI-7 집단 성향 분석 — 옵트인·상호주의·k-익명성 (SPEC §4 AI-7)
// 표시 5개 축: 테마 비중 / 집중도(최대비중·HHI) / 회전율(주당 변경폭) / 현금비중 / 변동성
// 출력은 사실 서술 + 질문으로 끝난다 (C8, C10). 조언·추천 금지.
import { THEME_CODES, type ThemeCode, type Weights } from './constants';

/** 상호주의: 내 데이터를 주지 않으면 남의 데이터로 만든 분석도 보지 않는다 */
export function needsOptIn(u: { analyticsOptIn: boolean }): boolean {
  return !u.analyticsOptIn;
}

/** k-익명성: 코호트 n<20이면 상위 코호트로 합산 — 전역 월 → 전역 분기 → 전체 */
export function resolveCohort(monthN: number, quarterN: number): 'MONTH' | 'QUARTER' | 'ALL' {
  if (monthN >= 20) return 'MONTH';
  if (quarterN >= 20) return 'QUARTER';
  return 'ALL';
}

export const COHORT_LABEL: Record<'MONTH' | 'QUARTER' | 'ALL', string> = {
  MONTH: '같은 달 전역 예정',
  QUARTER: '같은 분기 전역 예정',
  ALL: '전체 이용자',
};

/** 집중도: 최대 비중과 HHI(Σ(wᵢ/100)²) */
export function maxWeightOf(w: Weights): number {
  return Math.max(...THEME_CODES.map((c) => w[c] ?? 0));
}
export function hhi(w: Weights): number {
  return THEME_CODES.reduce((s, c) => s + ((w[c] ?? 0) / 100) ** 2, 0);
}

/** 회전율: 연속 결정 간 변경폭(Σ|Δw|/2)의 평균. 결정이 1개 이하면 0 */
export function turnover(history: Weights[]): number {
  if (history.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < history.length; i++) {
    let d = 0;
    for (const c of THEME_CODES) d += Math.abs((history[i][c] ?? 0) - (history[i - 1][c] ?? 0));
    total += d / 2;
  }
  return total / (history.length - 1);
}

/** 곡선 일간 수익률의 연환산 변동성 */
export function annualizedVol(values: number[]): number {
  const rets: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) rets.push(values[i] / values[i - 1] - 1);
  }
  if (rets.length < 2) return 0;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type InsightStats = {
  cohort: 'MONTH' | 'QUARTER' | 'ALL';
  cohortN: number;
  myMaxTheme: { code: ThemeCode; weight: number };
  cohortMaxWeightMedian: number;
  myHhi: number;
  myTurnover: number;
  cohortTurnoverMedian: number;
  myCash: number;
  cohortCashMedian: number;
  myVol: number;
  weeksUnchanged: number;
};

/** 규칙 기반 사실 서술 (AI 폴백 겸 기본 표시). 조언하지 않는다 — 사실과 질문만 */
export function buildFactSentences(s: InsightStats, themeName: string): string[] {
  return [
    `최대 테마 비중은 ${themeName} ${s.myMaxTheme.weight}%입니다. ${COHORT_LABEL[s.cohort]} ${s.cohortN}명의 중앙값은 ${Math.round(s.cohortMaxWeightMedian)}%입니다.`,
    `주당 평균 변경폭은 ${s.myTurnover.toFixed(1)}%p, 코호트 중앙값은 ${s.cohortTurnoverMedian.toFixed(1)}%p입니다.`,
    `채권·현금성 비중은 ${s.myCash}%이고, 코호트 중앙값은 ${Math.round(s.cohortCashMedian)}%입니다.`,
    s.weeksUnchanged >= 2
      ? `최근 ${s.weeksUnchanged}주 동안 비중을 바꾸지 않았습니다.`
      : `이 배분은 지난 조정에서 정해졌습니다.`,
    `이 배분은 어떤 생각으로 고르셨나요?`,
  ];
}

// 전선 배분 조작 (DESIGN-DECISIONS §3)
// ★ 비례 재조정을 하지 않는다. 한 축을 올릴 때 다른 축이 저절로 깎이면
//   사용자는 자기가 무엇을 선택했는지 인지하지 못한다. 폐기된 안티패턴이다.
// 조작 단위는 포인트 20개(1포인트 = 5%p). 저장은 그대로 % 정수다.
// 합이 20포인트를 넘을 때만 막고, 남은 포인트는 「예비대」로 화면에 상시 표시한다.
import { POINT_UNIT, THEME_CODES, TOTAL_POINTS, type ThemeCode, type Weights } from '../constants';

export function emptyWeights(): Weights {
  return Object.fromEntries(THEME_CODES.map((c) => [c, 0])) as Weights;
}

export function pointsOf(weights: Weights, code: ThemeCode): number {
  return Math.round((weights[code] ?? 0) / POINT_UNIT);
}

/** 배치된 포인트 합계 */
export function placedPoints(weights: Weights): number {
  return THEME_CODES.reduce((sum, c) => sum + pointsOf(weights, c), 0);
}

/** 예비대 = 미배치 포인트. 0이어도 화면에서 지우지 않는다 */
export function reservePoints(weights: Weights): number {
  return TOTAL_POINTS - placedPoints(weights);
}

/** 한 전선의 포인트를 1개 올리거나 내린다. 다른 전선은 건드리지 않는다. */
export function adjustPoints(weights: Weights, code: ThemeCode, delta: 1 | -1): Weights {
  const current = pointsOf(weights, code);
  const next = current + delta;
  if (next < 0) return weights;
  if (delta > 0 && reservePoints(weights) <= 0) return weights; // 예비대가 비면 더 못 뺀다
  return { ...weights, [code]: next * POINT_UNIT };
}

export function isValidWeights(w: unknown): w is Weights {
  if (!w || typeof w !== 'object') return false;
  const obj = w as Record<string, unknown>;
  if (Object.keys(obj).length !== THEME_CODES.length) return false;
  let sum = 0;
  for (const code of THEME_CODES) {
    const v = obj[code];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 100) return false;
    if (v % POINT_UNIT !== 0) return false; // 포인트는 쪼개지지 않는 병력 단위다
    sum += v;
  }
  return sum <= 100; // 합이 100 미만인 나머지는 예비대. 미달이 아니라 선택이다
}

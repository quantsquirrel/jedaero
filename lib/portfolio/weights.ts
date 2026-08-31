// 6축 비중 조작 (SPEC §3-6 b·c)
// 하나를 움직이면 나머지 5축이 현재 비율대로 비례 조정되어 합계는 항상 100.
// 슬라이더 금지 — 5%p 단위 +/- 버튼이 이 함수를 호출한다. 값은 전부 정수.
import { THEME_CODES, type ThemeCode, type Weights } from '../constants';

export function adjustWeight(weights: Weights, code: ThemeCode, delta: 5 | -5): Weights {
  const current = weights[code] ?? 0;
  const target = Math.min(100, Math.max(0, current + delta));
  if (target === current) return weights;

  const others = THEME_CODES.filter((c) => c !== code);
  const otherSum = 100 - current;
  const newOtherSum = 100 - target;

  // 비례 배분 후 largest remainder로 정수화 (합계 = newOtherSum 보장)
  const raw = others.map((c) =>
    otherSum === 0 ? newOtherSum / others.length : ((weights[c] ?? 0) * newOtherSum) / otherSum,
  );
  const floors = raw.map(Math.floor);
  let remain = newOtherSum - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remain <= 0) break;
    floors[i] += 1;
    remain -= 1;
  }

  const out = { ...weights, [code]: target };
  others.forEach((c, i) => {
    out[c] = floors[i];
  });
  return out;
}

export function isValidWeights(w: unknown): w is Weights {
  if (!w || typeof w !== 'object') return false;
  const obj = w as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== THEME_CODES.length) return false;
  let sum = 0;
  for (const code of THEME_CODES) {
    const v = obj[code];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 100) return false;
    sum += v;
  }
  return sum === 100;
}

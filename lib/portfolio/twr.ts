// TWR — 시간가중수익률 (SPEC §3-6 f, docs/VERIFY.md §C)
// TWR = Π(1 + rᵢ) − 1,  rᵢ = Vᵢ / (Vᵢ₋₁ + Cᵢ) − 1
// 현금흐름 효과를 제거한다: "배분 판단이 좋았나". 비교·랭킹용.
// MWR(내 돈이 실제로 얼마 불었나)과 다르며, 이 차이가 학습 카드 5단계의 내용이다.
export type TwrSegment = { start: number; flow: number; end: number };

export function twr(segments: TwrSegment[]): number {
  let acc = 1;
  for (const s of segments) {
    const base = s.start + s.flow;
    if (base > 0) acc *= s.end / base;
  }
  return acc - 1;
}

/** 단순 수익률 (투입 대비). TWR과의 차이를 화면에 함께 보여준다 */
export function simpleReturn(finalValue: number, invested: number): number {
  return invested > 0 ? finalValue / invested - 1 : 0;
}

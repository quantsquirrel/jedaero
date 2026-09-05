// 표시 포맷. 금액은 원 단위 정수 + 천 단위 콤마
export const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

// ★ 부호는 «표기»가 아니라 접근성 장치다. --up/--down 은 2형 색각에서 ΔE 7.3으로 분리 하한을
//   겨우 넘기므로, 색을 못 읽는 사람에게는 부호가 유일한 단서다 (DESIGN-RULES §1).
//   toFixed() 가 내보내는 ASCII 하이픈(U+002D)은 모노 폰트에서 '+' 보다 눈에 띄게 가늘다.
//   빼기 기호(U+2212)로 바꿔 두 부호의 시각적 무게를 맞춘다.
export const pct = (x: number, digits = 1) =>
  `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(digits)}%`;

export const TIER_LABEL: Record<string, string> = {
  A: 'A · 구조적',
  B: 'B · 계획',
  C: 'C · 재량',
  UNCLASSIFIED: '미분류',
};

/** 만원 단위 축약 표시. 계산은 원 단위 정수로 하고 «표시만» 줄인다.
 *  ★ 병사에게는 「1,840만원」이 「18,400,000원」보다 먼저 읽힌다.
 *  다른 화면은 won()을 그대로 쓴다 — 이 축약은 /principles 전용이다. */
export const manWon = (n: number) => `${Math.round(n / 10_000).toLocaleString('ko-KR')}만원`;

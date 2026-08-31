// 표시 포맷. 금액은 원 단위 정수 + 천 단위 콤마
export const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export const pct = (x: number, digits = 1) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(digits)}%`;

export const TIER_LABEL: Record<string, string> = {
  A: 'A · 구조적',
  B: 'B · 계획',
  C: 'C · 재량',
  UNCLASSIFIED: '미분류',
};

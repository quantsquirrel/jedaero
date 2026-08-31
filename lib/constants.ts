// docs/SEED.md의 상수. 값을 바꾸지 말 것. 금액은 전부 원 단위 정수.

// 계급별 봉급 (2026년 동결. 근거: 공무원보수규정 [별표13])
export const SALARY_2026 = {
  PRIVATE: 750_000, // 이병
  PFC: 900_000, // 일병
  CORPORAL: 1_200_000, // 상병
  SERGEANT: 1_500_000, // 병장
} as const;
export type Rank = keyof typeof SALARY_2026;

// A계층 교통비 상한 (왕복, 자동 인정)
export const TRANSPORT_CAP = {
  NEAR: 20_000,
  MID: 50_000,
  FAR: 90_000,
  ISLAND: 140_000,
} as const;
export type HomeDistance = keyof typeof TRANSPORT_CAP;

// 모의 시드 금액: 장병내일준비적금 18개월 만기 수령액. 전원 동일
export const SEED_AMOUNT = 20_200_000;

// 테마 6축. 사용자가 조작하는 유일한 대상
export const THEMES = [
  { code: 'KR_LARGE', name: '국내 대형주', detailAdjustable: true },
  { code: 'KR_THEME', name: '국내 성장·테마', detailAdjustable: true },
  { code: 'US_INDEX', name: '미국지수', detailAdjustable: false },
  { code: 'BOND_CASH', name: '채권·현금성', detailAdjustable: false },
  { code: 'GOLD_COMM', name: '금·원자재', detailAdjustable: false },
  { code: 'DIVIDEND', name: '배당', detailAdjustable: false },
] as const;
export type ThemeCode = (typeof THEMES)[number]['code'];
export const THEME_CODES = THEMES.map((t) => t.code) as ThemeCode[];

export type Weights = Record<ThemeCode, number>;

// 예시 포트폴리오 4종 — "추천"이 아니라 "예시"다 (C10).
// FOCUS는 의도적으로 위험한 예시. 지우지 말 것. 고르는 순간 MDD를 크게 표시한다.
export const PORTFOLIO_TEMPLATES = [
  {
    id: 'GLOBAL',
    name: '전세계 지수 추종',
    description: '전 세계 주가지수를 그대로 따라갑니다. 가장 흔한 시작점입니다.',
    weights: { KR_LARGE: 20, KR_THEME: 0, US_INDEX: 50, BOND_CASH: 20, GOLD_COMM: 10, DIVIDEND: 0 },
  },
  {
    id: 'DOMESTIC',
    name: '국내 중심',
    description: '국내 기업 위주로 담습니다. 아는 회사부터 보고 싶을 때.',
    weights: { KR_LARGE: 40, KR_THEME: 20, US_INDEX: 0, BOND_CASH: 20, GOLD_COMM: 0, DIVIDEND: 20 },
  },
  {
    id: 'SAFE',
    name: '안전 우선',
    description: '절반을 채권·현금에 둡니다. 값이 덜 흔들립니다.',
    weights: { KR_LARGE: 0, KR_THEME: 0, US_INDEX: 20, BOND_CASH: 50, GOLD_COMM: 10, DIVIDEND: 20 },
  },
  {
    id: 'FOCUS',
    name: '집중',
    description: '특정 테마에 몰아넣습니다. 오를 때 크게 오르고 빠질 때 크게 빠집니다.',
    weights: { KR_LARGE: 20, KR_THEME: 60, US_INDEX: 20, BOND_CASH: 0, GOLD_COMM: 0, DIVIDEND: 0 },
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  weights: Weights;
}>;

// AI rate limit (SPEC §5)
export const AI_RATE_LIMIT = { perMinute: 5, perDay: 50 } as const;

// AI-1: 신뢰도가 이 값 미만이면 분류하지 않고 사용자에게 묻는다 (오분류 비용 > 미분류 비용)
export const CONFIDENCE_THRESHOLD = 0.7;

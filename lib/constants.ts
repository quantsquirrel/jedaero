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
export const SEED_AMOUNT = 20_000_000;

// 상위 6전선. 사용자가 나누는 유일한 대상 (DESIGN-DECISIONS §4)
// 상관관계가 낮은 축으로만 구성한다. 「배당」은 자산군이 아니라 스타일이므로 하위 테마로 내렸고,
// 「현금성」은 예비대(미배치분)와 개념이 중복되므로 축에서 뺐다.
// detailAdjustable = 하위 테마 조정 UI를 여는 전선 (D-5 현실상 주식 두 전선만 먼저 연다)
export const THEMES = [
  { code: 'KR_STOCK', name: '국내 주식', detailAdjustable: true },
  { code: 'US_STOCK', name: '미국 주식', detailAdjustable: true },
  { code: 'INTL_STOCK', name: '기타 해외', detailAdjustable: false },
  { code: 'BOND', name: '채권', detailAdjustable: false },
  { code: 'GOLD_COMM', name: '금·원자재', detailAdjustable: false },
  { code: 'REIT_INFRA', name: '리츠·인프라', detailAdjustable: false },
] as const;
export type ThemeCode = (typeof THEMES)[number]['code'];
export const THEME_CODES = THEMES.map((t) => t.code) as ThemeCode[];

export type Weights = Record<ThemeCode, number>;

// 포인트 20개 = 100%. 1포인트 = 5%p (DESIGN-DECISIONS §3)
// 저장 형식은 그대로 % 정수다. 포인트는 화면·조작 단위이며 5의 배수라는 제약이 둘을 잇는다.
export const POINT_UNIT = 5;
export const TOTAL_POINTS = 20;

// 예비대 = 어느 전선에도 배치하지 않은 병력. 축이 아니라 「잔여」이므로 THEMES에 넣지 않는다.
// 화면에는 항상 보여야 한다 — 보이지 않으면 방치가 되고, 보이면 선택이 된다.
export const RESERVE = {
  code: 'RESERVE',
  name: '예비대',
  note: '잃지 않음. 다만 물가만큼 조용히 줄어듦.',
} as const;

// 예시 작전 5종 — "추천"이 아니라 "예시"다 (C10).
// 「안정형/공격형」 같은 투자성향 라벨을 쓰지 않는다. 작전명 + 성격 + 장단점 3종 세트.
// ★ 균형 규칙: 다섯 작전의 +/− 개수와 문장 무게를 비슷하게 유지한다.
//   어느 하나가 정답으로 보이면 그 순간 예시가 아니라 추천이 된다. 문구를 고칠 때도 이 균형을 지킬 것.
export const OPERATIONS = [
  {
    id: 'ALLIANCE',
    name: '연합작전',
    character: '전 전선에 고르게 배치.',
    pros: ['어느 전선이 무너져도 전체는 유지됨.', '변동성 낮음. 판단 부담 적음.'],
    cons: ['어떤 해에도 선두는 어려움.', '급등장에서 상대적 박탈감 큼.'],
    weights: { KR_STOCK: 20, US_STOCK: 20, INTL_STOCK: 15, BOND: 20, GOLD_COMM: 15, REIT_INFRA: 10 },
  },
  {
    id: 'BREAKTHROUGH',
    name: '돌파',
    character: '주식에 화력 집중. 방어 자산 최소.',
    pros: ['상승장 속도 최대.', '구조 단순. 판단 빠름.'],
    cons: ['측면이 열림. 하락장 방어 병력 없음.', '변동성 큼. 흔들림을 오래 견뎌야 함.'],
    weights: { KR_STOCK: 35, US_STOCK: 40, INTL_STOCK: 15, BOND: 0, GOLD_COMM: 5, REIT_INFRA: 5 },
  },
  {
    id: 'DEPTH',
    name: '종심 방어',
    character: '채권·금으로 방어선을 겹쳐 깖.',
    pros: ['낙폭 얕음. 흔들림 적음.', '하락장에서 재편성 여력 남음.'],
    cons: ['상승장 수익 제한적.', '물가 상승분을 못 따라갈 수 있음.'],
    weights: { KR_STOCK: 10, US_STOCK: 15, INTL_STOCK: 5, BOND: 45, GOLD_COMM: 20, REIT_INFRA: 5 },
  },
  {
    id: 'STRONGHOLD',
    name: '거점 확보',
    character: '최대 시장에 거점. 나머지는 얇게.',
    pros: ['최대 시장에 거점. 유동성 풍부.', '환율 상승 시 이중 수혜.'],
    cons: ['환율 하락 시 이중 타격.', '미국 시장 정체 시 동반 정체.'],
    weights: { KR_STOCK: 10, US_STOCK: 55, INTL_STOCK: 5, BOND: 20, GOLD_COMM: 5, REIT_INFRA: 5 },
  },
  {
    // ★ 5종 중 유일하게 20포인트를 다 쓰지 않는다. 예비대 개념을 예시로 직접 보여주는 장치다. 지우지 말 것.
    id: 'RECON',
    name: '정찰 침투',
    character: '넓고 얕게 배치. 실탄 보유.',
    pros: ['실탄 보유. 기회 시 즉시 투입 가능.', '개별 실패의 타격 작음.'],
    cons: ['무엇이 올라도 체감 작음.', '예비대는 물가에 잠식됨.'],
    weights: { KR_STOCK: 10, US_STOCK: 15, INTL_STOCK: 10, BOND: 15, GOLD_COMM: 10, REIT_INFRA: 5 },
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  character: string;
  pros: readonly string[];
  cons: readonly string[];
  weights: Weights;
}>;

// AI rate limit (SPEC §5)
export const AI_RATE_LIMIT = { perMinute: 5, perDay: 50 } as const;

// AI-1: 신뢰도가 이 값 미만이면 분류하지 않고 사용자에게 묻는다 (오분류 비용 > 미분류 비용)
export const CONFIDENCE_THRESHOLD = 0.7;

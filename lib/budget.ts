// 예산 봉투·준수율·저축액 (SPEC §3-2, §3-3, §3-8)
export const BUDGET_CATEGORIES = ['통신비', '생필품', '외박 식비', '이발', '자기계발', '기타'] as const;

// 봉투 카테고리 매칭용 키워드 (memo 기반, 미매칭은 '기타')
const CATEGORY_KEYWORDS: [string, RegExp][] = [
  ['통신비', /통신|요금제|휴대폰/],
  ['생필품', /생필품|세면|샴푸|치약|화장품|깔창|양말|속옷/],
  ['외박 식비', /식비|식사|밥값/],
  ['이발', /이발|미용|커트/],
  ['자기계발', /책|도서|강의|인강|자격증|자기계발/],
];

export function matchCategory(memo: string | null): string {
  if (memo) {
    for (const [cat, re] of CATEGORY_KEYWORDS) if (re.test(memo)) return cat;
  }
  return '기타';
}

/** 예산 준수율 = 1 − Σ|배정액 − 실지출| / Σ배정액 (0~1 클램프). 절약량이 아니라 예측 정확도다 */
export function budgetAccuracy(envelopes: { allocated: number; spent: number }[]): number {
  const totalAllocated = envelopes.reduce((s, e) => s + e.allocated, 0);
  if (totalAllocated <= 0) return 0;
  const deviation = envelopes.reduce((s, e) => s + Math.abs(e.allocated - e.spent), 0);
  return Math.min(1, Math.max(0, 1 - deviation / totalAllocated));
}

/** 월저축액 = 봉급 − A계층합계 − B실지출 − C실지출. 실제 금액 그대로 (SPEC §3-3).
 *  개인 화면과 적립 시뮬레이션에만 쓴다. 랭킹에 쓰지 않는다. 환산 공식을 만들지 않는다. */
export function monthlySavings(salary: number, monthExpenseSum: number): number {
  return Math.max(0, salary - monthExpenseSum);
}

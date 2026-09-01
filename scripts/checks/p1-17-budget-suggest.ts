// P1-17: AI-2 봉투 제안 폴백 — 규칙 기반 제안이 봉급을 넘지 않는가
// 키가 없어도, 429여도, 킬스위치가 내려가도 이 값이 화면에 뜬다. 여기가 틀리면 사용자가 틀린 숫자를 확정한다.
import { BUDGET_CATEGORIES } from '../../lib/budget';
import { previousMonths, suggestBudgetFallback, type CategoryHistory } from '../../lib/budget-plan';
import { SALARY_2026 } from '../../lib/constants';

let failed = 0;

// previousMonths: 연도 경계를 넘어가는가
const pm = previousMonths('2026-02', 3);
if (pm.join(',') !== '2025-11,2025-12,2026-01') {
  console.log(`previousMonths('2026-02', 3) = ${pm.join(',')} (기대 2025-11,2025-12,2026-01)`);
  failed += 1;
}

const h = (category: string, monthly: number[]): CategoryHistory => {
  const s = [...monthly].sort((a, b) => a - b);
  return { category, monthly, median: s[1], max: Math.max(...monthly), count: monthly.filter(Boolean).length };
};

// 중앙값을 쓰는가 — 한 달 튄 지출(휴가 달 식비)이 다음 달 배정을 끌어올리면 안 된다
const salary = SALARY_2026.CORPORAL;
const spiky = suggestBudgetFallback([h('외박 식비', [30_000, 32_000, 300_000])], salary);
if (spiky[0]?.allocated !== 32_000) {
  console.log(`튄 달이 배정에 반영됨: ${spiky[0]?.allocated} (기대 32,000 — 중앙값)`);
  failed += 1;
}

// 지출이 0인 카테고리는 억지로 배정하지 않는다
const withZero = suggestBudgetFallback([h('통신비', [45_000, 45_000, 45_000]), h('이발', [0, 0, 0])], salary);
if (withZero.some((e) => e.category === '이발')) {
  console.log('과거 지출 0인 카테고리에 배정이 생김');
  failed += 1;
}

// 봉급 초과 시 비례 축소 — 합계가 봉급을 넘지 않아야 한다
const huge = suggestBudgetFallback(
  BUDGET_CATEGORIES.map((c) => h(c, [900_000, 900_000, 900_000])),
  salary,
);
const total = huge.reduce((s, e) => s + e.allocated, 0);
if (total > salary) {
  console.log(`배정 합계 ${total.toLocaleString('ko-KR')}원이 봉급 ${salary.toLocaleString('ko-KR')}원 초과`);
  failed += 1;
}
// 전부 1,000원 단위 정수여야 한다 (금액은 원 단위 정수, 부동소수 금지)
for (const e of [...huge, ...spiky, ...withZero]) {
  if (!Number.isInteger(e.allocated) || e.allocated % 1000 !== 0) {
    console.log(`1,000원 단위가 아님: ${e.category} ${e.allocated}`);
    failed += 1;
  }
}

if (failed > 0) process.exit(1);
console.log(
  `중앙값 채택·0 카테고리 제외·봉급 초과 시 비례 축소(${total.toLocaleString('ko-KR')} ≤ ${salary.toLocaleString('ko-KR')})·1,000원 단위 유지`,
);

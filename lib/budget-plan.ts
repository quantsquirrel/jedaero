// AI-2 봉투 제안의 순수 계산부 — DB를 import하지 않는다 (scripts/checks/가 DB 없이 검증한다).
// 조회는 lib/budget-history.ts가, 표현은 components/budget-form.tsx가 맡는다.
import { BUDGET_CATEGORIES } from './budget';

export type CategoryHistory = {
  category: string;
  monthly: number[]; // 최근 3개월 실지출 (오래된 달 → 최근 달)
  median: number;
  max: number;
  count: number; // 3개월 총 건수
};

/** yearMonth 기준 직전 n개월의 YYYY-MM 목록 (오래된 순) */
export function previousMonths(yearMonth: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(`${yearMonth}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - i);
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export type BudgetEntry = { category: string; allocated: number; reason: string };

/** 규칙 기반 제안 — 3개월 중앙값. 키가 없어도, 429여도 이 값이 뜬다. 생성형 AI 아님 (C9).
 *  중앙값을 쓰는 이유: 한 달 튄 지출(휴가 달의 식비)이 다음 달 배정을 끌어올리지 않게 하려는 것이다. */
export function suggestBudgetFallback(history: CategoryHistory[], salary: number): BudgetEntry[] {
  const raw: BudgetEntry[] = history
    .filter((h) => h.median > 0 && BUDGET_CATEGORIES.includes(h.category as (typeof BUDGET_CATEGORIES)[number]))
    .map((h) => ({
      category: h.category,
      allocated: Math.round(h.median / 1000) * 1000,
      reason: `최근 3개월 중앙값 ${h.median.toLocaleString('ko-KR')}원`,
    }))
    .filter((e) => e.allocated > 0);

  // 봉급을 넘지 않게 비례 축소 후 1,000원 단위로 내림. 봉투는 B의 도구이므로 전액을 배정하지 않는다.
  const total = raw.reduce((s, e) => s + e.allocated, 0);
  if (total > salary && total > 0) {
    const k = salary / total;
    for (const e of raw) e.allocated = Math.floor((e.allocated * k) / 1000) * 1000;
  }
  return raw.filter((e) => e.allocated > 0);
}

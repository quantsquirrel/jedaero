// 「매달 모았다면」 현금흐름 (SPEC §3-6 e)
// ★ 포트폴리오를 두 개 운영하지 않는다. 같은 비중 이력·같은 가격에 현금흐름 배열만 바꿔
//   같은 엔진(computeCurve)에 넣는다. DB에 저장하지 않고 요청 시점에 계산한다.
// ★ 두 곡선은 대안이지 구성요소가 아니다. 합산 금지 — 같은 돈을 두 번 세는 것이다.
import { SALARY_2026, type Rank } from '../constants';
import { monthlySavings } from '../budget';

/** 곡선 구간의 매월 첫 거래일에 그 달의 실제 저축액(봉급 − 실지출)을 넣는 현금흐름.
 *  지출 기록이 없는 달은 봉급 전액이 저축액이 된다. */
export function buildSavingsCashflows(
  rank: Rank,
  expenseRows: { occurredOn: string; amount: number }[],
  dates: string[],
  fromDate: string,
): Record<string, number> {
  const salary = SALARY_2026[rank];
  const spentByMonth = new Map<string, number>();
  for (const e of expenseRows) {
    const ym = e.occurredOn.slice(0, 7);
    spentByMonth.set(ym, (spentByMonth.get(ym) ?? 0) + e.amount);
  }

  const cashflows: Record<string, number> = {};
  let prevMonth = '';
  for (const d of dates) {
    if (d < fromDate) continue;
    const ym = d.slice(0, 7);
    if (ym !== prevMonth) {
      cashflows[d] = monthlySavings(salary, spentByMonth.get(ym) ?? 0);
      prevMonth = ym;
    }
  }
  return cashflows;
}

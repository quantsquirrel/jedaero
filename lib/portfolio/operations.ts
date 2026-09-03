// 예시 작전 5종의 시드 구간 성과 (온보딩 카드용)
// "추천"이 아니라 "예시"다 (C10). 누적수익률과 MDD를 반드시 함께 표시한다.
// ★ 다섯 중 하나를 위험한 예시로 특별 취급하지 않는다. 장단점을 같은 무게로 병기하는 것이
//   그 자리를 대신한다 — 어느 하나가 정답으로 보이면 예시가 아니라 추천이 된다.
import { OPERATIONS, SEED_AMOUNT, type Weights } from '../constants';
import { computeCurve, maxDrawdown } from './engine';
import { pricesUpTo } from './prices';
import { reservePoints } from './weights';

export type OperationStat = {
  id: string;
  name: string;
  character: string;
  pros: readonly string[];
  cons: readonly string[];
  weights: Weights;
  reservePoints: number;
  cumulativeReturn: number; // 누적수익률 (예: 0.12 = +12%)
  mdd: number; // 최대낙폭 (예: -0.3 = -30%)
};

export function operationStats(todayStr: string): OperationStat[] {
  const { dates, series } = pricesUpTo(todayStr);
  return OPERATIONS.map((op) => {
    const weights = op.weights as Weights;
    const { values, invested } = computeCurve(
      dates,
      series,
      [{ effectiveFrom: dates[0], weights }],
      { [dates[0]]: SEED_AMOUNT },
    );
    const final = values[values.length - 1] ?? 0;
    return {
      id: op.id,
      name: op.name,
      character: op.character,
      pros: op.pros,
      cons: op.cons,
      weights,
      reservePoints: reservePoints(weights),
      cumulativeReturn: invested > 0 ? final / invested - 1 : 0,
      mdd: maxDrawdown(values),
    };
  });
}

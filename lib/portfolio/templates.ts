// 예시 포트폴리오 4종의 시드 구간 성과 (온보딩 카드용)
// "추천"이 아니라 "예시"다 (C10). 누적수익률과 MDD를 반드시 함께 표시한다.
import { PORTFOLIO_TEMPLATES, SEED_AMOUNT } from '../constants';
import { computeCurve, maxDrawdown } from './engine';
import { pricesUpTo } from './prices';

export type TemplateStat = {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  cumulativeReturn: number; // 누적수익률 (예: 0.12 = +12%)
  mdd: number; // 최대낙폭 (예: -0.3 = -30%)
};

export function templateStats(todayStr: string): TemplateStat[] {
  const { dates, series } = pricesUpTo(todayStr);
  return PORTFOLIO_TEMPLATES.map((t) => {
    const { values, invested } = computeCurve(
      dates,
      series,
      [{ effectiveFrom: dates[0], weights: t.weights }],
      { [dates[0]]: SEED_AMOUNT },
    );
    const final = values[values.length - 1] ?? 0;
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      weights: t.weights,
      cumulativeReturn: invested > 0 ? final / invested - 1 : 0,
      mdd: maxDrawdown(values),
    };
  });
}

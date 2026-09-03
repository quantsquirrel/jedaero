// 도상훈련 엔진 — 지금 편성 × 고정 과거 구간. 새 체결 로직 없음. computeCurve 재사용.
import { SEED_AMOUNT, type ThemeCode } from '../constants';
import { computeCurve, maxDrawdown, type WeightHistoryItem } from '../portfolio/engine';
import { drillSeries } from './fixtures';
import { DRILL_SCENARIOS, type DrillScenarioId } from './scenarios';

export type { DrillScenarioId };

export type DrillResult = {
  scenarioId: DrillScenarioId;
  fromDate: string;
  toDate: string;
  endValue: number;
  troughValue: number;
  mdd: number;
  troughTradingDays: number;
  dates: string[];
  values: number[];
};

export function runDrill(
  weights: Partial<Record<ThemeCode, number>>,
  scenarioId: DrillScenarioId,
  details?: WeightHistoryItem['details'],
): DrillResult {
  const sc = DRILL_SCENARIOS.find((s) => s.id === scenarioId);
  if (!sc) throw new Error(`unknown drill scenario: ${scenarioId}`);

  const { dates, series } = drillSeries(scenarioId);
  const first = dates[0];
  const history: WeightHistoryItem[] = [
    {
      effectiveFrom: first,
      weights: { ...weights },
      details: details ?? null,
    },
  ];
  const { values } = computeCurve(dates, series, history, { [first]: SEED_AMOUNT });

  let troughIdx = 0;
  let troughRaw = values[0] ?? 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < troughRaw) {
      troughRaw = values[i];
      troughIdx = i;
    }
  }

  return {
    scenarioId,
    fromDate: sc.fromDate,
    toDate: sc.toDate,
    endValue: Math.round(values[values.length - 1] ?? 0),
    troughValue: Math.round(troughRaw),
    mdd: maxDrawdown(values),
    troughTradingDays: troughIdx + 1,
    dates,
    values,
  };
}

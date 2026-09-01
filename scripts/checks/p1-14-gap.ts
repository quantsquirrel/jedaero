// P1-14: 목표 vs 현재 갭이 데모 시드에서 실제로 벌어지는가 (P0-1 회귀 방지)
// 배포본에서 6축 전부 0%p로 떠서 리밸런싱 개념이 화면에서 사라졌던 사고를 막는다.
// 원인은 엔진이 아니라 시드였다 — 마지막 체결이 어제면 시장이 비중을 흐트러뜨릴 시간이 없다.
import { THEMES } from '../../lib/constants';
import { ACTIVE_WEIGHT_STORY } from '../../lib/demo-story';
import { computeCurve, type WeightHistoryItem } from '../../lib/portfolio/engine';
import { nextTradingDay, pricesUpTo } from '../../lib/portfolio/prices';
import { SEED_AMOUNT } from '../../lib/constants';
import { addDays, mondayOfWeeksAgo } from '../../lib/week';

// 화면이 갭을 소수 첫째자리로 표시하므로 0.2%p면 눈에 보이고 되돌리기 버튼도 뜬다.
// 6축으로 분산된 포트폴리오의 표류는 보통 1%p 미만이다 — 정수 반올림하면 전부 0이 되던 게 P0-1이었다.
const MIN_GAP_PP = 0.2;

const now = new Date();
const todayStr = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

const history: WeightHistoryItem[] = ACTIVE_WEIGHT_STORY.map((w) => {
  const sunday = addDays(mondayOfWeeksAgo(now, w.weeksAgo), 6);
  return {
    effectiveFrom: nextTradingDay(sunday) ?? addDays(sunday, 1),
    weights: w.weights,
    details: null,
  };
}).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

const { dates, series } = pricesUpTo(todayStr);
if (dates.length === 0) {
  console.log(`가격 시드가 ${todayStr}까지 비어 있음 — 시드 구간을 확인할 것`);
  process.exit(1);
}

const curve = computeCurve(dates, series, history, { [history[0].effectiveFrom]: SEED_AMOUNT });
const total = Object.values(curve.finalThemeValues).reduce((a, b) => a + b, 0);
if (total <= 0) {
  console.log('곡선 평가액이 0 — 체결일이 가격 구간 밖일 수 있음');
  process.exit(1);
}

const target = history[history.length - 1].weights;
const round1 = (x: number) => Math.round(x * 10) / 10;
const gaps = THEMES.map((t) => {
  const current = round1(((curve.finalThemeValues[t.code] ?? 0) / total) * 100);
  return { name: t.name, gap: round1(current - (target[t.code] ?? 0)) };
});
const maxAbs = Math.max(...gaps.map((g) => Math.abs(g.gap)));
const detail = gaps.map((g) => `${g.name} ${g.gap > 0 ? '+' : ''}${g.gap.toFixed(1)}%p`).join(', ');
const lastEffective = history[history.length - 1].effectiveFrom;
const driftDays = dates.filter((d) => d > lastEffective).length;

if (maxAbs < MIN_GAP_PP) {
  console.log(`최대 갭 ${maxAbs.toFixed(1)}%p (기대 ${MIN_GAP_PP}%p 이상) — 마지막 체결 ${lastEffective} 이후 거래일 ${driftDays}일. ${detail}`);
  process.exit(1);
}
console.log(`최대 갭 ${maxAbs.toFixed(1)}%p — 마지막 체결 ${lastEffective} 이후 거래일 ${driftDays}일. ${detail}`);

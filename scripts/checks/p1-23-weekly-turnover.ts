// P1-23: 제대로 지수 「판단을 지킨 힘」 — 실제 주차를 분모로 쓰고 예비대 이동도 온전히 센다.
import { jedaeroIndex } from '../../lib/jedaero-index';
import { turnoverBetween, weeklyTurnover } from '../../lib/insights';
import type { Weights } from '../../lib/constants';
import { weeksBetween } from '../../lib/week';

const w = (o: Partial<Weights>): Weights =>
  ({ KR_STOCK: 0, US_STOCK: 0, INTL_STOCK: 0, BOND: 0, GOLD_COMM: 0, REIT_INFRA: 0, ...o }) as Weights;

function fail(message: string): never {
  console.log(message);
  process.exit(1);
}

const reserve = w({});
const onePoint = w({ KR_STOCK: 5 });
if (turnoverBetween(reserve, onePoint) !== 5) {
  fail(`예비대→전선 5%p 이동이 ${turnoverBetween(reserve, onePoint)}%p로 계산됨`);
}

const balanced = w({ KR_STOCK: 20, US_STOCK: 20, BOND: 20, GOLD_COMM: 20, REIT_INFRA: 20 });
const newUser = weeklyTurnover([{ weekOf: '2026-36', weights: balanced }], '2026-36');
if (newUser !== null) fail(`첫 편성 주 회전율이 null이 아님: ${newUser}`);
const newScore = jedaeroIndex({
  annualReturn: null,
  annualVol: null,
  weights: balanced,
  turnoverPct: newUser,
});
if (newScore.held !== 0) fail(`첫 편성 직후 판단을 지킨 힘 ${newScore.held}점 (기대 0)`);

const heldOneWeek = weeklyTurnover([{ weekOf: '2026-35', weights: onePoint }], '2026-36');
if (heldOneWeek !== 0) fail(`한 주 유지한 편성의 회전율 ${heldOneWeek}%p (기대 0)`);

const spreadOverFourWeeks = weeklyTurnover(
  [
    { weekOf: '2026-32', weights: reserve },
    { weekOf: '2026-36', weights: onePoint },
  ],
  '2026-36',
);
if (spreadOverFourWeeks !== 1.25) {
  fail(`4주 동안 5%p 이동의 주당 평균이 ${spreadOverFourWeeks}%p (기대 1.25)`);
}

if (weeksBetween('2026-53', '2027-01') !== 1) {
  fail(`ISO 연말 주차 간격 오류: ${weeksBetween('2026-53', '2027-01')}`);
}

console.log('첫 편성 주 0점 · 한 주 유지 후 회전율 0 · 예비대 이동 5%p · 무변경 주와 ISO 연말 경계 반영');

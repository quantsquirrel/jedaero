// P1-18: 도상훈련 — 고정 12개월 3장, 교육용 시계열, computeCurve 재사용
// 고점→저점만 자르면 종심 방어가 세 판을 이긴다. 승자가 카드마다 갈려야 한다 (C10).
import { OPERATIONS, SEED_AMOUNT, type Weights } from '../../lib/constants';
import { DRILL_SCENARIOS } from '../../lib/drill/scenarios';
import { drillSeries } from '../../lib/drill/fixtures';
import { runDrill, type DrillScenarioId } from '../../lib/drill/run';
import { REPRESENTATIVE } from '../../db/seed/tickers';

const IDS: DrillScenarioId[] = ['crash-recover', 'both-down', 'still-red'];
const EXPECTED: Record<DrillScenarioId, { from: string; to: string }> = {
  'crash-recover': { from: '2020-02-03', to: '2021-01-29' },
  'both-down': { from: '2022-01-03', to: '2022-12-29' },
  'still-red': { from: '2008-09-01', to: '2009-08-31' },
};

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

if (DRILL_SCENARIOS.length !== 3) fail(`시나리오 ${DRILL_SCENARIOS.length}장 — 3장이어야 함`);

for (const id of IDS) {
  const sc = DRILL_SCENARIOS.find((s) => s.id === id);
  if (!sc) {
    fail(`${id} 없음`);
    continue;
  }
  if (sc.fromDate !== EXPECTED[id].from || sc.toDate !== EXPECTED[id].to) {
    fail(`${id} 구간 ${sc.fromDate}~${sc.toDate} ≠ ${EXPECTED[id].from}~${EXPECTED[id].to}`);
  }
  const { dates, series } = drillSeries(id);
  if (dates[0] !== sc.fromDate || dates[dates.length - 1] !== sc.toDate) {
    fail(`${id} 시계열 양끝 ${dates[0]}~${dates[dates.length - 1]}`);
  }
  if (dates.length < 200) fail(`${id} 영업일 ${dates.length} — 12개월이면 200일 이상`);

  const kr = series[REPRESENTATIVE.KR_STOCK];
  const bd = series[REPRESENTATIVE.BOND];
  const gold = series[REPRESENTATIVE.GOLD_COMM];
  if (!kr || !bd || !gold) {
    fail(`${id} 대표지수 시세 없음`);
    continue;
  }
  const start = kr[0];
  const end = kr[kr.length - 1];
  const trough = Math.min(...kr);
  if (id === 'crash-recover') {
    if (trough / start > 0.78) fail(`급락 후 회복: 국내 저점 ${(trough / start).toFixed(2)} — 더 깊어야 함`);
    if (end / start < 1) fail(`급락 후 회복: 국내 끝이 시작보다 낮음`);
    if (end <= trough) fail(`급락 후 회복: 끝과 저점이 갈리지 않음`);
  }
  if (id === 'both-down') {
    if (end >= start) fail(`같이 내린 해: 국내가 안 내림`);
    if (bd[bd.length - 1] >= bd[0]) fail(`같이 내린 해: 채권이 안 내림`);
    // 금을 정답처럼 부각하지 않음 — 소폭만
    const goldRet = gold[gold.length - 1] / gold[0] - 1;
    if (goldRet > 0.12) fail(`같이 내린 해: 금 수익률 ${(goldRet * 100).toFixed(1)}% — 정답처럼 보임`);
  }
  if (id === 'still-red') {
    if (end / start > 0.9) fail(`1년 후에도 빨간: 국내가 거의 회복함 (${(end / start).toFixed(2)})`);
  }
}

const op = (id: string) => OPERATIONS.find((o) => o.id === id)!.weights as Weights;

const endOf = (weights: Weights, sid: DrillScenarioId) => runDrill(weights, sid).endValue;
const mddOf = (weights: Weights, sid: DrillScenarioId) => runDrill(weights, sid).mdd;

let depthSweepsEnd = true;
let depthSweepsMdd = true;
let breakthroughSweepsEnd = true;
for (const sid of IDS) {
  const depthEnd = endOf(op('DEPTH'), sid);
  const breakEnd = endOf(op('BREAKTHROUGH'), sid);
  const allyEnd = endOf(op('ALLIANCE'), sid);
  if (!(depthEnd > breakEnd && depthEnd > allyEnd)) depthSweepsEnd = false;
  if (!(breakEnd > depthEnd && breakEnd > allyEnd)) breakthroughSweepsEnd = false;
  const depthMdd = mddOf(op('DEPTH'), sid);
  const breakMdd = mddOf(op('BREAKTHROUGH'), sid);
  const allyMdd = mddOf(op('ALLIANCE'), sid);
  if (!(depthMdd > breakMdd && depthMdd > allyMdd)) depthSweepsMdd = false; // mdd는 음수, 클수록 얕음
}

if (depthSweepsEnd && depthSweepsMdd) fail('종심 방어가 세 장 모두 끝 평가액·MDD를 이김 — 예시가 추천이 됨');
if (breakthroughSweepsEnd) fail('돌파가 세 장 모두 끝 평가액을 이김 — 구간이 한쪽으로 치우침');

const sample = runDrill(op('ALLIANCE'), 'crash-recover');
if (!Number.isInteger(sample.endValue) || !Number.isInteger(sample.troughValue)) {
  fail(`평가액이 정수가 아님: end=${sample.endValue} trough=${sample.troughValue}`);
}
if (sample.endValue < 1_000_000 || sample.endValue > 80_000_000) {
  fail(`연합작전 급락회복 평가액 ${sample.endValue} — 시드 ${SEED_AMOUNT} 근처가 아님`);
}
if (sample.troughValue > sample.endValue) fail('저점이 구간 끝보다 큼');
if (sample.troughTradingDays < 1) fail('저점까지 영업일 수 없음');
if (sample.values.length !== sample.dates.length) fail('곡선 길이가 날짜와 다름');

// 하위 테마가 결과를 실제로 바꾸는가 — runDrill(details)가 무시되면 «지수 추종과 완전히 동일»이 나온다.
// 그리고 같은 전선 안에서 둘로 나눠도 낙폭이 거의 줄지 않아야 한다 (DESIGN-DECISIONS §4).
{
  const w = { KR_STOCK: 40, US_STOCK: 20, BOND: 20, GOLD_COMM: 20 } as Weights;
  const plain = runDrill(w, 'crash-recover');
  const one = runDrill(w, 'crash-recover', { KR_STOCK: { 'KR-SEMI': 8 } });
  const two = runDrill(w, 'crash-recover', { KR_STOCK: { 'KR-SEMI': 4, 'KR-BIO': 4 } });
  if (one.endValue === plain.endValue) fail('하위 테마가 무시됨 — 지수 추종과 결과가 같다');
  if (!(one.mdd < plain.mdd)) fail('하위 테마 낙폭이 대표지수보다 얕음 — 섹터가 시장보다 뾰족해야 한다');
  // 같은 전선 안에서 둘로 나눠도 낙폭 개선은 미미해야 한다 (1%p 미만)
  if (two.mdd - one.mdd > 0.01) {
    fail(`같은 전선 안 분산이 낙폭을 ${((two.mdd - one.mdd) * 100).toFixed(1)}%p 줄임 — 학습 카드 2가 거짓말이 된다`);
  }
}

const still = DRILL_SCENARIOS.find((s) => s.id === 'still-red');
if (!still?.caption.includes('역사의 끝이 아닙니다')) fail('2008 카드 고정 캡션 누락');
const shared = still?.sharedCaption ?? '';
if (!shared.includes('같은 12개월')) fail('세 장 공통 캡션 누락');

if (failed > 0) process.exit(1);
console.log('도상훈련 3장 구간·교훈·승자 분산·정수 평가액 · 하위 테마 반영(같은 전선 분산은 낙폭을 못 줄임) 통과');

// P1-26: 나의 투자 원칙 — 사실 문장 계산 + 문안 규칙
// ★ 문장 규칙을 사람의 주의력이 아니라 스크립트가 지킨다. 이 기능의 핵심 방어선이다.
// ★ DB를 쓰지 않는다. 가격 시드 파일과 순수 함수만으로 돌린다.
import { PRICE_DATES } from '../../db/seed/prices';
import { pricesUpTo } from '../../lib/portfolio/prices';
import { ACTIVE_WEIGHT_STORY } from '../../lib/demo-story';
import { buildPrincipleSentences, type PrincipleRow } from '../../lib/principles/facts';
import { FIXED_COPY, violatesCopyRules } from '../../lib/principles/copy';
import type { Weights } from '../../lib/constants';
import { SEED_AMOUNT } from '../../lib/constants';
import { manWon } from '../../lib/format';
import { computeCurve, type WeightHistoryItem } from '../../lib/portfolio/engine';
import { weekOfDateStr } from '../../lib/week';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

// ---------- 고정 문안 규칙 ----------
for (const [key, text] of Object.entries(FIXED_COPY)) {
  const reason = violatesCopyRules(text);
  if (reason) fail(`고정 문안 ${key}: ${reason} — "${text.slice(0, 40)}…"`);
}

// 부정형이 «정상»으로 통과하는지 (문안 12·31이 「추천」을 담고 있다)
if (violatesCopyRules('추천이 아닙니다.')) fail('「추천이 아닙니다」가 규칙에 걸림 — 부정형 처리 실패');
if (violatesCopyRules('특정 상품이나 종목을 추천하지 않습니다.')) {
  fail('「추천하지 않습니다」가 규칙에 걸림 — 부정형 처리 실패');
}
// 진짜 위반은 잡아야 한다
if (!violatesCopyRules('채권 비중을 늘리세요.')) fail('명령형을 못 잡음');
if (!violatesCopyRules('사용자님은 공격형 투자자입니다.')) fail('성향 라벨을 못 잡음');
if (!violatesCopyRules('이 배분을 추천합니다.')) fail('추천을 못 잡음');
if (!violatesCopyRules('기준선과 72% 일치합니다.')) fail('일치율을 못 잡음');
if (!violatesCopyRules('가장 최적인 배분입니다.')) fail('「최적」을 못 잡음');
if (!violatesCopyRules('목표가 10만원입니다.')) fail('목표가를 못 잡음');

// 제대로 지수 점수가 이 화면에 새지 않는가
for (const [key, text] of Object.entries(FIXED_COPY)) {
  if (/제대로 지수|100점|점수/.test(text)) fail(`고정 문안 ${key}에 지수·점수 표현이 있음`);
}

// ---------- 사실 문장 계산 ----------
// 가격 시드에서 8개 시점을 골라 데모와 같은 형태의 이력을 만든다 (결정론적)
const { dates, series } = pricesUpTo(PRICE_DATES[PRICE_DATES.length - 1]);
const step = Math.floor(dates.length / (ACTIVE_WEIGHT_STORY.length + 2));
const rows: PrincipleRow[] = ACTIVE_WEIGHT_STORY.map((w, i) => {
  const d = dates[step * (i + 1)];
  return {
    weekOf: weekOfDateStr(d),
    effectiveFrom: d,
    weights: w.weights as Weights,
    details: null,
  };
});
const currentWeek = weekOfDateStr(dates[dates.length - 1]);

const sentences = buildPrincipleSentences({ rows, currentWeek, dates, series });

if (sentences.length < 6) fail(`사실 문장 ${sentences.length}개 — 6개 이상이어야 함`);
for (const s of sentences) {
  const reason = violatesCopyRules(s.text);
  if (reason) fail(`사실 문장 ${s.id}: ${reason} — "${s.text}"`);
  if (!/[\d영한두세네다섯여섯일곱여덟아홉열]/.test(s.text)) {
    fail(`사실 문장 ${s.id}에 수량이 없음 — 계산 결과가 비었다`);
  }
  if (/NaN|Infinity|undefined|null/.test(s.text)) fail(`사실 문장 ${s.id}에 계산 실패 값: ${s.text}`);
}

const ids = sentences.map((s) => s.id);
for (const need of ['alloc', 'spread', 'decisions', 'drawdown', 'drill', 'attrib'] as const) {
  if (!ids.includes(need)) fail(`필수 문장 ${need} 없음`);
}

// 전 기간 현금이 0인 이력에서는 cash 문장이 뜨지 않는다
// ★ 전제(합계 100)를 여기서 «직접» 만든다. 예전에는 데모 스토리의 마지막 주를 빌려 썼는데,
//   그 주가 예비대를 남기도록 바뀌자 전제가 무너져 검사가 엉뚱하게 실패했다.
//   이 검사가 보는 것은 「현금 0이면 cash 문장 없음」이지 데모 서사가 아니다.
const FULLY_ALLOCATED: Weights = {
  KR_STOCK: 20,
  US_STOCK: 30,
  INTL_STOCK: 10,
  BOND: 20,
  GOLD_COMM: 15,
  REIT_INFRA: 5,
};
const fullSum = Object.values(FULLY_ALLOCATED).reduce((a, b) => a + b, 0);
if (fullSum !== 100) fail(`검사 전제 오류: FULLY_ALLOCATED 합계가 ${fullSum} (100이어야 함)`);
const fullRows = rows.map((r) => ({ ...r, weights: FULLY_ALLOCATED }));
const fullIds = buildPrincipleSentences({ rows: fullRows, currentWeek, dates, series }).map((s) => s.id);
if (fullIds.includes('cash')) fail('전 기간 현금 0인데 cash 문장이 뜸');

// 반사실 곡선이 실제로 다른 값을 내는가 — 같으면 attrib이 «항상 0원»이 된다
const single = buildPrincipleSentences({ rows: [rows[0]], currentWeek, dates, series });
if (single.some((s) => s.id === 'attrib')) fail('편성이 하나뿐인데 attrib 문장이 뜸');

// 최대 하락은 첫 하락이 아니라, 이전 최고점 대비 가장 깊은 저점을 찾아야 한다
const fixtureDates = ['2025-12-29', '2026-01-02', '2026-01-05', '2026-01-07', '2026-01-08'];
const fixtureSeries = { 'KR-IDX': [100, 120, 108, 115, 90] };
const krOnly: Weights = {
  KR_STOCK: 100,
  US_STOCK: 0,
  INTL_STOCK: 0,
  BOND: 0,
  GOLD_COMM: 0,
  REIT_INFRA: 0,
};
const fixtureBase: PrincipleRow = {
  weekOf: weekOfDateStr(fixtureDates[0]),
  effectiveFrom: fixtureDates[0],
  weights: krOnly,
  details: null,
};
const unchangedDrawdown = buildPrincipleSentences({
  rows: [fixtureBase],
  currentWeek: weekOfDateStr(fixtureDates[fixtureDates.length - 1]),
  dates: fixtureDates,
  series: fixtureSeries,
}).find((s) => s.id === 'drawdown');
if (
  unchangedDrawdown?.text !==
  '가장 큰 하락 추세에서 2,400만원이 1,800만원까지 내려갔습니다. 그 주에 배분을 바꾸지 않았습니다.'
) {
  fail(`최대 하락·미변경 문장 오류: ${unchangedDrawdown?.text ?? '없음'}`);
}

// 저점이 속한 주에 편성 행이 있으면 뒷문장이 «바꿨습니다»로 뒤집혀야 한다
const changedDrawdown = buildPrincipleSentences({
  rows: [
    fixtureBase,
    {
      weekOf: weekOfDateStr(fixtureDates[fixtureDates.length - 1]),
      effectiveFrom: fixtureDates[fixtureDates.length - 1],
      weights: krOnly,
      details: null,
    },
  ],
  currentWeek: weekOfDateStr(fixtureDates[fixtureDates.length - 1]),
  dates: fixtureDates,
  series: fixtureSeries,
}).find((s) => s.id === 'drawdown');
if (!changedDrawdown?.text.endsWith('그 주에 배분을 바꿨습니다.')) {
  fail(`저점 주 변경 문장 오류: ${changedDrawdown?.text ?? '없음'}`);
}

// 실제 이력과 첫 편성 유지 곡선의 차이를 독립 계산해 attrib 금액과 맞춘다
const history: WeightHistoryItem[] = rows.map((r) => ({
  effectiveFrom: r.effectiveFrom,
  weights: r.weights,
  details: r.details,
}));
const cashflows = { [rows[0].effectiveFrom]: SEED_AMOUNT };
const actualCurve = computeCurve(dates, series, history, cashflows);
const heldCurve = computeCurve(dates, series, [history[0]], cashflows);
const expectedDiff = Math.abs(
  (actualCurve.values[actualCurve.values.length - 1] ?? 0) -
    (heldCurve.values[heldCurve.values.length - 1] ?? 0),
);
if (expectedDiff === 0) fail('실제 이력과 첫 편성 유지 곡선이 같음 — 반사실 fixture 실패');
const attrib = sentences.find((s) => s.id === 'attrib');
if (!attrib?.text.includes(`움직인 금액은 ${manWon(expectedDiff)}입니다.`)) {
  fail(`반사실 금액 불일치: 기대 ${manWon(expectedDiff)}, 실제 ${attrib?.text ?? '없음'}`);
}

if (failed > 0) process.exit(1);
console.log(
  `고정 문안 ${Object.keys(FIXED_COPY).length}건 · 사실 문장 ${sentences.length}건 규칙 통과 (부정형 허용, 명령형·라벨·추천·일치율 차단)`,
);

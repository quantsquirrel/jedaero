// P1-30: 한 줄 회고 × 편성을 주 단위로 합친 복기 목록 + AI-9 폴백 가드
// ★ DB 없이 돈다. 합치기·차이 계산이 틀리면 화면 카드가 원인을 단정하거나 빈 주를 출석표로 그린다.
import { readFileSync } from 'node:fs';
import { replayFallback } from '../../lib/ai/replay';
import { verifyFactualOutput } from '../../lib/ai/output-guard';
import { verifyNumbersFrom } from '../../lib/ai/number-guard';
import type { Weights } from '../../lib/constants';
import { buildReplayWeeks, formatDeltaPp } from '../../lib/principles/replay';
import { FIXED_COPY, violatesCopyRules } from '../../lib/principles/copy';
import { mondayOfWeek } from '../../lib/week';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

const w = (o: Partial<Weights>): Weights =>
  ({ KR_STOCK: 0, US_STOCK: 0, INTL_STOCK: 0, BOND: 0, GOLD_COMM: 0, REIT_INFRA: 0, ...o }) as Weights;

const first = w({ KR_STOCK: 20, US_STOCK: 20, INTL_STOCK: 15, BOND: 20, GOLD_COMM: 15, REIT_INFRA: 10 });
const moved = w({ KR_STOCK: 20, US_STOCK: 25, INTL_STOCK: 15, BOND: 15, GOLD_COMM: 15, REIT_INFRA: 10 });

if (mondayOfWeek('2026-14') !== '2026-03-30') {
  fail(`ISO 2026-14 월요일이 ${mondayOfWeek('2026-14')} (기대 2026-03-30)`);
}

if (formatDeltaPp(5) !== '+5%p') fail(`+5%p 표기가 ${formatDeltaPp(5)}`);
if (formatDeltaPp(-5) !== '−5%p') fail(`−5%p 표기가 ${formatDeltaPp(-5)}`);

if (buildReplayWeeks({ allocations: [], reviews: [] }).length !== 0) {
  fail('빈 입력이 빈 목록이 아님');
}

const onlyAlloc = buildReplayWeeks({
  allocations: [
    { weekOf: '2026-10', weights: first },
    { weekOf: '2026-12', weights: moved },
  ],
  reviews: [],
});
if (onlyAlloc.map((r) => r.weekOf).join(',') !== '2026-10,2026-12') {
  fail(`편성만 있을 때 주 목록 ${onlyAlloc.map((r) => r.weekOf).join(',')}`);
}
if (onlyAlloc.some((r) => r.weekOf === '2026-11')) fail('행 없는 주가 목록에 섞임');
if (!onlyAlloc[0]?.firstConfirm) fail('첫 편성 주에 firstConfirm 이 없음');
if (onlyAlloc[0]?.deltas.length !== 0) fail('첫 편성 주에 0→비중 차이를 그림');
if (onlyAlloc[1]?.firstConfirm) fail('두 번째 확정 주에 firstConfirm');
const us = onlyAlloc[1]?.deltas.find((d) => d.code === 'US_STOCK');
const bond = onlyAlloc[1]?.deltas.find((d) => d.code === 'BOND');
if (us?.pp !== 5) fail(`미국 주식 이동 ${us?.pp} (기대 +5)`);
if (bond?.pp !== -5) fail(`채권 이동 ${bond?.pp} (기대 −5)`);
if (onlyAlloc[1]?.deltas.some((d) => d.pp === 0)) fail('안 옮긴 전선이 차이 목록에 있음');

const heldReview = buildReplayWeeks({
  allocations: [{ weekOf: '2026-10', weights: first }],
  reviews: [{ weekOf: '2026-11', body: '이번 주는 손을 대지 않았다' }],
});
if (heldReview.length !== 2) fail(`회고만 있는 유지 주가 빠짐: ${heldReview.length}`);
const held = heldReview.find((r) => r.weekOf === '2026-11');
if (!held?.held) fail('확정 행 없는 회고 주가 held 가 아님');
if (held?.review !== '이번 주는 손을 대지 않았다') fail('회고 원문이 카드에 없음');
if (held?.weights.US_STOCK !== 20) fail('유지 주에 직전 비중을 붙이지 않음');
if (held?.confirmedThisWeek) fail('유지 주를 확정 주로 표시');

const paired = buildReplayWeeks({
  allocations: [
    { weekOf: '2026-10', weights: first },
    { weekOf: '2026-11', weights: moved },
  ],
  reviews: [{ weekOf: '2026-11', body: '미국 쪽으로 한 칸 옮겼다' }],
});
const pair = paired.find((r) => r.weekOf === '2026-11');
if (!pair?.review || pair.deltas.length === 0) fail('같은 주 회고와 변경이 한 카드로 안 붙음');
if (pair.held || pair.firstConfirm) fail('변경+회고 주를 held/first 로 표시');

const aiInput = {
  한줄_남긴_주: 3,
  그중_편성을_바꾼_주: 2,
  그대로_둔_주: 1,
};
const fb = replayFallback(aiInput);
const whole = `${fb.text} ${fb.question}`;
const factual = verifyFactualOutput(whole);
if (!factual.ok) fail(`AI-9 폴백이 output-guard에 걸림 (${factual.reason}): ${whole}`);
const nums = verifyNumbersFrom(whole, aiInput);
if (!nums.ok) fail(`AI-9 폴백이 number-guard에 걸림 (${nums.reason} ${nums.value}): ${whole}`);
if (!/\?$/.test(fb.question.trim())) fail(`질문이 물음표로 끝나지 않음: ${fb.question}`);
if (!whole.includes('사용자님')) fail(`호칭 「사용자님」 없음: ${whole}`);

for (const key of ['replayTitle', 'replayLead', 'replayHeld', 'replayFirst', 'replayAiTitle', 'replayNotInImage'] as const) {
  const reason = violatesCopyRules(FIXED_COPY[key] ?? '');
  if (reason) fail(`고정 문안 ${key}: ${reason} — "${FIXED_COPY[key]}"`);
  if (!FIXED_COPY[key]) fail(`고정 문안 ${key} 없음`);
}

const src = readFileSync('lib/ai/replay.ts', 'utf8');
for (const banned of ['필요합니다', '고려', '좋습니다', '권장']) {
  const lines = src.split('\n').filter((l) => l.includes(banned) && !l.includes('금지'));
  if (lines.length > 0) fail(`AI-9 프롬프트/폴백에 금지 어휘 「${banned}」: ${lines[0].trim().slice(0, 60)}`);
}

if (failed > 0) process.exit(1);
console.log('주 단위 합치기 · 같은 주 묶음 · 빈 주 제외 · AI-9 폴백 가드 통과');

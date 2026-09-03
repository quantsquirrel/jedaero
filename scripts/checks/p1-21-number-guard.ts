// P1-21: LLM 출력 «숫자» 검증 — 지어낸 수치 폐기 / 평일 가중 손익 폐기 / 규칙 폴백 오탐 0건
// 어휘 가드(P1-16)의 짝이다. 프롬프트가 "주어진 숫자만 쓴다"고 적는 것과, 코드가 그것을 강제하는 것은 다르다.
import {
  briefingInput,
  briefingFallback,
  weekdayBriefingInput,
  weekdayBriefingFallback,
} from '../../lib/ai/briefing';
import { extractNumbers, verifyNumbers, verifyNumbersFrom } from '../../lib/ai/number-guard';
import { reflectionFallback } from '../../lib/ai/reflect';
import { THEMES } from '../../lib/constants';
import type { MarketWeek } from '../../lib/market-week';
import type { ReviewFacts } from '../../lib/review-context';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

// ---- 고정 입력 ----------------------------------------------------------
// 국내 +2.4 / 미국 -1.2 / 기타해외 +0.8 / 채권 +0.3 / 금 -2.6 / 리츠 +1.1
const CHANGES = [0.024, -0.012, 0.008, 0.003, -0.026, 0.011];
const WEIGHTS = [40, 20, 10, 15, 5, 10];
const moves = THEMES.map((t, i) => ({
  code: t.code,
  name: t.name,
  changePct: CHANGES[i],
  myWeight: WEIGHTS[i],
  contributionPct: CHANGES[i] * (WEIGHTS[i] / 100),
}));
const weightedPct = moves.reduce((s, m) => s + m.contributionPct, 0); // = +0.0107 → 1.1%
const week: MarketWeek = {
  fromDate: '2026-08-31',
  toDate: '2026-09-04',
  tradingDays: 5,
  moves,
  best: moves[0],
  worst: moves[4],
  weightedPct,
};
const facts: ReviewFacts = {
  weekOf: '2026-36',
  changedThisWeek: true,
  turnoverPp: 7.5,
  weeksUnchanged: 3,
  reservePct: 10,
};

const wdIn = weekdayBriefingInput(week);
const weIn = briefingInput(week);
const wpct = Number((weightedPct * 100).toFixed(1));

// ---- ① 지어낸 숫자는 폐기된다 -------------------------------------------
const INVENTED = [
  '국내 주식이 12.4% 올랐습니다.', // 입력에 없는 수치
  '최근 3개월 누적은 18.7%였습니다.', // 주지 않은 구간
  '평가액은 24,300,000원이 되었습니다.', // 금액을 지어냄
  '여섯 전선 중 4개가 87% 확률로 움직였습니다.', // 확률·통계 날조
];
for (const t of INVENTED) {
  const v = verifyNumbersFrom(t, wdIn);
  if (v.ok) fail(`지어낸 숫자가 통과함: "${t}"`);
  else if (v.reason !== 'invented') fail(`사유가 invented가 아님(${v.reason}): "${t}"`);
}

// ---- ② 평일 입력에 «비중»이 없으므로 손익 문장은 만들 수 없다 ------------
// 1차 방어선은 가드가 아니라 «재료를 주지 않는 것»이다. 비중을 말하면 지어낸 수치가 된다.
const weightLeak = '국내 주식에 40% 비중이 있었습니다.';
const wlv = verifyNumbersFrom(weightLeak, wdIn);
if (wlv.ok) fail('평일 출력이 내 비중(40%)을 말했는데 통과함 — 평일 입력에서 비중이 빠지지 않았다');
else if (wlv.reason !== 'invented') fail(`평일 비중 누출 사유가 invented가 아님(${wlv.reason})`);
// 같은 문장이 주말에는 정상이어야 한다 (주말 입력에는 비중과 가중 등락이 들어 있다)
if (!verifyNumbersFrom(weightLeak, weIn).ok) fail('주말 브리핑에서 비중 언급이 폐기됨');
if (!verifyNumbersFrom(`내 편성 기준 ${wpct}%였습니다.`, weIn).ok) {
  fail('주말 브리핑에서 가중 손익이 폐기됨 — 주말은 손익을 보는 날이다');
}

// ---- ②-b forbidden 원시 기능 (2차 방어선) --------------------------------
// 재료를 주면서도 특정 값만 막아야 하는 자리를 위해 남겨 둔다. 반올림 관용은 적용되지 않는다.
const banned = verifyNumbers('구간 수익률은 1.7%였습니다.', [2.4, 1.2, 1.7], [1.7]);
if (banned.ok || banned.reason !== 'forbidden') fail(`forbidden이 작동하지 않음: ${JSON.stringify(banned)}`);
const nearMiss = verifyNumbers('채권은 1.4% 올랐습니다.', [1.4], [1.7]);
if (!nearMiss.ok) fail('금지값에 반올림 관용이 적용됨 — 1.4가 1.7 때문에 폐기되면 안 된다');

// ---- ③ 규칙 기반 폴백은 전부 통과해야 한다 (오탐 0건) --------------------
// 여기서 걸리면 가드가 너무 빡빡한 것이다. AI가 죽고 폴백만 남는 상태가 된다.
const wdFb = weekdayBriefingFallback(week);
const wdText = [wdFb.summary, ...wdFb.questions].join(' ');
const wdV = verifyNumbersFrom(wdText, wdIn);
if (!wdV.ok) fail(`평일 폴백이 숫자 가드에 걸림 (${wdV.reason} ${wdV.value}): ${wdText}`);

const weFb = briefingFallback(week);
const weText = [weFb.summary, ...weFb.questions].join(' ');
const weV = verifyNumbersFrom(weText, weIn);
if (!weV.ok) fail(`주말 폴백이 숫자 가드에 걸림 (${weV.reason} ${weV.value}): ${weText}`);

const rfIn = {
  이번주_회고_원문: '3주 연속 그대로 뒀다',
  이번주에_비중을_바꿨나: facts.changedThisWeek,
  바꾼폭_퍼센트포인트: Number(facts.turnoverPp.toFixed(1)),
  마지막_조정_이후_지난_주수: facts.weeksUnchanged,
  어느_전선에도_놓지_않은_몫_퍼센트: facts.reservePct,
};
for (const f of [
  facts,
  { ...facts, changedThisWeek: false },
  { ...facts, changedThisWeek: false, weeksUnchanged: 0, reservePct: 25 },
  { ...facts, changedThisWeek: false, weeksUnchanged: 0, reservePct: 0 },
]) {
  const r = reflectionFallback(f);
  const text = `${r.acknowledgement} ${r.question}`;
  const v = verifyNumbersFrom(text, { ...rfIn, ...f });
  if (!v.ok) fail(`회고 폴백이 숫자 가드에 걸림 (${v.reason} ${v.value}): ${text}`);
}

// ---- ④ 정상적인 LLM 문장은 통과한다 -------------------------------------
const LEGIT = [
  '2026-08-31부터 2026-09-04까지 영업일 5일 구간입니다. 국내 주식이 2.4% 올랐고 금·원자재가 2.6% 내렸습니다.',
  '국내 주식은 약 2% 움직였습니다.', // 2.4 → "약 2%" 반올림 표기
  '가장 크게 움직인 전선은 금·원자재였습니다.', // 숫자 없음
  '채권은 0.3% 올랐고 리츠·인프라는 1.1% 올랐습니다.',
];
for (const t of LEGIT) {
  const v = verifyNumbersFrom(t, wdIn);
  if (!v.ok) fail(`정상 문장이 폐기됨 (${v.reason} ${v.value}): "${t}"`);
}

// ---- ⑤ 숫자 추출 자체 ---------------------------------------------------
const ex = extractNumbers('평가액 24,300,000원 · 등락 -2.6% · 5일');
if (ex.length !== 3 || ex[0] !== 24300000 || ex[1] !== 2.6 || ex[2] !== 5) {
  fail(`숫자 추출 실패: ${JSON.stringify(ex)} — 콤마·부호·소수를 처리해야 함`);
}

if (failed > 0) process.exit(1);
console.log(
  `지어낸 숫자 ${INVENTED.length}건 폐기 · 평일 입력에 비중 없음(40% 언급 폐기)·주말은 허용 · forbidden 원시기능 통과 · 폴백 6종 오탐 0 · 정상 ${LEGIT.length}건 통과`,
);

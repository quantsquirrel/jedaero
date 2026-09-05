// P1-27: AI-8 폴백이 두 가드를 통과하는가
// ★ 폴백이 가드에 걸리면 킬스위치를 내렸을 때 화면이 빈다. 그것이 가장 조용한 실패다.
// ★ output-guard의 ADVICE_PATTERN은 「필요합니다」·「고려」·「좋습니다」도 폐기한다.
//   설계 문서 §5의 예시 문안이 「필요합니다」였고, 그대로 쓰면 AI 출력이 매번 버려진다.
import { readFileSync } from 'node:fs';
import { buildPrinciplesInput, principlesFallback } from '../../lib/ai/principles';
import { verifyFactualOutput } from '../../lib/ai/output-guard';
import { verifyNumbersFrom } from '../../lib/ai/number-guard';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

const CASES = [
  { equity: 60, bond: 20, cash: 20 },
  { equity: 90, bond: 10, cash: 0 },
  { equity: 0, bond: 0, cash: 100 },
  { equity: 55, bond: 30, cash: 15 },
];

for (const mix of CASES) {
  const input = buildPrinciplesInput(mix);
  const fb = principlesFallback(input);
  const whole = `${fb.text} ${fb.question}`;

  const factual = verifyFactualOutput(whole);
  if (!factual.ok) fail(`폴백이 output-guard에 걸림 (${factual.reason}) — mix=${JSON.stringify(mix)}: ${whole}`);

  const nums = verifyNumbersFrom(whole, input);
  if (!nums.ok) fail(`폴백이 number-guard에 걸림 (${nums.reason} ${nums.value}) — ${whole}`);

  if (!/\?$/.test(fb.question.trim())) fail(`질문이 물음표로 끝나지 않음: ${fb.question}`);
  if (whole.length > 400) fail(`폴백이 너무 김 (${whole.length}자)`);
  if (!whole.includes('사용자님')) fail(`호칭 「사용자님」 없음: ${whole}`);
}

// 프롬프트에 금지 어휘가 남아 있지 않은가 — 있으면 출력이 매번 폐기된다
const src = readFileSync('lib/ai/principles.ts', 'utf8');
for (const banned of ['필요합니다', '고려', '좋습니다', '권장']) {
  // 금지 목록을 «나열하는» 줄은 제외하고, 프롬프트 본문에 섞였는지만 본다
  const lines = src.split('\n').filter((l) => l.includes(banned) && !l.includes('금지'));
  if (lines.length > 0) fail(`프롬프트/폴백에 금지 어휘 「${banned}」: ${lines[0].trim().slice(0, 60)}`);
}

if (failed > 0) process.exit(1);
console.log(`AI-8 폴백 ${CASES.length}케이스가 output-guard·number-guard 통과 (금지 어휘 0건)`);

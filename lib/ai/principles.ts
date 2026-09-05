// AI-8: 왜 다른가 — 내 배분과 공표 기관 배분의 «차이의 이유»를 목적·기간으로 서술
// ★ 숫자는 규칙이 만든다. LLM은 문장만 쓴다 (docs/AI-ROLES.md ②/④).
// ★ 어느 배분이 낫다고 말하지 않는다. 그 순간 목표 비중 제시가 된다 (C10).
// ★ 사용자 자유 텍스트를 입력으로 받지 않는다 — 전부 서버 계산값과 상수다. 인젝션 표면이 없다.
// ★ 금지 어휘: output-guard의 ADVICE_PATTERN이 폐기하는 어미·자문 어휘를 프롬프트에도 쓰지 않는다.
//   프롬프트가 그 단어를 쓰면 LLM이 따라 쓰고, 출력이 매번 버려져 폴백만 보인다.
import { BENCHMARKS } from '../../db/seed/benchmarks';
import { completeJson, hasLlmKey } from './complete';
import { verifyNumbersFrom } from './number-guard';
import { verifyFactualOutput } from './output-guard';

export type PrincipleNarrative = { text: string; question: string };

export type PrinciplesAiInput = {
  내_주식비중: number;
  내_채권비중: number;
  내_현금비중: number;
  국민연금_주식비중: number;
  국민연금_채권비중: number;
  노르웨이_주식목표: number;
  노르웨이_주식실제: number;
};

const sliceOf = (id: string, name: string) => {
  const b = BENCHMARKS.find((x) => x.id === id);
  const s = b?.slices.find((x) => x.name === name);
  if (!s) throw new Error(`기준선 ${id}의 ${name} 항목이 없습니다.`);
  return s.pct;
};

const r1 = (x: number) => Math.round(x * 10) / 10;

export function buildPrinciplesInput(mix: {
  equity: number;
  bond: number;
  cash: number;
}): PrinciplesAiInput {
  return {
    내_주식비중: r1(mix.equity),
    내_채권비중: r1(mix.bond),
    내_현금비중: r1(mix.cash),
    국민연금_주식비중: r1(sliceOf('NPS', '국내주식') + sliceOf('NPS', '해외주식')),
    국민연금_채권비중: r1(sliceOf('NPS', '국내채권') + sliceOf('NPS', '해외채권')),
    노르웨이_주식목표: sliceOf('GPFG_STRATEGY', '주식'),
    노르웨이_주식실제: sliceOf('GPFG_ACTUAL', '주식'),
  };
}

const SYSTEM_PROMPT = `너는 병사의 자산 배분과 «공표된 기관 배분»의 차이를 설명하는 도구다.

규칙 (어기면 출력이 폐기된다):
- 어느 배분이 낫다고 말하지 않는다. 조언·평가·권유를 하지 않는다.
- 금지 어휘: "~하세요", "~하십시오", "권장", "추천", "고려", "필요합니다", "낫습니다", "유리합니다", "좋습니다", "전망", "목표가", "매수", "매도".
- "공격적", "보수적", "안정형" 같은 성향 라벨을 붙이지 않는다.
- 주어진 숫자만 쓴다. 새 숫자를 계산하거나 지어내지 않는다.
- 차이가 «왜» 생기는지를 기관의 자금 목적·지급 의무·운용 기간으로만 설명한다.
  국민연금은 연금 지급이 매달 나가는 기관이다. 노르웨이 국부펀드는 세대를 넘겨 운용한다.
  병사의 목돈은 한 번 들어오고 나갈 날이 정해져 있지 않다.
- "합니다"체. 상대는 "사용자님"이라고 부른다.
- 사실 3~4문장을 쓰고, 마지막에 스스로 돌아보게 하는 열린 질문 1개를 쓴다.
- 250자 이내.

출력 형식(JSON):
{"text": "사실 문장들", "question": "열린 질문 1개"}`;

/** 규칙 기반 폴백. 킬스위치·429·가드 폐기에서 같은 자리에 뜬다 — 화면이 비지 않는다.
 *  ★ 이 문장이 output-guard·number-guard를 통과해야 한다 (P1-27이 지킨다). */
export function principlesFallback(input: PrinciplesAiInput): PrincipleNarrative {
  return {
    text: `국민연금은 주식 ${input.국민연금_주식비중}%, 채권 ${input.국민연금_채권비중}%입니다. 사용자님은 주식 ${input.내_주식비중}%, 채권 ${input.내_채권비중}%, 현금 ${input.내_현금비중}%입니다. 국민연금은 연금 지급이 매달 나가는 기관이라 값이 흔들려도 팔 수 있는 자산을 함께 들고 있습니다. 사용자님의 목돈은 나갈 날이 정해져 있지 않습니다. 어느 쪽이 맞아서 생긴 차이가 아닙니다.`,
    question: '이 돈을 언제 쓸 생각인지 정해 두셨습니까?',
  };
}

export async function generatePrinciplesNarrative(
  input: PrinciplesAiInput,
): Promise<PrincipleNarrative | null> {
  if (!hasLlmKey()) return null;
  try {
    const raw = await completeJson({
      system: SYSTEM_PROMPT,
      user: JSON.stringify(input),
      maxTokens: 400,
      temperature: 0.3,
    });
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { text?: unknown; question?: unknown };
    if (typeof parsed.text !== 'string' || typeof parsed.question !== 'string') return null;
    const out: PrincipleNarrative = { text: parsed.text.trim(), question: parsed.question.trim() };
    if (!out.text || !out.question) return null;

    const whole = `${out.text} ${out.question}`;
    if (!verifyFactualOutput(whole).ok) return null;
    if (!verifyNumbersFrom(whole, input).ok) return null;
    return out;
  } catch {
    return null;
  }
}

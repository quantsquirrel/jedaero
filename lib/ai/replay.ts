// AI-9: 복기 — 여러 주 회고와 편성을 사실로 되짚고 질문 하나.
// ★ 숫자는 규칙이 만든다. LLM은 문장만 쓴다.
// ★ 회고가 결정을 이끌었다고 쓰지 않는다. 같은 주에 둘을 둔 사실만 말한다.
// ★ 성향 라벨·조언·전망은 output-guard가 폐기한다.
import { completeJson, hasLlmKey } from './complete';
import { verifyNumbersFrom } from './number-guard';
import { verifyFactualOutput } from './output-guard';

export type ReplayNarrative = { text: string; question: string };

export type ReplayAiInput = {
  한줄_남긴_주: number;
  그중_편성을_바꾼_주: number;
  그대로_둔_주: number;
  같은주_묶음?: { 주: string; 이동: string; 한줄: string }[];
};

const SYSTEM_PROMPT = `너는 병사가 복무 중에 남긴 한 줄과 그 주 편성을 함께 되짚는 도구다.

규칙 (어기면 출력이 폐기된다):
- 조언·평가·칭찬·훈계를 하지 않는다. "잘하셨어요", "~하세요", "권장", "추천", "고려", "필요합니다", "낫습니다", "유리합니다", "좋습니다" 전부 금지.
- 성향 라벨("공격적", "보수적", "안정형")을 붙이지 않는다. 전망·목표가·매수를 말하지 않는다.
- 한 줄이 편성을 만들었다고 쓰지 않는다. 같은 주에 둘을 두었다는 사실만 말한다.
- 주어진 숫자만 쓴다. 새 숫자를 계산하거나 지어내지 않는다.
- 필드 이름을 문장에 그대로 적지 않는다.
- "합니다"체. 상대는 "사용자님"이라고 부른다.
- 사실 2~4문장을 쓰고, 마지막에 스스로 돌아보게 하는 열린 질문 1개를 쓴다.
- 250자 이내.

출력 형식(JSON):
{"text": "사실 문장들", "question": "열린 질문 1개"}`;

export function replayFallback(input: ReplayAiInput): ReplayNarrative {
  return {
    text: `사용자님은 한 줄을 ${input.한줄_남긴_주}주에 남겼습니다. 그중 ${input.그중_편성을_바꾼_주}주는 편성을 바꾼 주이고, ${input.그대로_둔_주}주는 그대로 둔 주입니다. 같은 주에 둔 말과 편성을 함께 볼 수 있습니다. 어느 쪽이 원인이라고 적지 않습니다.`,
    question: '그때 쓴 말과 그때 둔 편성을 같이 보면, 무엇이 같습니까?',
  };
}

export function buildReplayAiInput(
  weeks: { weekOf: string; monday: string; review: string | null; confirmedThisWeek: boolean; held: boolean; deltas: { name: string; pp: number }[] }[],
): ReplayAiInput {
  const withReview = weeks.filter((w) => w.review);
  const changedWithReview = withReview.filter((w) => w.confirmedThisWeek && !w.held);
  const heldWithReview = withReview.filter((w) => w.held);
  return {
    한줄_남긴_주: withReview.length,
    그중_편성을_바꾼_주: changedWithReview.length,
    그대로_둔_주: heldWithReview.length,
    같은주_묶음: withReview.slice(0, 12).map((w) => ({
      주: w.monday || w.weekOf,
      이동: w.deltas.map((d) => `${d.name} ${d.pp >= 0 ? '+' : '−'}${Math.abs(d.pp)}%p`).join(' · ') || '그대로',
      한줄: w.review ?? '',
    })),
  };
}

export async function generateReplayNarrative(input: ReplayAiInput): Promise<ReplayNarrative | null> {
  if (!hasLlmKey()) return null;
  try {
    const payload = {
      한줄_남긴_주: input.한줄_남긴_주,
      그중_편성을_바꾼_주: input.그중_편성을_바꾼_주,
      그대로_둔_주: input.그대로_둔_주,
      같은주_묶음: input.같은주_묶음 ?? [],
    };
    const raw = await completeJson({
      system: SYSTEM_PROMPT,
      user: JSON.stringify(payload),
      maxTokens: 400,
      temperature: 0.3,
    });
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { text?: unknown; question?: unknown };
    if (typeof parsed.text !== 'string' || typeof parsed.question !== 'string') return null;
    const out: ReplayNarrative = { text: parsed.text.trim(), question: parsed.question.trim() };
    if (!out.text || !out.question) return null;
    const whole = `${out.text} ${out.question}`;
    if (!verifyFactualOutput(whole).ok) return null;
    if (!verifyNumbersFrom(whole, payload).ok) return null;
    return out;
  } catch {
    return null;
  }
}

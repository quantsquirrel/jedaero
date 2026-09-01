// AI-4: 주간 브리핑 (SPEC §4)
// - 입력은 lib/market-week.ts가 규칙 기반으로 계산한 숫자다. LLM은 숫자를 만들지 않는다.
// - 출력은 사실 요약 + "스스로 던져볼 질문 3개". 전망·추천·목표가는 출력 검증에서 폐기된다 (C10).
// - 뉴스 본문을 넣지 않는다. 시드 가격은 합성 데이터이며 실제 시세·실제 기사와 무관하다.
import OpenAI from 'openai';
import type { MarketWeek } from '../market-week';
import { verifyFactualOutput } from './output-guard';

export type Briefing = {
  summary: string; // 2~3문장 사실 요약
  questions: [string, string, string]; // 스스로 던져볼 질문 3개
};

const SYSTEM_PROMPT = `너는 병사의 모의 포트폴리오 주간 브리핑을 쓰는 도구다.
데이터는 교육용 합성 시세이며 실제 시장과 무관하다 — 실제 시장을 언급하지 마라.

규칙 (어기면 출력이 폐기된다):
- 주어진 숫자만 쓴다. 숫자를 새로 만들거나 반올림 외의 가공을 하지 않는다.
- 전망·예측·추천·목표가·매수/매도 판단을 절대 하지 않는다.
  "오를", "하락할", "유망", "매수", "전망", "추천", "고려" 같은 말을 쓰지 마라.
- "공격적", "보수적" 같은 성향 라벨을 붙이지 않는다.
- "~하세요", "~해야", "권장" 같은 권유형 문장을 쓰지 않는다.
- summary: 이번 구간에 무엇이 얼마나 움직였고 그게 내 비중과 어떻게 만났는지를
  과거형 사실 문장 2~3개로 쓴다. 120자 이내.
- questions: 사용자가 주말에 스스로 던져볼 질문 3개. 각 40자 이내.
  답을 주지 말고 질문만 한다. 질문도 특정 종목·축을 사라/팔라는 방향으로 유도하지 않는다.
- 한국어 존댓말. 반드시 JSON만 출력한다.`;

const RESPONSE_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'weekly_briefing',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        questions: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
      },
      required: ['summary', 'questions'],
      additionalProperties: false,
    },
  },
};

const r1 = (x: number) => Number((x * 100).toFixed(1));

/** 브리핑 생성. 실패·검증 위반 시 null → 호출부가 규칙 기반 요약으로 폴백한다. */
export async function generateBriefing(week: MarketWeek): Promise<Briefing | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const client = new OpenAI();
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            구간: `${week.fromDate} ~ ${week.toDate} (영업일 ${week.tradingDays}일)`,
            축별등락퍼센트: Object.fromEntries(week.moves.map((m) => [m.name, r1(m.changePct)])),
            내비중퍼센트: Object.fromEntries(week.moves.map((m) => [m.name, m.myWeight])),
            내비중가중등락퍼센트: r1(week.weightedPct),
            가장오른축: week.best.name,
            가장내린축: week.worst.name,
          }),
        },
      ],
      response_format: RESPONSE_SCHEMA,
      max_tokens: 400,
      temperature: 0.3,
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Briefing;
    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.questions)) return null;
    if (parsed.questions.length !== 3) return null;

    // 출력 검증 — summary와 질문 3개를 한 덩어리로 본다. 하나라도 걸리면 전부 폐기한다.
    if (!verifyFactualOutput([parsed.summary, ...parsed.questions].join(' ')).ok) return null;
    return parsed;
  } catch {
    // 에러 상세를 사용자에게 흘리지 않는다 (스택트레이스 금지)
    return null;
  }
}

/** 규칙 기반 폴백 요약 — 키가 없어도, 429여도, 킬스위치가 내려가도 이 문장은 뜬다.
 *  생성형 AI가 아니므로 UI에서 고지 배지를 붙이지 않고 "규칙 기반"으로 구분 표기한다 (C9). */
export function briefingFallback(week: MarketWeek): Briefing {
  const s = (x: number) => `${x >= 0 ? '+' : ''}${r1(x)}%`;
  return {
    summary:
      `${week.fromDate}부터 ${week.toDate}까지 영업일 ${week.tradingDays}일 구간입니다. ` +
      `가장 많이 오른 축은 ${week.best.name} ${s(week.best.changePct)}, ` +
      `가장 많이 내린 축은 ${week.worst.name} ${s(week.worst.changePct)}였습니다. ` +
      `내 비중으로 가중하면 ${s(week.weightedPct)}입니다.`,
    questions: [
      '가장 많이 움직인 축에 내 비중은 얼마였나요?',
      '이 등락은 내가 배분을 정할 때 예상했던 범위 안인가요?',
      '이번 주에 아무것도 바꾸지 않는다면 그 이유는 무엇인가요?',
    ],
  };
}

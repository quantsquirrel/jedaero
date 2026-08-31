// AI-1: 지출 3계층 분류 제안 (SPEC §4)
// - 서버에서만 호출한다. 클라이언트 번들에 절대 포함 금지.
// - 확정 주체는 항상 사용자. 신뢰도 < 0.7이면 분류하지 않고 묻는다 (오분류 비용 > 미분류 비용).
import OpenAI from 'openai';
import { db } from '../../db';
import { aiCalls } from '../../db/schema';

export type Tier = 'A' | 'B' | 'C';
export type ClassifyResult = {
  tier: Tier;
  confidence: number; // 0~1
  candidates: [Tier, Tier]; // 가능성 순 상위 2개
};

const SYSTEM_PROMPT = `너는 병사의 지출을 3계층으로 분류하는 보조 도구다.
분류 축은 "필수 vs 사치"(가치판단)가 아니라 "통제 가능 vs 불가"(관찰 가능)다.

A. 구조적 지출 — 출신·신체 조건으로 결정되어 본인이 통제할 수 없다.
   예: 휴가·외박 교통비(기차·버스), 의료비, 안경·렌즈, 처방약
B. 계획 지출 — 발생은 예측 가능하고 금액은 선택이다.
   예: 외박 식비, 통신비, 생필품, 이발, 화장품, 자기계발(책·강의)
C. 재량 지출 — 전적으로 선택이다.
   예: PX 간식, 담배, 배달 음식, 게임 결제, 선물

규칙:
- 반드시 JSON만 출력한다.
- confidence는 확신 정도(0~1). 메모가 모호하면(예: "모임", "이것저것") 0.7 미만으로 낮게.
- candidates는 가능성이 높은 순서의 상위 2개 계층.
- 사용자를 평가하거나 조언하지 않는다. 분류만 한다.`;

const RESPONSE_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'expense_classification',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['A', 'B', 'C'] },
        confidence: { type: 'number' },
        candidates: {
          type: 'array',
          items: { type: 'string', enum: ['A', 'B', 'C'] },
          minItems: 2,
          maxItems: 2,
        },
      },
      required: ['tier', 'confidence', 'candidates'],
      additionalProperties: false,
    },
  },
};

/** 분류 제안. 실패 시 null (지출은 미분류로 남고 사용자가 직접 고른다) */
export async function classifyExpense(input: {
  userId: string;
  amount: number;
  memo: string;
  occurredOn: string;
}): Promise<ClassifyResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const client = new OpenAI();
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `금액 ${input.amount.toLocaleString('ko-KR')}원 / 메모 "${input.memo}" / 날짜 ${input.occurredOn}`,
        },
      ],
      response_format: RESPONSE_SCHEMA,
      max_tokens: 100,
      temperature: 0,
    });
    await db.insert(aiCalls).values({ userId: input.userId, kind: 'AI-1' });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClassifyResult;
    if (!['A', 'B', 'C'].includes(parsed.tier)) return null;
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
    return parsed;
  } catch {
    // 에러 상세를 사용자에게 흘리지 않는다 (스택트레이스 금지)
    return null;
  }
}

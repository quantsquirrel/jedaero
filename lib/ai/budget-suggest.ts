// AI-2: 봉투 예산 제안 (SPEC §4)
// ★ 확정 주체는 사용자다 (C8). 제안은 입력칸을 채워줄 뿐, 저장은 사용자가 [확정] 을 눌러야 일어난다.
// 입력은 lib/budget-history.ts가 규칙 기반으로 집계한 과거 3개월 숫자다.
import OpenAI from 'openai';
import { BUDGET_CATEGORIES } from '../budget';
import type { CategoryHistory } from '../budget-plan';
import { verifyFactualOutput } from './output-guard';

export type BudgetSuggestion = {
  entries: { category: string; allocated: number; reason: string }[];
  note: string;
};

const SYSTEM_PROMPT = `너는 병사의 다음 달 예산 봉투 배정액을 "제안"하는 보조 도구다.
확정은 항상 사용자가 한다. 너는 입력칸을 채워줄 뿐이다.

봉투는 B(계획 지출)의 도구다 — 발생은 예측 가능하고 금액은 선택인 지출.
A(교통비·의료비 등 구조적 지출)와 C(재량 지출)는 봉투 대상이 아니다.

규칙 (어기면 출력이 폐기된다):
- 배정액은 주어진 과거 3개월 숫자에 근거해야 한다. 근거 없는 금액을 만들지 않는다.
- 1,000원 단위 정수로 낸다. 총합이 월 봉급을 넘지 않는다.
- 절약을 권하거나 지출을 평가하지 않는다. "줄이세요", "아끼세요", "과하다" 전부 금지.
  이 서비스의 지표는 절약량이 아니라 예측 정확도다 — 맞히는 것이 목표지 적게 쓰는 것이 목표가 아니다.
- 담배·간식 같은 항목에 건강·도덕 관련 언급을 하지 않는다.
- reason: 왜 그 금액인지 과거 숫자로 설명하는 한 구절. 30자 이내.
- note: 이 제안을 어떻게 읽어야 하는지 한 문장. 60자 이내. 권유형 어미를 쓰지 않는다.
- 과거 지출이 0인 카테고리는 목록에서 빼라. 억지로 배정하지 않는다.
- 한국어. 반드시 JSON만 출력한다.`;

const RESPONSE_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'budget_suggestion',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: [...BUDGET_CATEGORIES] },
              allocated: { type: 'integer' },
              reason: { type: 'string' },
            },
            required: ['category', 'allocated', 'reason'],
            additionalProperties: false,
          },
        },
        note: { type: 'string' },
      },
      required: ['entries', 'note'],
      additionalProperties: false,
    },
  },
};

export async function suggestBudget(
  history: CategoryHistory[],
  salary: number,
  yearMonth: string,
): Promise<BudgetSuggestion | null> {
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
            배정할달: yearMonth,
            월봉급: salary,
            과거3개월_카테고리별_B실지출: history.map((h) => ({
              카테고리: h.category,
              월별: h.monthly,
              중앙값: h.median,
              최대: h.max,
              건수: h.count,
            })),
          }),
        },
      ],
      response_format: RESPONSE_SCHEMA,
      max_tokens: 600,
      temperature: 0.2,
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BudgetSuggestion;
    if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) return null;

    // 구조 검증 — 금액은 서버가 다시 본다. LLM이 낸 숫자를 그대로 믿지 않는다.
    const seen = new Set<string>();
    for (const e of parsed.entries) {
      if (!BUDGET_CATEGORIES.includes(e.category as (typeof BUDGET_CATEGORIES)[number])) return null;
      if (seen.has(e.category)) return null;
      seen.add(e.category);
      if (!Number.isInteger(e.allocated) || e.allocated <= 0 || e.allocated > 10_000_000) return null;
    }
    if (parsed.entries.reduce((s, e) => s + e.allocated, 0) > salary) return null;
    if (!verifyFactualOutput([parsed.note, ...parsed.entries.map((e) => e.reason)].join(' ')).ok) return null;
    return parsed;
  } catch {
    return null;
  }
}

// AI-5 2차 가드 — 정규식을 통과한 의심 케이스만 LLM으로 정밀 판정 (SPEC §4 AI-5)
// 실패 시 null → 호출부는 차단하지 않는다 (1차 정규식이 핵심 방어선, LLM은 보조)
import OpenAI from 'openai';

export async function llmUnitGuard(name: string): Promise<{ blocked: boolean } | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const client = new OpenAI();
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '입력된 그룹 이름이 대한민국 군의 특정 부대(편제 단위·주둔지·부대 번호 등)를 식별하거나 추정하게 하는지 판정한다. JSON만 출력: {"blocked": true|false}. 확실하지 않으면 false.',
        },
        { role: 'user', content: name.slice(0, 40) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'unit_guard',
          strict: true,
          schema: {
            type: 'object',
            properties: { blocked: { type: 'boolean' } },
            required: ['blocked'],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 20,
      temperature: 0,
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    return JSON.parse(raw) as { blocked: boolean };
  } catch {
    return null;
  }
}

// LLM 한 곳. Anthropic을 우선하고, 없으면 OpenAI. 키 없으면 null → 호출부가 규칙 폴백.
// 클라이언트에서 import하지 말 것. 키는 서버 환경변수에만 둔다.

export function hasLlmKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return (m ? m[1] : t).trim();
}

async function completeAnthropic(system: string, user: string, maxTokens: number, temperature: number): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text;
  return text ? stripFence(text) : null;
}

async function completeOpenAi(system: string, user: string, maxTokens: number, temperature: number): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: key });
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
    temperature,
  });
  const raw = res.choices[0]?.message?.content;
  return raw ? stripFence(raw) : null;
}

/** JSON 객체 문자열을 돌려준다. 실패·키 없음은 null. */
export async function completeJson(args: {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
}): Promise<string | null> {
  const temperature = args.temperature ?? 0.3;
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      return await completeAnthropic(args.system, args.user, args.maxTokens, temperature);
    }
    if (process.env.OPENAI_API_KEY) {
      return await completeOpenAi(args.system, args.user, args.maxTokens, temperature);
    }
    return null;
  } catch {
    return null;
  }
}

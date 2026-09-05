// LLM 한 곳. Anthropic을 우선하고, 없으면 OpenAI. 키 없으면 null → 호출부가 규칙 폴백.
// 클라이언트에서 import하지 말 것. 키는 서버 환경변수에만 둔다.
//
// ★ 모델을 haiku-4-5 로 두는 것은 비용 때문만이 아니다. 같은 프롬프트·같은 가드로 재 봤을 때
//   (각 6회) 주말 브리핑 6/6 · 평일 6/6 · AI-7 6/6 이었고, sonnet-5 는 2/6 · 1/6 · 6/6 이었다.
//   상위 모델이 더 풍부하게 쓰려다 «주어지지 않은 수»를 얹어 number-guard 에 더 자주 걸린다.
//   이 서비스가 원하는 문장은 짧고 곧이곧대로인 사실 서술이라, 그쪽이 잘 맞는다.
//   바꾸고 싶으면 ANTHROPIC_MODEL 만 고치면 되고, 고친 뒤에는 통과율을 «반드시 다시 잰다».

export function hasLlmKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return (m ? m[1] : t).trim();
}

/** temperature 를 받는 모델인가.
 *  ★ 4.6 이후 세대(sonnet-5·opus-5·fable-5 …)는 temperature 를 «400으로 거부»한다.
 *    항상 실어 보내면 모델을 올리는 순간 모든 호출이 조용히 null 이 되고,
 *    화면은 규칙 폴백으로 내려앉는다 — 실측으로 sonnet-5 가 8/8 실패했다.
 *    ANTHROPIC_MODEL 을 둔 이유가 «환경변수만으로 모델을 바꾸는 것»이므로,
 *    바꾸는 순간 깨지는 파라미터를 조건 없이 붙이지 않는다. */
function acceptsTemperature(model: string): boolean {
  return /^claude-(haiku-4-5|3|sonnet-4-5|opus-4-5)/.test(model);
}

async function completeAnthropic(system: string, user: string, maxTokens: number, temperature: number): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(acceptsTemperature(model) ? { temperature } : {}),
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

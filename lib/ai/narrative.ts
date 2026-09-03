// AI-7: 성향 분석 서술 생성 (SPEC §4 AI-7)
// 출력은 사실 서술 + 질문으로 끝난다. 조언·추천이 감지되면 규칙 기반 템플릿으로 폴백 (C8, C10).
import OpenAI from 'openai';
import type { InsightStats } from '../insights';
import { verifyFactualOutput } from './output-guard';

const SYSTEM_PROMPT = `너는 병사의 자산 배분 통계를 "사실 그대로" 서술하는 도구다.
규칙 (어기면 출력이 폐기된다):
- 조언·추천·평가·권유를 절대 하지 않는다. "~하세요", "권장", "추천", "고려" 금지.
- "공격적", "보수적", "위험한" 같은 성향 라벨을 붙이지 않는다.
- 주어진 숫자만 사용해 3~4개의 짧은 사실 문장을 쓰고, 마지막은 스스로 돌아보게 하는
  열린 질문 1개로 끝낸다.
- 예시: "최대 테마 비중 60%. 동기 코호트 중앙값은 22%입니다. 지난 6주간 비중을 한 번도
  바꾸지 않으셨습니다. 이 배분은 어떤 생각으로 고르셨나요?"
- 한국어 존댓말. 200자 이내.`;

/** LLM 서술 생성. 실패·조언 감지 시 null (호출부가 템플릿으로 폴백) */
export async function generateNarrative(stats: InsightStats, themeName: string): Promise<string | null> {
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
            최대전선: themeName,
            최대전선비중: stats.myMaxTheme.weight,
            코호트최대비중중앙값: Math.round(stats.cohortMaxWeightMedian),
            코호트인원: stats.cohortN,
            주당변경폭: Number(stats.myTurnover.toFixed(1)),
            코호트변경폭중앙값: Number(stats.cohortTurnoverMedian.toFixed(1)),
            예비대비중: stats.myCash,
            코호트예비대중앙값: Math.round(stats.cohortCashMedian),
            연변동성퍼센트: Math.round(stats.myVol * 100),
            비중유지주수: stats.weeksUnchanged,
          }),
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) return null;
    // 출력 검증: 조언·성향 라벨·전망이 감지되면 폐기 (사실 서술 원칙 위반)
    if (!verifyFactualOutput(text).ok) return null;
    return text;
  } catch {
    return null;
  }
}

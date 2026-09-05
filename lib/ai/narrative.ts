// AI-7: 성향 분석 서술 생성 (SPEC §4 AI-7)
// 출력은 사실 서술 + 질문으로 끝난다. 조언·추천이 감지되면 규칙 기반 템플릿으로 폴백 (C8, C10).
import type { InsightStats } from '../insights';
import { completeJson, hasLlmKey } from './complete';
import { verifyNumbersFrom } from './number-guard';
import { verifyFactualOutput } from './output-guard';

const SYSTEM_PROMPT = `너는 병사의 자산 배분 통계를 "사실 그대로" 서술하는 도구다.
규칙 (어기면 출력이 폐기된다):
- 조언·추천·평가·권유를 절대 하지 않는다. "~하세요", "권장", "추천", "고려" 금지.
- "공격적", "보수적", "위험한" 같은 성향 라벨을 붙이지 않는다.
- 주어진 숫자만 사용해 3~4개의 짧은 사실 문장을 쓰고, 마지막은 스스로 돌아보게 하는
  열린 질문 1개로 끝낸다.
- **숫자를 직접 계산하지 않는다.** 두 값의 차이를 말하려면 «…차이» 필드에 이미 들어 있으니
  그 값을 쓴다. 주어지지 않은 수를 만들면 출력 전체가 폐기된다.
- 예시: "최대 테마 비중 60%. 동기 코호트 중앙값은 22%입니다. 지난 6주간 비중을 한 번도
  바꾸지 않으셨습니다. 이 배분은 어떤 생각으로 고르셨나요?"
- 한국어 존댓말. 200자 이내.`;

/** LLM 서술 생성. 실패·조언 감지 시 null (호출부가 템플릿으로 폴백) */
export async function generateNarrative(stats: InsightStats, themeName: string): Promise<string | null> {
  if (!hasLlmKey()) return null;
  try {
    // ★ «차이»를 규칙이 미리 계산해 넣는다.
    //   두 값을 나란히 주면 LLM은 한국어에서 가장 자연스러운 비교문 —「6%p 낮습니다」— 을 쓰려고
    //   31−25를 직접 계산한다. 그 6은 입력에 없으므로 number-guard가 폐기하고, 화면은 폴백으로
    //   내려간다. 실측 폐기율 4/5였다. 가드를 느슨하게 푸는 것은 답이 아니다 —
    //   지어낸 수치를 막는 것이 그 가드의 존재 이유다. 대신 «차이도 사실»이므로 규칙이 계산해 준다.
    const round1 = (x: number) => Number(x.toFixed(1));
    const maxWeightMedian = Math.round(stats.cohortMaxWeightMedian);
    const turnover = round1(stats.myTurnover);
    const turnoverMedian = round1(stats.cohortTurnoverMedian);
    const cashMedian = Math.round(stats.cohortCashMedian);
    const input = {
      최대전선: themeName,
      최대전선비중: stats.myMaxTheme.weight,
      코호트최대비중중앙값: maxWeightMedian,
      최대비중차이: Math.abs(stats.myMaxTheme.weight - maxWeightMedian),
      코호트인원: stats.cohortN,
      주당변경폭: turnover,
      코호트변경폭중앙값: turnoverMedian,
      변경폭차이: round1(Math.abs(turnover - turnoverMedian)),
      예비대비중: stats.myCash,
      코호트예비대중앙값: cashMedian,
      예비대차이: Math.abs(stats.myCash - cashMedian),
      연변동성퍼센트: Math.round(stats.myVol * 100),
      비중유지주수: stats.weeksUnchanged,
    };
    const raw = await completeJson({
      system: SYSTEM_PROMPT + '\n출력은 {"text":"사실 문장들"} JSON 한 객체만.',
      user: JSON.stringify(input),
      maxTokens: 300,
      temperature: 0.3,
    });
    if (!raw) return null;
    let text = raw;
    try {
      const parsed = JSON.parse(raw) as { text?: unknown };
      if (typeof parsed.text === 'string') text = parsed.text.trim();
    } catch {
      // 프롬프트가 본문만 돌려준 경우
    }
    if (!text) return null;
    // 출력 검증: 조언·성향 라벨·전망이 감지되면 폐기 (사실 서술 원칙 위반)
    if (!verifyFactualOutput(text).ok) return null;
    // 숫자 검증: 코호트 통계를 지어내면 폐기 (k-익명성 집계를 왜곡하지 않게)
    if (!verifyNumbersFrom(text, input).ok) return null;
    return text;
  } catch {
    return null;
  }
}

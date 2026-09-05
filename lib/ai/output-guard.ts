// LLM 출력 검증 — 조언·성향 라벨 탐지 (C8 보조수단성, C10 유사투자자문 금지)
// AI-3·AI-4·AI-7·AI-8이 전부 이 가드를 공유한다. 하나라도 걸리면 출력을 폐기하고 호출부가 규칙 기반으로 폴백한다.
// ★ "추천하지 마라"를 프롬프트로만 막지 않는다. 프롬프트는 지켜지지 않을 수 있고, 이건 지켜진다.

/** 권유·지시형 어미와 자문 어휘.
 *  ★ 동사를 열거하지 말고 어미를 잡는다 — "늘리세요"만 막으면 "늘려보세요"가 통과한다.
 *  존댓말 사실 서술은 "~입니다/~했습니다"로, 질문은 "~나요/~까요"로 끝나므로
 *  "~세요"를 통째로 막아도 정상 출력은 걸리지 않는다. */
export const ADVICE_PATTERN =
  /(세요|십시오|하시죠|하시길|하시면|해야|권장|추천|권합니다|필요합니다|고려|낫습니다|유리합니다|좋습니다|좋겠습니다|바랍니다|어떨까요)/;

/** 투자성향 라벨 — "안정형/공격형" 같은 딱지를 붙이지 않는다 */
export const LABEL_PATTERN = /(공격적|보수적|안정형|공격형|위험한|무모|과감한|신중한)\s?(이|인|성향|투자자|편|스타일)?/;

/** 목표가·전망·리딩 — 유사투자자문 영역 */
export const FORECAST_PATTERN = /(전망|목표가|상승할|하락할|오를|내릴|유망|사야|팔아야|매수|매도|손절|익절)/;

export type OutputVerdict = { ok: true } | { ok: false; reason: 'advice' | 'label' | 'forecast' };

/** 사실 서술 원칙 위반 검사. 위반이면 호출부는 null을 반환해 규칙 기반 템플릿으로 내려간다. */
export function verifyFactualOutput(text: string): OutputVerdict {
  if (ADVICE_PATTERN.test(text)) return { ok: false, reason: 'advice' };
  if (LABEL_PATTERN.test(text)) return { ok: false, reason: 'label' };
  if (FORECAST_PATTERN.test(text)) return { ok: false, reason: 'forecast' };
  return { ok: true };
}

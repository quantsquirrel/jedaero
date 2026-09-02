// AI-5: 그룹명 부대정보 차단 필터 — 정규식 1차 (SPEC §4 AI-5)
// 개별 병사 1인의 소속은 군사기밀이 아니지만, 다수로부터 수집해 부대별 통계를 산출하면
// 결과물이 '편제 현황'에 근접한다 (2018 Strava 히트맵 사건). 이 정규식은 이 서비스의
// 핵심 차별점이다 — P0-03 검사 스코프에서 이 파일이 제외되는 이유 (docs/VERIFY.md §A-1).
// 편제어 추가 기준: (1) '숫자+편제어'만으로 특정 부대를 지목할 수 있고, (2) 민간 표현과 충돌하지 않을 것.
// 이 패턴은 그룹명뿐 아니라 지출 메모·주간 회고 입력도 함께 막는다 (injection-filter.ts). 회고는 하드 리젝트라
// 오탐 한 건이 퀘스트 크레딧을 날린다 — 그래서 아래 후보들은 의도적으로 넣지 않았다 (다시 넣지 말 것):
//   훈련소 — 편제가 아니라 모든 병사가 거쳐가는 기관명이라 부대별 집계 위험이 없다. 실제 표기
//            (육군훈련소·논산훈련소·신교대)에 숫자가 없어 이 숫자 접두 패턴에 애초에 걸리지 않는다.
//   분대   — '30분대 도착', '9시 40분대 출발' 같은 '몇 분대' 시각 표현과 정면 충돌. 집계 가치는 가장 낮다.
//   본부   — '영업본부 회식비', '대책본부 지원금', '소방본부 신고'를 막아버린다.
//   대·단 단독 — P1-11 픽스처이자 그룹명 플레이스홀더인 '해뜰날 저축단', '1000만원 도전단', '20대/30대'를 막아버린다.
// 군단 뒤의 (?!위)는 郡 단위를 뜻하는 '82 군단위 지자체' 같은 민간 표현만 비켜간다. 숫자+'군단위'로 표기되는
// 실제 부대 명칭은 없으므로 '3군단'·'제3군단'·'5 군단'·'6군단 전우회'는 그대로 차단된다.
export const UNIT_PATTERNS: RegExp[] = [
  /\d{1,2}\s*(사단|여단|연대|대대|중대|소대|비행단|함대|전단|전대|군단(?!위)|사령부)/,
  /(제)?\s*\d{4}\s*부대/,
  /(GOP|GP|DMZ|전방부대)/i,
];

export type GroupNameCheck = {
  blocked: boolean;
  reason?: string;
  /** 정규식은 통과했지만 LLM 2차 가드가 필요한 의심 케이스 */
  suspicious?: boolean;
};

const SUSPICIOUS_HINT = /(수색|특공|기갑|포병|방공|항공|공병|정비|보급|헌병|군수|통신대)/;

export function checkGroupName(name: string): GroupNameCheck {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return { blocked: true, reason: '그룹명은 2~20자로 입력해주세요.' };
  }
  for (const re of UNIT_PATTERNS) {
    if (re.test(trimmed)) {
      return { blocked: true, reason: '부대 식별 정보는 입력하실 수 없습니다.' };
    }
  }
  // 1차 통과분 중 숫자 + 군 편제 계열 단어 조합만 LLM 가드로 정밀 판정
  const suspicious = /\d/.test(trimmed) && SUSPICIOUS_HINT.test(trimmed);
  return { blocked: false, suspicious };
}

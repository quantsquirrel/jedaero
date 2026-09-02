// AI-5: 그룹명 부대정보 차단 필터 — 정규식 1차 (SPEC §4 AI-5)
// 개별 병사 1인의 소속은 군사기밀이 아니지만, 다수로부터 수집해 부대별 통계를 산출하면
// 결과물이 '편제 현황'에 근접한다 (2018 Strava 히트맵 사건). 이 정규식은 이 서비스의
// 핵심 차별점이다 — P0-03 검사 스코프에서 이 파일이 제외되는 이유 (docs/VERIFY.md §A-1).
// 숫자와 편제 단어 사이에 병과명이 끼는 실제 부대명(`제1보병사단`, `제7기동군단`)까지 잡되,
// 그 사이를 `[가-힣]{0,6}` 같은 자유 공백으로 두면 안 된다 — UNIT_PATTERNS 는
// injection-filter 를 거쳐 주간 회고·지출 메모 등 모든 LLM 입력을 함께 막으므로,
// `100 도전단`·`2026 청년연대`처럼 숫자 뒤에 흔한 모임명 접미사가 붙은 정상 입력이
// 하드 리젝트된다. 그래서 병과명은 열거된 것만 허용한다.
export const UNIT_PATTERNS: RegExp[] = [
  /\d{1,2}\s*(?:보병|기계화|기갑|기동|공수|특전|수색|포병|공병|통신|의무|항공|해병|신속대응|근위){0,3}\s*(사단|여단|연대|대대|중대|소대|군단|비행단|함대|전단)/,
  /(제)?\s*\d{4}\s*부대/,
  /(GOP|GP|DMZ|전방부대)/i,
];

export type GroupNameCheck = {
  blocked: boolean;
  reason?: string;
  /** 정규식은 통과했지만 LLM 2차 가드가 필요한 의심 케이스 */
  suspicious?: boolean;
};

const SUSPICIOUS_HINT =
  /(수색|특공|기갑|포병|방공|항공|공병|정비|보급|헌병|군수|통신대|보병|기계화|기동|군단)/;

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

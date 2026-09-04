// LLM 출력의 «숫자» 검증 — 어휘 가드(output-guard.ts)의 짝 (C8, C10)
//
// 모든 시스템 프롬프트가 "주어진 숫자만 쓴다"고 적지만, 프롬프트는 지켜지지 않을 수 있다.
// output-guard 는 조언·라벨·전망 «어휘»만 본다. 그래서 다음이 전부 통과해 왔다:
//   - 입력에 없는 수치를 지어내는 것            ("반도체가 12.4% 올랐습니다")
//   - 준 숫자를 곱해 새 사실을 만드는 것         (등락 × 내 비중 = 이번 주 내 손익)
// 두 번째가 평일에 특히 문제다. 평일 입력에서 «가중 등락»을 뺐어도 등락과 비중을 함께 주면
// LLM이 직접 곱해 손익을 말할 수 있고, 그걸 막는 것이 프롬프트 한 줄뿐이었다.
//
// 규칙은 하나다: **출력에 나오는 숫자는 입력에 있던 숫자여야 한다.**
// 위반하면 null을 반환해 호출부가 규칙 기반 템플릿으로 내려간다 — 화면은 비지 않는다.

/** 텍스트에서 숫자를 뽑는다. 천 단위 콤마·부호·소수점을 함께 처리한다. */
export function extractNumbers(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const n = Number(m[0].replace(/,/g, ''));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/** JSON 입력(객체·배열·문자열 포함)에 등장하는 모든 숫자를 모은다.
 *  문자열 안의 숫자도 센다 — 구간 문자열의 날짜·영업일 수가 여기 들어 있다. */
export function collectNumbers(value: unknown): number[] {
  if (typeof value === 'number') return Number.isFinite(value) ? [Math.abs(value)] : [];
  if (typeof value === 'string') return extractNumbers(value);
  if (Array.isArray(value)) return value.flatMap(collectNumbers);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectNumbers);
  return [];
}

export type NumberVerdict =
  | { ok: true }
  | { ok: false; reason: 'invented' | 'forbidden'; value: number };

// 소수 첫째자리까지 맞으면 같은 값으로 본다. 정수 반올림도 허용한다 —
// "2.2%"를 "약 2%"로 적는 것은 가공이 아니라 표기이므로 폐기 대상이 아니다.
// ★ 반올림 허용은 1 이상에서만. 아래로 열어 두면 0.4가 구조상수 0으로 반올림돼
//   1 미만의 «지어낸 소수»가 전부 통과한다.
const NEAR = 0.05;
const near = (x: number, a: number) =>
  Math.abs(x - a) <= NEAR || (x >= 1 && a >= 1 && Math.round(x) === Math.round(a));

/** 구조적으로 늘 등장할 수 있는 수. 전선 개수·비율의 양끝은 사실 진술의 도구다. */
export const STRUCTURAL_NUMBERS = [0, 1, 100];

/**
 * 출력 숫자가 전부 입력에서 왔는지 검사한다.
 *
 * @param allowed   입력에 있던 숫자 (collectNumbers 로 모은 것 + 구조적 상수)
 * @param forbidden 입력에 있어도 «말하면 안 되는» 값. 평일 브리핑의 가중 등락이 여기 들어간다.
 *
 * ★ 금지값이 허용값과 우연히 겹칠 때(가중 등락 0.8% = 기타 해외 등락 0.8%)는 **닫는 쪽**을 고른다.
 *   둘을 구분할 방법이 없고, 폐기의 대가는 규칙 기반 폴백 문장 하나다 — 화면은 비지 않는다.
 *   새는 대가는 평일에 손익을 말해 버리는 것이라 비교가 되지 않는다.
 */
export function verifyNumbers(
  text: string,
  allowed: number[],
  forbidden: number[] = [],
): NumberVerdict {
  const pool = allowed.map(Math.abs);
  const banned = forbidden.map(Math.abs);
  for (const raw of extractNumbers(text)) {
    const x = Math.abs(raw);
    // 금지 판정은 «엄격»하게(NEAR만). 반올림 관용은 정상 출력을 살리려고 둔 것이므로
    // 금지 쪽에 함께 적용하면 금지 범위가 넓어져 멀쩡한 문장을 죽인다
    // (실측: 반올림을 금지에도 적용하면 규칙 폴백의 14.1%가 폐기됐다).
    if (banned.some((f) => Math.abs(x - f) <= NEAR)) {
      return { ok: false, reason: 'forbidden', value: raw };
    }
    if (!pool.some((a) => near(x, a))) return { ok: false, reason: 'invented', value: raw };
  }
  return { ok: true };
}

/** 입력 페이로드를 그대로 받아 검사한다. 호출부가 allowed 를 손으로 만들지 않게 한다. */
export function verifyNumbersFrom(
  text: string,
  input: unknown,
  forbidden: number[] = [],
): NumberVerdict {
  return verifyNumbers(text, [...collectNumbers(input), ...STRUCTURAL_NUMBERS], forbidden);
}

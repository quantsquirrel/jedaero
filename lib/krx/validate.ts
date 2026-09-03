// 6전선 상장코드 맵 검증 — 검사(P1-20)와 종가 적재 스크립트가 같은 규칙을 쓴다.
// ★ 화면에는 일반명(screenName)만 나간다. 운용사 브랜드가 붙은 실제 상품명은 특정 상품 지목이라
//   C10에 인접한다 — 코드 옆 주석으로만 남긴다.
import { KRX_MAP } from '../../db/seed/krx-map';
import { REPRESENTATIVE } from '../../db/seed/tickers';
import { THEME_CODES } from '../constants';

/** 운용사 브랜드 — 화면 이름에 들어가면 안 된다 */
const BRAND = /KODEX|TIGER|ACE|KOSEF|HANARO|PLUS|SOL|RISE/i;

/** 맵 자체의 문제 목록. 빈 배열이면 통과 */
export function validateKrxMap(): string[] {
  const problems: string[] = [];
  if (KRX_MAP.length !== THEME_CODES.length) {
    problems.push(`맵 ${KRX_MAP.length}행 — ${THEME_CODES.length}전선이어야 함`);
  }
  const seen = new Set<string>();
  for (const row of KRX_MAP) {
    if (!THEME_CODES.includes(row.theme)) problems.push(`알 수 없는 전선 ${row.theme}`);
    if (row.internal !== REPRESENTATIVE[row.theme]) {
      problems.push(`${row.theme} internal ${row.internal} ≠ 대표 ${REPRESENTATIVE[row.theme]}`);
    }
    if (!/^\d{6}$/.test(row.krxCode)) problems.push(`${row.theme} 코드 ${row.krxCode} — 6자리 숫자여야 함`);
    if (seen.has(row.krxCode)) problems.push(`중복 코드 ${row.krxCode}`);
    seen.add(row.krxCode);
    if (BRAND.test(row.screenName)) problems.push(`화면 이름에 운용사 브랜드: ${row.screenName}`);
  }
  for (const theme of THEME_CODES) {
    if (!KRX_MAP.some((r) => r.theme === theme)) problems.push(`${theme} 맵 없음`);
  }
  return problems;
}

export type ClosesFile = { date?: string; closes?: Record<string, number> };

/** 적재할 종가 묶음의 문제 목록. 하루치 6전선이 모두 있어야 한다 */
export function validateCloses(raw: ClosesFile): string[] {
  const problems: string[] = [];
  if (!raw.date || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    problems.push(`날짜 없음/형식 오류: ${raw.date}`);
  }
  const closes = raw.closes ?? {};
  for (const row of KRX_MAP) {
    const px = closes[row.krxCode];
    if (px == null) problems.push(`${row.screenName} (${row.krxCode}) 종가 없음`);
    else if (!Number.isInteger(px) || px <= 0) {
      problems.push(`${row.krxCode} 종가 ${px} — 양의 정수여야 함`);
    }
  }
  return problems;
}

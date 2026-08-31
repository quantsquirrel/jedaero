// 킬스위치(ai_enabled=false) 시 룰 기반 폴백 (SPEC §5)
// 생성형 AI가 아니므로 UI에서 "규칙 기반 분류"로 구분 표기해야 한다 (C9).
import type { ClassifyResult, Tier } from './classify';

const RULES: [Tier, RegExp][] = [
  ['A', /KTX|기차|버스|택시|교통|왕복|시외|고속|병원|의료|진료|약|처방|안경|렌즈/i],
  ['B', /통신|요금|생필품|세면|샴푸|치약|이발|미용|화장품|책|도서|강의|식비|식사|자기계발/],
  ['C', /PX|과자|간식|음료|아이스크림|라면|담배|배달|치킨|피자|게임|결제|선물/i],
];

/** 규칙 매칭 실패 시 null → 미분류로 두고 사용자가 직접 고른다 */
export function classifyExpenseFallback(input: { amount: number; memo: string }): ClassifyResult | null {
  for (const [tier, re] of RULES) {
    if (re.test(input.memo)) {
      const others: Tier[] = (['A', 'B', 'C'] as Tier[]).filter((t) => t !== tier);
      return { tier, confidence: 0.75, candidates: [tier, others[0]] };
    }
  }
  return null;
}

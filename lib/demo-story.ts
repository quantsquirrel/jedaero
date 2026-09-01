// /demo 사용자의 비중 변경 이력 (SPEC §7) — 순수 데이터. DB를 import하지 않는다.
// lib/demo-seed.ts가 이걸 읽어 allocations에 넣고, scripts/checks/가 DB 없이 검증한다.
import type { Weights } from './constants';

// 12주 중 8·3주 전과 최근 2주는 조정하지 않았다.
// ★ 최근 2주를 비워두는 것이 P0-1의 핵심이다. 마지막 체결이 어제·그제면 시장이 비중을 흐트러뜨릴
//   시간이 없어 「목표 vs 현재」 갭이 전 축 0%p로 뜨고, 리밸런싱 개념이 화면에서 사라진다.
//   덤으로 HOLD 퀘스트("그대로 두기")가 시연된다 — 아무것도 안 하는 것도 유효한 선택이다.
export const SKIP_WEEKS_AGO = new Set([8, 3, 2, 1]);

// 12주 전 → 4주 전. GLOBAL에서 시작해 5%p 단위로 조금씩 이동한 이력
export const WEIGHT_STORY: { weeksAgo: number; weights: Weights; templateId?: string }[] = [
  { weeksAgo: 12, weights: { KR_LARGE: 20, KR_THEME: 0, US_INDEX: 50, BOND_CASH: 20, GOLD_COMM: 10, DIVIDEND: 0 }, templateId: 'GLOBAL' },
  { weeksAgo: 11, weights: { KR_LARGE: 20, KR_THEME: 5, US_INDEX: 50, BOND_CASH: 15, GOLD_COMM: 10, DIVIDEND: 0 } },
  { weeksAgo: 10, weights: { KR_LARGE: 25, KR_THEME: 5, US_INDEX: 45, BOND_CASH: 15, GOLD_COMM: 10, DIVIDEND: 0 } },
  { weeksAgo: 9, weights: { KR_LARGE: 25, KR_THEME: 10, US_INDEX: 45, BOND_CASH: 10, GOLD_COMM: 10, DIVIDEND: 0 } },
  { weeksAgo: 7, weights: { KR_LARGE: 20, KR_THEME: 10, US_INDEX: 50, BOND_CASH: 10, GOLD_COMM: 10, DIVIDEND: 0 } },
  { weeksAgo: 6, weights: { KR_LARGE: 20, KR_THEME: 15, US_INDEX: 45, BOND_CASH: 10, GOLD_COMM: 10, DIVIDEND: 0 } },
  { weeksAgo: 5, weights: { KR_LARGE: 15, KR_THEME: 15, US_INDEX: 45, BOND_CASH: 15, GOLD_COMM: 10, DIVIDEND: 0 } },
  { weeksAgo: 4, weights: { KR_LARGE: 15, KR_THEME: 20, US_INDEX: 40, BOND_CASH: 15, GOLD_COMM: 10, DIVIDEND: 0 } },
];

/** 실제로 allocations 행이 생기는 주만 (스킵 주는 행이 없다 = 직전 비중 유지) */
export const ACTIVE_WEIGHT_STORY = WEIGHT_STORY.filter((w) => !SKIP_WEEKS_AGO.has(w.weeksAgo));

// /demo 사용자의 비중 변경 이력 (SPEC §7) — 순수 데이터. DB를 import하지 않는다.
// lib/demo-seed.ts가 이걸 읽어 allocations에 넣고, scripts/checks/가 DB 없이 검증한다.
import type { Weights } from './constants';

// 12주 중 8·3주 전과 최근 2주는 조정하지 않았다.
// ★ 최근 2주를 비워두는 것이 P0-1의 핵심이다. 마지막 체결이 어제·그제면 시장이 비중을 흐트러뜨릴
//   시간이 없어 「목표 vs 현재」 갭이 전 축 0%p로 뜨고, 리밸런싱 개념이 화면에서 사라진다.
export const SKIP_WEEKS_AGO = new Set([8, 3, 2, 1]);

// 12주 전 → 4주 전. 연합작전에서 시작해 1포인트(5%p)씩 옮긴 이력.
// ★ 7주 전에 「기타 해외」에서 1포인트를 빼고 어디에도 놓지 않는다 = 예비대 1포인트.
//   4주 전에 그 1포인트를 금·원자재에 투입한다. 예비대가 생겼다 쓰이는 과정이 시연된다.
export const WEIGHT_STORY: { weeksAgo: number; weights: Weights; templateId?: string }[] = [
  { weeksAgo: 12, weights: { KR_STOCK: 20, US_STOCK: 20, INTL_STOCK: 15, BOND: 20, GOLD_COMM: 15, REIT_INFRA: 10 }, templateId: 'ALLIANCE' },
  { weeksAgo: 11, weights: { KR_STOCK: 20, US_STOCK: 25, INTL_STOCK: 15, BOND: 15, GOLD_COMM: 15, REIT_INFRA: 10 } },
  { weeksAgo: 10, weights: { KR_STOCK: 25, US_STOCK: 25, INTL_STOCK: 15, BOND: 15, GOLD_COMM: 10, REIT_INFRA: 10 } },
  { weeksAgo: 9, weights: { KR_STOCK: 25, US_STOCK: 30, INTL_STOCK: 15, BOND: 15, GOLD_COMM: 10, REIT_INFRA: 5 } },
  { weeksAgo: 7, weights: { KR_STOCK: 25, US_STOCK: 30, INTL_STOCK: 10, BOND: 15, GOLD_COMM: 10, REIT_INFRA: 5 } },
  { weeksAgo: 6, weights: { KR_STOCK: 20, US_STOCK: 35, INTL_STOCK: 10, BOND: 15, GOLD_COMM: 10, REIT_INFRA: 5 } },
  { weeksAgo: 5, weights: { KR_STOCK: 20, US_STOCK: 30, INTL_STOCK: 10, BOND: 20, GOLD_COMM: 10, REIT_INFRA: 5 } },
  { weeksAgo: 4, weights: { KR_STOCK: 20, US_STOCK: 30, INTL_STOCK: 10, BOND: 20, GOLD_COMM: 15, REIT_INFRA: 5 } },
];

/** 실제로 allocations 행이 생기는 주만 (스킵 주는 행이 없다 = 직전 비중 유지) */
export const ACTIVE_WEIGHT_STORY = WEIGHT_STORY.filter((w) => !SKIP_WEEKS_AGO.has(w.weeksAgo));

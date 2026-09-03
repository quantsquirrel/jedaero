// 제대로 지수 (100점) — 리그의 점수 축. 순위 숫자는 표시하지 않는다.
//
// 40 : 불린 만큼    샤프 비율. 무위험수익률 = 0 (예비대가 곧 무위험 자산이므로)
// 30 : 나눠 담은 만큼 유효 전선 수 = 1 / Σ(비중²)
// 30 : 버틴 만큼    회전율의 역수
//
// 배점 근거
// - 수익률 하나만 보면 짧은 시즌의 1등은 대개 몰빵이다. 위험 대비로 나눠야 그 행동이 표창받지 않는다
//   (Lo, 2002 — 샤프 비율의 통계적 성질)
// - 회전율 배점은 잦은 거래가 수익을 갉아먹는다는 관찰에 근거한다 (Barber & Odean, 2000)
// - 세 축의 합이 100이고 어느 하나로 만점을 낼 수 없다. 한 축만 밀면 최대 40점이다
//
// ★ 이 파일은 DB를 import하지 않는다. 순수 계산이라 시드 없이 검증할 수 있다.
import { THEME_CODES, type Weights } from './constants';
import { reserveWeight } from './insights';

export const INDEX_MAX = { grown: 40, spread: 30, held: 30 } as const;

// 각 축의 만점 기준선. 값을 바꾸면 점수 분포가 통째로 움직이므로 근거 없이 건드리지 말 것.
const SHARPE_FULL = 1.5; // 샤프 1.5 이상이면 만점
const EFFECTIVE_FRONTS_FULL = 3.2; // 유효 전선 3.2개 이상이면 만점 (3.0에서 이미 만점 근처)
const TURNOVER_ZERO = 15; // 주당 평균 변경폭 15%p(= 3포인트 이동)이면 0점

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 샤프 비율. 무위험수익률 0 — 아무 데도 놓지 않은 병력(예비대)이 명목가치를 유지하기 때문이다. */
export function sharpe(annualReturn: number, annualVol: number): number {
  if (annualVol <= 0) return 0;
  return annualReturn / annualVol;
}

/** 유효 전선 수 = 1 / Σ(비중²). 예비대도 하나의 몫으로 센다.
 *  ★ 예비대를 빼면 전부 예비대인 편성의 Σ(비중²)이 0이 되어 유효 전선 수가 무한대가 된다.
 *  전선 3개에 고르게 놓으면 3.0, 한 곳에 몰면 1.0. */
export function effectiveFronts(w: Weights): number {
  const parts = [...THEME_CODES.map((c) => (w[c] ?? 0) / 100), reserveWeight(w) / 100];
  const hhi = parts.reduce((s, p) => s + p * p, 0);
  return hhi > 0 ? 1 / hhi : 1;
}

export type IndexParts = { grown: number; spread: number; held: number; total: number };

/** 세 축을 점수로 환산한다. 입력이 없는 축은 0점이 아니라 만점의 절반으로 두지 않는다 —
 *  기록이 없으면 0점이고, 화면에는 「집계 대기」로 적는다. */
export function jedaeroIndex(input: {
  annualReturn: number | null;
  annualVol: number | null;
  weights: Weights | null;
  turnoverPct: number | null; // 주당 평균 변경폭 %p
}): IndexParts {
  const grown =
    input.annualReturn != null && input.annualVol != null
      ? INDEX_MAX.grown * clamp01(sharpe(input.annualReturn, input.annualVol) / SHARPE_FULL)
      : 0;

  const spread = input.weights
    ? INDEX_MAX.spread * clamp01((effectiveFronts(input.weights) - 1) / (EFFECTIVE_FRONTS_FULL - 1))
    : 0;

  // ★ 목표 복귀(리밸런싱)는 회전율에 잡히지 않는다.
  //   회전율을 「체결량」이 아니라 「목표 비중의 변화량」으로 재기 때문이다.
  //   되돌리기는 같은 목표를 다시 확정하는 것이라 Δ가 0이다. 구조가 규칙을 대신 지킨다.
  const held =
    input.turnoverPct != null
      ? INDEX_MAX.held * clamp01(1 - input.turnoverPct / TURNOVER_ZERO)
      : 0;

  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    grown: r1(grown),
    spread: r1(spread),
    held: r1(held),
    total: r1(grown + spread + held),
  };
}

/** 화면 라벨 — 어려운 말을 쓰지 않는다. 샤프·HHI·회전율·백분위는 밖으로 내보내지 않는다 */
export const INDEX_LABELS = [
  { key: 'grown', label: '불린 만큼', hint: '위험 대비 수익', max: INDEX_MAX.grown },
  { key: 'spread', label: '나눠 담은 만큼', hint: '실질 몇 개에 나눴나', max: INDEX_MAX.spread },
  { key: 'held', label: '버틴 만큼', hint: '몇 주 유지했나', max: INDEX_MAX.held },
] as const;

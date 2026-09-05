// 사실 문장 7종 — 전부 기존 함수 조합. 새 엔진이 없다 (설계 문서 §6)
// ★ db를 import하지 않는다. 가격·이력을 인자로 받아 순수 계산한다 (P1-26이 DB 없이 돈다).
// ★ LLM이 이 숫자를 만들지 않는다. 여기서 만들고, AI는 문장만 쓴다 (docs/AI-ROLES.md ②/④).
import { SEED_AMOUNT, THEMES, THEME_CODES, type Weights } from '../constants';
import { manWon } from '../format';
import { effectiveFronts } from '../jedaero-index';
import { reserveWeight } from '../insights';
import { computeCurve, type WeightHistoryItem } from '../portfolio/engine';
import type { Details } from '../portfolio/details';
import { runDrill } from '../drill/run';
import { weekOfDateStr, weeksBetween } from '../week';

export type PrincipleId =
  | 'alloc'
  | 'spread'
  | 'decisions'
  | 'drawdown'
  | 'cash'
  | 'drill'
  | 'attrib';

export type PrincipleSentence = { id: PrincipleId; text: string };

export type PrincipleRow = {
  weekOf: string;
  effectiveFrom: string;
  weights: Weights;
  details: Details | null;
};

export type PrincipleInput = {
  /** effectiveFrom 오름차순 */
  rows: PrincipleRow[];
  currentWeek: string;
  dates: string[];
  series: Record<string, number[]>;
};

const KO = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'] as const;

/** 1~10은 한글 수사 + 띄어쓰기(「여섯 개」), 그 위는 숫자 + 붙여쓰기(「12개」).
 *  ★ 「마흔일곱 번」 같은 표기를 만들지 않는다. 복무 기간이 길어져도 문장이 무너지지 않는다. */
export function koCount(n: number, unit: string): string {
  return n >= 0 && n <= 10 ? `${KO[n]} ${unit}` : `${n}${unit}`;
}

const placedSum = (w: Weights) => THEME_CODES.reduce((s, c) => s + (w[c] ?? 0), 0);

const toHistory = (rows: PrincipleRow[]): WeightHistoryItem[] =>
  rows.map((r) => ({
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Record<string, number>,
    details: (r.details as Record<string, Record<string, number>> | null) ?? null,
  }));

export function buildPrincipleSentences(input: PrincipleInput): PrincipleSentence[] {
  const { rows, currentWeek, dates, series } = input;
  if (rows.length === 0) return [];

  const out: PrincipleSentence[] = [];
  const latest = rows[rows.length - 1];
  const history = toHistory(rows);
  const cashflows = { [rows[0].effectiveFrom]: SEED_AMOUNT };
  const curve = computeCurve(dates, series, history, cashflows);

  // ── 문안 5: 배분 ──
  const nonZero = THEME_CODES.filter((c) => (latest.weights[c] ?? 0) > 0);
  const maxCode = nonZero.reduce(
    (best, c) => ((latest.weights[c] ?? 0) > (latest.weights[best] ?? 0) ? c : best),
    nonZero[0],
  );
  const maxName = THEMES.find((t) => t.code === maxCode)?.name ?? maxCode;
  const maxAmount = (SEED_AMOUNT * (latest.weights[maxCode] ?? 0)) / 100;
  out.push({
    id: 'alloc',
    text: `${manWon(SEED_AMOUNT)}을 ${koCount(nonZero.length, '개')} 자산군에 나눠 뒀습니다. 가장 큰 것은 ${maxName}이고 ${manWon(maxAmount)}입니다.`,
  });

  // ── 문안 6: 분산 ──
  const fronts = effectiveFronts(latest.weights);
  out.push({
    id: 'spread',
    text: `${koCount(nonZero.length, '개')}로 나눴지만 실제 분산은 ${koCount(Math.round(fronts), '개')} 수준이었습니다. ${maxName} 하나가 컸습니다.`,
  });

  // ── 문안 7: 의사결정 횟수 ──
  const spanWeeks = Math.max(1, weeksBetween(rows[0].weekOf, currentWeek) + 1);
  const heldWeeks = Math.max(0, spanWeeks - rows.length);
  out.push({
    id: 'decisions',
    text: `${spanWeeks}주 동안 ${koCount(rows.length, '번')} 의사결정했습니다. ${koCount(heldWeeks, '주')}는 그대로 뒀습니다.`,
  });

  // ── 문안 8: 최대 하락 ──
  // 저점 시점의 주에 편성 행이 있었는지로 뒷문장이 갈린다. 둘 다 사실이다.
  let peak = 0;
  let worst = 0;
  let trough = 0;
  let peakAtTrough = 0;
  let troughIdx = 0;
  for (let i = 0; i < curve.values.length; i++) {
    const v = curve.values[i];
    if (v <= 0) continue;
    if (v > peak) peak = v;
    const dd = v / peak - 1;
    if (dd < worst) {
      worst = dd;
      trough = v;
      peakAtTrough = peak;
      troughIdx = i;
    }
  }
  if (worst < 0 && peakAtTrough > 0) {
    const troughWeek = weekOfDateStr(dates[troughIdx]);
    const changedThatWeek = rows.some((r) => r.weekOf === troughWeek);
    out.push({
      id: 'drawdown',
      text: `가장 큰 하락 추세에서 ${manWon(peakAtTrough)}이 ${manWon(trough)}까지 내려갔습니다. 그 주에 배분을 ${changedThatWeek ? '바꿨습니다' : '바꾸지 않았습니다'}.`,
    });
  }

  // ── 문안 9: 현금 (0이면 뜨지 않는다) ──
  const avgReserve = rows.reduce((s, r) => s + reserveWeight(r.weights), 0) / rows.length;
  if (avgReserve >= 1) {
    out.push({
      id: 'cash',
      text: `평균 ${manWon((SEED_AMOUNT * avgReserve) / 100)}은 현금으로 뒀습니다. 잃지도, 늘지도 않았습니다.`,
    });
  }

  // ── 문안 10: 급락장 ──
  const drill = runDrill(
    latest.weights,
    'crash-recover',
    (latest.details as Record<string, Record<string, number>> | null) ?? undefined,
  );
  const troughMonths = Math.max(1, Math.round(drill.troughTradingDays / 21));
  out.push({
    id: 'drill',
    text: `2020년 급락장에 이 배분을 넣으면 ${manWon(drill.troughValue)}까지 내려갑니다. 저점까지 약 ${troughMonths}개월이 걸립니다.`,
  });

  // ── 문안 11: 내 조정이 움직인 금액 (편성이 하나뿐이면 뜨지 않는다) ──
  // ★ 같은 엔진에 이력 배열만 바꿔 넣는다. 첫 편성을 끝까지 유지한 반사실 곡선이다.
  // ★ 크기만 적는다. 합성 시세에서 어느 쪽이 높은지는 우연이고, 우리 데이터가 뒷받침하지 못한다.
  if (rows.length > 1) {
    const held = computeCurve(dates, series, [history[0]], cashflows);
    const diff = Math.abs(
      (curve.values[curve.values.length - 1] ?? 0) - (held.values[held.values.length - 1] ?? 0),
    );
    out.push({
      id: 'attrib',
      text: `${spanWeeks}주 동안 배분을 바꿔서 움직인 금액은 ${manWon(diff)}입니다. 나머지는 시장이 움직였습니다.`,
    });
  }

  return out;
}

/** AI-8 입력용 요약 비중. 주식 3전선을 합쳐 기관 분류와 견줄 수 있게 만든다 */
export function myAssetMix(w: Weights): { equity: number; bond: number; cash: number } {
  return {
    equity: (w.KR_STOCK ?? 0) + (w.US_STOCK ?? 0) + (w.INTL_STOCK ?? 0),
    bond: w.BOND ?? 0,
    cash: 100 - placedSum(w),
  };
}

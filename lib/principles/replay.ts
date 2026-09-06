// 한 줄 회고 × 편성을 week_of 로 합친 복기 목록.
// ★ 차이·유지·묶임은 저장하지 않는다. 요청 때 두 목록을 합친다.
// ★ 행이 없는 주(미조정)는 회고가 있을 때만 목록에 탄다. 출석표가 되지 않게.
import { RESERVE, THEMES, THEME_CODES, type ThemeCode, type Weights } from '../constants';
import { reserveWeight } from '../insights';
import { mondayOfWeek } from '../week';

export type ReplayDelta = {
  code: ThemeCode | 'RESERVE';
  name: string;
  pp: number;
};

export type ReplayWeek = {
  weekOf: string;
  monday: string;
  review: string | null;
  weights: Weights;
  confirmedThisWeek: boolean;
  firstConfirm: boolean;
  held: boolean;
  deltas: ReplayDelta[];
};

export type ReplayAlloc = { weekOf: string; weights: Weights };
export type ReplayReview = { weekOf: string; body: string };

export function formatDeltaPp(pp: number): string {
  return `${pp >= 0 ? '+' : '−'}${Math.abs(pp)}%p`;
}

function themeName(code: ThemeCode | 'RESERVE'): string {
  if (code === 'RESERVE') return RESERVE.name;
  return THEMES.find((t) => t.code === code)?.name ?? code;
}

function deltasBetween(prev: Weights, next: Weights): ReplayDelta[] {
  const out: ReplayDelta[] = [];
  for (const code of THEME_CODES) {
    const pp = (next[code] ?? 0) - (prev[code] ?? 0);
    if (pp !== 0) out.push({ code, name: themeName(code), pp });
  }
  const reservePp = reserveWeight(next) - reserveWeight(prev);
  if (reservePp !== 0) out.push({ code: 'RESERVE', name: themeName('RESERVE'), pp: reservePp });
  return out;
}

export function buildReplayWeeks(input: {
  allocations: ReplayAlloc[];
  reviews: ReplayReview[];
}): ReplayWeek[] {
  const allocByWeek = new Map(input.allocations.map((a) => [a.weekOf, a.weights]));
  const reviewByWeek = new Map(input.reviews.map((r) => [r.weekOf, r.body]));
  const weeks = [...new Set([...allocByWeek.keys(), ...reviewByWeek.keys()])].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const allocChrono = [...input.allocations].sort((a, b) =>
    a.weekOf < b.weekOf ? -1 : a.weekOf > b.weekOf ? 1 : 0,
  );

  const out: ReplayWeek[] = [];
  for (const weekOf of weeks) {
    const confirmed = allocByWeek.get(weekOf);
    const review = reviewByWeek.get(weekOf) ?? null;
    if (!confirmed && !review) continue;

    const prev = [...allocChrono].reverse().find((a) => a.weekOf < weekOf)?.weights ?? null;
    const weights = confirmed ?? prev;
    if (!weights) continue;

    const firstConfirm = Boolean(confirmed) && prev === null;
    const held = !confirmed;
    out.push({
      weekOf,
      monday: mondayOfWeek(weekOf),
      review,
      weights,
      confirmedThisWeek: Boolean(confirmed),
      firstConfirm,
      held,
      deltas: confirmed && prev ? deltasBetween(prev, confirmed) : [],
    });
  }
  return out;
}

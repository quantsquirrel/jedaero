// 도상훈련 시세 — 교육용 고정 시계열. 런타임 KRX 호출 없음 (C6).
// 2008년 한국 ETF는 존재하지 않는다. 교훈 표(회복/동조/미회복)만 만족시키면 된다.
import { TICKERS, type TickerSeed } from '../../db/seed/tickers';
import { DRILL_SCENARIOS } from './scenarios';
import type { DrillScenarioId } from './scenarios';
import type { ThemeCode } from '../constants';

export type DrillSeries = { dates: string[]; series: Record<string, number[]> };

const START = 10_000;

/** 달력 기준 평일(월–금). 공휴일은 교육용 픽스처에서 열지 않는다.
 *  ★ 산술은 전부 UTC로 한다. getDay()/getDate() 같은 로컬 시각 메서드를 쓰면
 *  서버 타임존에 따라 구간 양끝이 하루 밀린다 (UTC−8 호스트에서 260일 → 259일로 관측됨).
 *  구간이 고정 상수인 픽스처라 "지금"이 개입할 여지가 없어야 한다 — lib/day-type.ts와 같은 규율. */
export function weekdaysInclusive(fromDate: string, toDate: string): string[] {
  const out: string[] = [];
  const parse = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  const end = parse(toDate);
  for (let t = parse(fromDate); t <= end; t += 86_400_000) {
    const cur = new Date(t);
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(cur.toISOString().slice(0, 10));
  }
  return out;
}

/** 구간 [0,1] 키포인트(배수)를 선형 보간해 원 단위 정수 시계열을 만든다. */
function path(n: number, keys: ReadonlyArray<readonly [number, number]>): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    let j = 0;
    while (j < keys.length - 1 && keys[j + 1][0] < t) j += 1;
    const [t0, m0] = keys[j];
    const [t1, m1] = keys[Math.min(j + 1, keys.length - 1)];
    const u = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
    out.push(Math.round(START * (m0 + (m1 - m0) * u)));
  }
  return out;
}

/** 하위 테마의 진폭 배수 — 티커 이름에서 결정론적으로 뽑는다 (1.15 ~ 1.55).
 *  난수를 쓰지 않으므로 재실행해도 같은 값이고, 픽스처는 고정 시계열로 남는다. */
function themeAmplitude(ticker: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < ticker.length; i++) {
    h ^= ticker.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 1.15 + ((h % 41) / 40) * 0.4;
}

type ThemePaths = Record<ThemeCode, ReadonlyArray<readonly [number, number]>>;

const PATHS: Record<DrillScenarioId, ThemePaths> = {
  // 급락 후 회복 — 주식 저점 ≈ 62%, 끝은 시작 위. MDD와 끝이 갈린다.
  'crash-recover': {
    KR_STOCK: [
      [0, 1],
      [0.1, 0.68],
      [0.18, 0.62],
      [1, 1.18],
    ],
    US_STOCK: [
      [0, 1],
      [0.1, 0.7],
      [0.18, 0.64],
      [1, 1.22],
    ],
    INTL_STOCK: [
      [0, 1],
      [0.12, 0.72],
      [0.2, 0.66],
      [1, 1.12],
    ],
    BOND: [
      [0, 1],
      [0.2, 1.04],
      [1, 1.06],
    ],
    GOLD_COMM: [
      [0, 1],
      [0.15, 1.12],
      [1, 1.04],
    ],
    REIT_INFRA: [
      [0, 1],
      [0.15, 0.72],
      [1, 1.08],
    ],
  },
  // 같이 내린 해 — 주식·채권 동조. 금은 소폭만 (정답처럼 보이지 않게).
  'both-down': {
    KR_STOCK: [
      [0, 1],
      [0.5, 0.88],
      [1, 0.82],
    ],
    US_STOCK: [
      [0, 1],
      [0.5, 0.85],
      [1, 0.8],
    ],
    INTL_STOCK: [
      [0, 1],
      [0.5, 0.86],
      [1, 0.81],
    ],
    BOND: [
      [0, 1],
      [0.5, 0.92],
      [1, 0.88],
    ],
    GOLD_COMM: [
      [0, 1],
      [1, 1.06],
    ],
    REIT_INFRA: [
      [0, 1],
      [1, 0.84],
    ],
  },
  // 1년 후에도 빨간 — 주식은 끝에도 시작 아래. 채권·금은 방어.
  'still-red': {
    KR_STOCK: [
      [0, 1],
      [0.25, 0.55],
      [1, 0.72],
    ],
    US_STOCK: [
      [0, 1],
      [0.25, 0.52],
      [1, 0.7],
    ],
    INTL_STOCK: [
      [0, 1],
      [0.3, 0.58],
      [1, 0.74],
    ],
    BOND: [
      [0, 1],
      [0.3, 1.06],
      [1, 1.1],
    ],
    GOLD_COMM: [
      [0, 1],
      [0.3, 1.12],
      [1, 1.14],
    ],
    REIT_INFRA: [
      [0, 1],
      [0.25, 0.5],
      [1, 0.62],
    ],
  },
};

const cache = new Map<DrillScenarioId, DrillSeries>();

export function drillSeries(id: DrillScenarioId): DrillSeries {
  const hit = cache.get(id);
  if (hit) return hit;

  const sc = DRILL_SCENARIOS.find((s) => s.id === id);
  if (!sc) throw new Error(`unknown drill scenario: ${id}`);
  const dates = weekdaysInclusive(sc.fromDate, sc.toDate);
  const n = dates.length;
  const byTheme: Record<ThemeCode, number[]> = {
    KR_STOCK: path(n, PATHS[id].KR_STOCK),
    US_STOCK: path(n, PATHS[id].US_STOCK),
    INTL_STOCK: path(n, PATHS[id].INTL_STOCK),
    BOND: path(n, PATHS[id].BOND),
    GOLD_COMM: path(n, PATHS[id].GOLD_COMM),
    REIT_INFRA: path(n, PATHS[id].REIT_INFRA),
  };

  // 하위 테마는 대표지수보다 «뾰족하다». 같은 전선 안이라 방향은 같고 진폭만 커진다.
  // ★ 이걸 안 하면 하위 테마를 나눈 편성과 지수 추종 편성의 결과가 «완전히 같게» 나와,
  //   runDrill(details) 가 하지 않는 일을 약속하게 된다. 진폭 차이가 있어야
  //   「같은 전선을 넓히는 분산」과 「다른 전선을 여는 분산」의 차이가 숫자로 드러난다
  //   (DESIGN-DECISIONS §4 — scripts/generate-prices.ts 의 THEME_DD_MULT 와 같은 취지).
  const series: Record<string, number[]> = {};
  for (const t of TICKERS as TickerSeed[]) {
    if (t.kind === 'INDEX') {
      series[t.ticker] = byTheme[t.theme];
      continue;
    }
    const mult = themeAmplitude(t.ticker);
    series[t.ticker] = path(
      n,
      PATHS[id][t.theme].map(([at, m]) => [at, 1 + (m - 1) * mult] as const),
    );
  }

  const built = { dates, series };
  cache.set(id, built);
  return built;
}

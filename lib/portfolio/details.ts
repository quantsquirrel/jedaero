// 하위 테마 배치 (자유도 3단계 — DESIGN-DECISIONS §3·§11-A)
// ★ 포인트는 쪼개지지 않는 병력 단위다. 상위 전선에 놓은 포인트를 그 안에서 다시 나눈다.
//   상위 3포인트면 하위에도 정확히 3포인트가 놓여야 한다. 늘어나지도 줄어들지도 않는다.
// ★ 1포인트만 놓인 전선은 나눌 수 없다. 집중의 물리적 한계를 규칙이 아니라 산수가 가르친다.
// ★ 기본값은 「대표지수 추종」이다 — details가 비면 엔진이 대표지수 100%로 전개한다.
import { REPRESENTATIVE, SUB_THEMES, TICKERS } from '../../db/seed/tickers';
import { POINT_UNIT, THEMES, THEME_CODES, type ThemeCode, type Weights } from '../constants';

/** { 전선: { 지수코드: 포인트 } }. 엔진은 이 값을 상대 비중으로 정규화한다 */
export type Details = Record<string, Record<string, number>>;

const NAME_OF = new Map(TICKERS.map((t) => [t.ticker, t.name]));

export type SubRow = { ticker: string; name: string; isIndex: boolean };

/** 하위 조정 UI가 보여줄 행: 대표지수 + 하위 테마.
 *  대표지수를 목록에서 빼지 않는다 — 「일부만 테마로 빼고 나머지는 지수 추종」이 가장 흔한 선택이다. */
export function subRowsOf(code: ThemeCode): SubRow[] {
  const rep = REPRESENTATIVE[code];
  return [
    { ticker: rep, name: NAME_OF.get(rep) ?? rep, isIndex: true },
    ...SUB_THEMES[code].map((t) => ({ ticker: t.ticker, name: t.name, isIndex: false })),
  ];
}

/** 하위 조정을 여는 전선인가. 데이터는 전 전선에 있고 지금은 UI만 두 전선에 연다 */
export function isDetailOpen(code: ThemeCode): boolean {
  return THEMES.find((t) => t.code === code)?.detailAdjustable === true;
}

export function frontPoints(weights: Weights, code: ThemeCode): number {
  return Math.round((weights[code] ?? 0) / POINT_UNIT);
}

export function placedSubPoints(details: Details, code: ThemeCode): number {
  return Object.values(details[code] ?? {}).reduce((a, b) => a + b, 0);
}

/** 하위 1포인트 조정. 상위에 놓인 포인트를 초과할 수 없다 */
export function adjustDetail(
  details: Details,
  weights: Weights,
  code: ThemeCode,
  ticker: string,
  delta: 1 | -1,
): Details {
  const cur = details[code] ?? {};
  const at = cur[ticker] ?? 0;
  const next = at + delta;
  if (next < 0) return details;
  if (delta > 0 && placedSubPoints(details, code) >= frontPoints(weights, code)) return details;

  const updated = { ...cur, [ticker]: next };
  if (next === 0) delete updated[ticker];
  return { ...details, [code]: updated };
}

/** 상위 포인트가 바뀐 전선의 하위 배치를 버린다.
 *  ★ 자동으로 비례 재조정하지 않는다 — 사용자가 자기 선택을 인지하지 못하게 만드는 안티패턴이다.
 *  대신 대표지수 추종(기본값)으로 되돌리고 화면에서 그 사실을 알린다. */
export function dropStaleDetails(details: Details, weights: Weights): { details: Details; dropped: ThemeCode[] } {
  const out: Details = {};
  const dropped: ThemeCode[] = [];
  for (const code of THEME_CODES) {
    const sub = details[code];
    if (!sub || Object.keys(sub).length === 0) continue;
    if (placedSubPoints(details, code) === frontPoints(weights, code)) out[code] = sub;
    else dropped.push(code);
  }
  return { details: out, dropped };
}

/** 저장 전 최종 검증. 서버에서도 같은 함수를 쓴다 (클라이언트 값을 믿지 않는다) */
export function isValidDetails(details: unknown, weights: Weights): details is Details {
  if (details == null) return true;
  if (typeof details !== 'object') return false;
  const obj = details as Record<string, unknown>;

  for (const [code, sub] of Object.entries(obj)) {
    if (!THEME_CODES.includes(code as ThemeCode)) return false;
    if (!isDetailOpen(code as ThemeCode)) return false; // 열지 않은 전선의 하위 값은 받지 않는다
    if (!sub || typeof sub !== 'object') return false;

    const allowed = new Set(subRowsOf(code as ThemeCode).map((r) => r.ticker));
    let sum = 0;
    for (const [ticker, v] of Object.entries(sub as Record<string, unknown>)) {
      if (!allowed.has(ticker)) return false;
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) return false;
      sum += v;
    }
    if (sum === 0) continue; // 빈 전선은 대표지수 추종과 같다
    if (sum !== frontPoints(weights, code as ThemeCode)) return false;
  }
  return true;
}

/** 저장용으로 정리 — 빈 전선을 지우고, 전부 비면 null을 돌려 「지수추종」임을 명시한다 */
export function normalizeDetails(details: Details): Details | null {
  const out: Details = {};
  for (const [code, sub] of Object.entries(details)) {
    const entries = Object.entries(sub).filter(([, v]) => v > 0);
    if (entries.length > 0) out[code] = Object.fromEntries(entries);
  }
  return Object.keys(out).length > 0 ? out : null;
}

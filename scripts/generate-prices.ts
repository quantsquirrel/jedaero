// 가격 시드 생성기 (docs/SEED.md §3)
// - GBM(기하 브라운 운동) + 지정 구간 드로다운 주입
// - 결정론적: 시드 고정 → 재실행해도 같은 데이터. 런타임 생성 금지 (산출물 db/seed/prices.ts 커밋)
// - 교육용 합성 더미 시세. 실제 시세와 무관
// - 구간: 2025-09-01 ~ 2026-09-30 영업일. 심사 기간(2026-09-07~11) 중 "다음 거래일" 체결이
//   성립해야 하므로 기간 끝을 9월 말까지 늘렸다. 화면 조회는 서버 기준 오늘까지로 클램프한다.
// - P0-11: 주식 3전선(KR_STOCK·US_STOCK·INTL_STOCK)과 REIT_INFRA 대표지수는 고점 대비 -15% 이상.
// - ★ 하락 구간에서 전선들이 같이 빠지면 안 된다 (DESIGN-DECISIONS §4).
//   BOND는 얕게, GOLD_COMM은 오히려 오른다. 이 차이가 없으면 리밸런싱을 가르칠 재료가 사라지고
//   학습 카드 「분산이 무엇을 줄이는가」가 사실상 거짓말이 된다.
// - 하위 테마는 대표지수보다 변동성·낙폭이 크다. 「같은 전선을 넓히는 분산」의 한계를 데이터로 보여준다.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TICKERS, REPRESENTATIVE, type TickerSeed } from '../db/seed/tickers';
import { HOLIDAYS_KR } from '../db/seed/holidays';
import type { ThemeCode } from '../lib/constants';

const GLOBAL_SEED = 20260907;
const RANGE_START = '2025-09-01';
const RANGE_END = '2026-09-30';

// 영업일 계산용 2025년 하반기 공휴일 (DB 시드는 2026~27만, 여기서만 내부 사용)
const HOLIDAYS_2025_H2 = [
  '2025-10-03', // 개천절
  '2025-10-06', // 추석
  '2025-10-07', // 추석 연휴
  '2025-10-08', // 추석 대체공휴일
  '2025-10-09', // 한글날
  '2025-12-25', // 성탄절
];
const HOLIDAY_SET = new Set([...HOLIDAYS_2025_H2, ...HOLIDAYS_KR.map((h) => h.date)]);

// 전선별 파라미터: 연간 변동성 / 연간 드리프트 / 위기 구간 주입치
// dd < 0 = 그 구간에 하락, dd > 0 = 그 구간에 상승(안전자산 수요). 이후 구간에서 55%를 되돌린다.
const AXIS: Record<ThemeCode, { vol: number; mu: number; dd: number }> = {
  KR_STOCK: { vol: 0.2, mu: 0.1, dd: -0.2 },
  US_STOCK: { vol: 0.18, mu: 0.13, dd: -0.18 },
  INTL_STOCK: { vol: 0.19, mu: 0.09, dd: -0.19 },
  BOND: { vol: 0.05, mu: 0.03, dd: -0.04 },
  GOLD_COMM: { vol: 0.16, mu: 0.05, dd: 0.12 },
  REIT_INFRA: { vol: 0.21, mu: 0.09, dd: -0.22 },
};

// 하위 테마는 대표지수보다 뾰족하다. 섹터 하나는 그 시장 전체보다 항상 더 흔들린다.
const THEME_VOL_MULT = 1.4;
const THEME_DD_MULT = 1.35;

// 전선 파라미터로 설명되지 않는 하위 테마만 개별 지정한다.
// 금·원자재 전선은 안에서 성격이 갈린다 — 금·은은 안전자산, 원유·농산물은 경기민감이다.
// 이 갈림이 「같은 전선 안의 분산」과 「다른 전선을 여는 분산」의 차이를 보여주는 재료가 된다.
const OVERRIDE: Record<string, Partial<{ vol: number; mu: number; dd: number }>> = {
  'CM-GOLD': { vol: 0.15, mu: 0.06, dd: 0.18 },
  'CM-SILV': { vol: 0.26, mu: 0.05, dd: 0.14 },
  'CM-OIL': { vol: 0.32, mu: 0.02, dd: -0.24 },
  'CM-AGRI': { vol: 0.18, mu: 0.03, dd: -0.06 },
  'BD-UST': { vol: 0.07, mu: 0.03, dd: 0.05 },
  'BD-CORP': { vol: 0.08, mu: 0.04, dd: -0.09 },
  'BD-KTB10': { vol: 0.08, mu: 0.03, dd: -0.02 },
  'BD-KTB3': { vol: 0.03, mu: 0.03, dd: -0.01 },
};

function paramsOf(t: TickerSeed): { vol: number; mu: number; dd: number } {
  const base = AXIS[t.theme];
  const scaled =
    t.kind === 'THEME'
      ? { vol: base.vol * THEME_VOL_MULT, mu: base.mu, dd: base.dd * THEME_DD_MULT }
      : { ...base };
  return { ...scaled, ...OVERRIDE[t.ticker] };
}

// 시작가 = 지수 포인트(표시용 합성값). 절대 수준은 의미가 없고 비율만 쓴다.
const BASE_PRICE: Record<string, number> = {
  'KR-IDX': 2500, 'KR-SEMI': 3800, 'KR-BATT': 2100, 'KR-BIO': 3200,
  'KR-FIN': 1400, 'KR-INDU': 1900, 'KR-AUTO': 2200, 'KR-NET': 1700,
  'US-IDX': 5600, 'US-TECH': 8200, 'US-SEMI': 6400, 'US-HLTH': 3100,
  'US-FIN': 2700, 'US-CONS': 2300, 'US-ENGY': 1800, 'US-DIV': 2900,
  'IN-IDX': 1200, 'IN-JP': 3900, 'IN-EU': 2600, 'IN-CN': 3400, 'IN-IN': 2800,
  'BD-IDX': 1050, 'BD-KTB3': 1020, 'BD-KTB10': 1080, 'BD-CORP': 1060, 'BD-UST': 1100,
  'CM-IDX': 1500, 'CM-GOLD': 2400, 'CM-SILV': 1600, 'CM-OIL': 900, 'CM-AGRI': 1100,
  'RE-IDX': 1300, 'RE-KR': 1150, 'RE-US': 1400, 'RE-DC': 1750,
};

// ---- 결정론적 난수 ----
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---- 영업일 목록 ----
function businessDays(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const d = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  while (d.getTime() <= end.getTime()) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6 && !HOLIDAY_SET.has(iso)) out.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const DATES = businessDays(RANGE_START, RANGE_END);
const N = DATES.length;
// 드로다운: 전체 구간의 45% 지점에서 시작, 6주(30영업일) 하락 → 10주(50영업일) 부분 회복
const DECLINE_START = Math.floor(N * 0.45);
const DECLINE_DAYS = 30;
const RECOVERY_DAYS = 50;
// 되돌림 비율. ★ 방어형 작전이 수익률·낙폭 두 축 모두에서 나머지를 지배하면
// 예시 5종이 사실상 추천이 된다 (§11-B 균형 규칙 / C10). 회복이 얕을수록 방어형이 이긴다.
// 0.8이면 「부분 회복」 조건(§3-2)과 -15% 폭락 구간은 그대로 두면서 그 쏠림이 풀린다.
const RECOVERY_RATIO = 0.8;

function genSeries(t: TickerSeed, attempt: number): number[] {
  const p = paramsOf(t);
  const rng = mulberry32((fnv1a(t.ticker) ^ GLOBAL_SEED) + attempt * 97);
  const volJitter = 0.9 + 0.2 * rng(); // 종목별 변동성 ±10%
  const ddJitter = 1 + 0.15 * rng(); // 위기 주입은 커지는 쪽으로만 지터
  const vol = (p.vol * volJitter) / Math.sqrt(252);
  const drift = (p.mu - (p.vol * volJitter) ** 2 / 2) / 252;
  const crisisPerDay = (Math.log(1 + p.dd) * ddJitter) / DECLINE_DAYS;
  const reversionPerDay = (-Math.log(1 + p.dd) * ddJitter * RECOVERY_RATIO) / RECOVERY_DAYS;

  let logP = Math.log(BASE_PRICE[t.ticker]);
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    if (i > 0) {
      let inj = 0;
      if (i >= DECLINE_START && i < DECLINE_START + DECLINE_DAYS) inj = crisisPerDay;
      else if (i >= DECLINE_START + DECLINE_DAYS && i < DECLINE_START + DECLINE_DAYS + RECOVERY_DAYS)
        inj = reversionPerDay;
      logP += drift + vol * gauss(rng) + inj;
    }
    out.push(Math.max(1, Math.round(Math.exp(logP))));
  }
  return out;
}

function maxDrawdown(series: number[]): number {
  let peak = -Infinity;
  let mdd = 0;
  for (const v of series) {
    if (v > peak) peak = v;
    mdd = Math.min(mdd, v / peak - 1);
  }
  return mdd;
}

/** 위기 구간(하락 30영업일) 동안의 수익률. 안전자산은 여기가 양수여야 한다 */
function crisisReturn(series: number[]): number {
  const a = series[DECLINE_START];
  const b = series[Math.min(N - 1, DECLINE_START + DECLINE_DAYS)];
  return b / a - 1;
}

// 대표지수 제약 (P0-11 + §4 저상관 요건)
// - 주식 3전선과 리츠는 -15%를 확실히 넘겨 폭락 구간을 만든다
// - 채권은 얕게, 금·원자재는 오른다. 여섯 전선이 같이 빨간색이 되면 안 된다
type RepRule = { mdd?: [number, number]; crisisMin?: number };
const REP_RULE: Record<ThemeCode, RepRule> = {
  KR_STOCK: { mdd: [-0.3, -0.17] },
  US_STOCK: { mdd: [-0.28, -0.16] },
  INTL_STOCK: { mdd: [-0.29, -0.16] },
  REIT_INFRA: { mdd: [-0.33, -0.18] },
  BOND: { mdd: [-0.08, -0.005] },
  GOLD_COMM: { crisisMin: 0.06 },
};

function repOk(theme: ThemeCode, series: number[]): boolean {
  const rule = REP_RULE[theme];
  const mdd = maxDrawdown(series);
  if (rule.mdd && (mdd < rule.mdd[0] || mdd > rule.mdd[1])) return false;
  if (rule.crisisMin !== undefined && crisisReturn(series) < rule.crisisMin) return false;
  if (rule.mdd) {
    // 저점 이후 회복이 있어야 리밸런싱을 가르칠 수 있다. 채권은 애초에 낙폭이 얕아 면제
    const trough = Math.min(...series.slice(DECLINE_START, DECLINE_START + DECLINE_DAYS + 5));
    const afterRecovery = series[Math.min(N - 1, DECLINE_START + DECLINE_DAYS + RECOVERY_DAYS)];
    if (theme !== 'BOND' && afterRecovery <= trough * 1.03) return false;
  }
  return true;
}

const series: Record<string, number[]> = {};
const summary: string[] = [];
for (const t of TICKERS) {
  const isRep = REPRESENTATIVE[t.theme] === t.ticker;
  let s = genSeries(t, 0);
  if (isRep) {
    let attempt = 0;
    while (!repOk(t.theme, s) && attempt < 400) {
      attempt += 1;
      s = genSeries(t, attempt);
    }
    if (!repOk(t.theme, s)) {
      throw new Error(
        `대표지수 제약 실패: ${t.ticker} (${t.theme}) mdd=${maxDrawdown(s).toFixed(4)} 위기구간=${crisisReturn(s).toFixed(4)}`,
      );
    }
  }
  series[t.ticker] = s;
  if (isRep) {
    summary.push(
      `${t.theme.padEnd(11)} ${t.ticker.padEnd(7)} MDD ${(maxDrawdown(s) * 100).toFixed(1).padStart(6)}%  위기구간 ${(crisisReturn(s) * 100).toFixed(1).padStart(6)}%`,
    );
  }
}

const header = `// ⚠️ 자동 생성 파일 — \`npm run prices\`(scripts/generate-prices.ts)가 만든다. 직접 수정 금지.
// 교육용 합성 더미 시세이며 실제 시세와 무관하다. 결정론적 시드(${GLOBAL_SEED})로 생성됨.
// 구간 ${RANGE_START} ~ ${RANGE_END} 영업일 ${N}일 × ${TICKERS.length}개 지수.
`;
const body =
  `export const PRICE_DATES: string[] = ${JSON.stringify(DATES)};\n\n` +
  `export const PRICE_SERIES: Record<string, number[]> = {\n` +
  TICKERS.map((t) => `  '${t.ticker}': ${JSON.stringify(series[t.ticker])},`).join('\n') +
  `\n};\n`;

const outPath = join(dirname(fileURLToPath(import.meta.url)), '../db/seed/prices.ts');
writeFileSync(outPath, header + body);

console.log(`영업일 ${N}일 (${DATES[0]} ~ ${DATES[N - 1]}), 지수 ${TICKERS.length}개 → db/seed/prices.ts`);
console.log('대표지수 최대낙폭(MDD)과 위기 구간 수익률:');
for (const line of summary) console.log('  ' + line);

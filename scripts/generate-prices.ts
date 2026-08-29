// 가격 시드 생성기 (docs/SEED.md §3)
// - GBM(기하 브라운 운동) + 지정 구간 드로다운 주입
// - 결정론적: 시드 고정 → 재실행해도 같은 데이터. 런타임 생성 금지 (산출물 db/seed/prices.ts 커밋)
// - 교육용 합성 더미 시세. 실제 시세와 무관
// - 구간: 2025-09-01 ~ 2026-09-30 영업일. 심사 기간(2026-09-07~11) 중 "다음 거래일" 체결이
//   성립해야 하므로 기간 끝을 9월 말까지 늘렸다. 화면 조회는 서버 기준 오늘까지로 클램프한다.
// - P0-11(합의안): 위험 4축(KR_LARGE·KR_THEME·US_INDEX·GOLD_COMM) 대표 종목 고점 대비 -15% 이상,
//   BOND_CASH 대표는 -8% 이내의 얕은 하락. DIVIDEND는 약 -11% (변동성 비례 규칙 유지)
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TICKERS, REPRESENTATIVE } from '../db/seed/tickers';
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

// 축별 파라미터: 연간 변동성 / 연간 드리프트 / 드로다운 목표 (변동성에 비례)
const AXIS: Record<ThemeCode, { vol: number; mu: number; dd: number }> = {
  BOND_CASH: { vol: 0.03, mu: 0.03, dd: -0.03 },
  DIVIDEND: { vol: 0.12, mu: 0.06, dd: -0.11 },
  KR_LARGE: { vol: 0.18, mu: 0.08, dd: -0.18 },
  US_INDEX: { vol: 0.18, mu: 0.1, dd: -0.18 },
  GOLD_COMM: { vol: 0.2, mu: 0.07, dd: -0.19 },
  KR_THEME: { vol: 0.32, mu: 0.12, dd: -0.3 },
};

// 시작가 (원 단위, 표시용 합성값)
const BASE_PRICE: Record<string, number> = {
  '005930': 71000, '000660': 195000, '005380': 245000, '207940': 830000, '373220': 385000, '069500': 36500,
  '091160': 12800, '305540': 9800, '244580': 8900, '091180': 21500, '139230': 4300, '227540': 31000,
  '360750': 17800, '379810': 13900, '381180': 12400, '133690': 98500, '143850': 52000,
  '157450': 105200, '114260': 59800, '439870': 1052000, '152380': 118500, '130730': 102400,
  '132030': 15200, '319640': 14800, '130680': 4200, '261220': 17900,
  '211560': 45200, '279530': 12600, '161510': 13900, '104530': 10400,
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
const RECOVERY_RATIO = 0.55; // 로그 기준 하락분의 55%를 회복

function genSeries(ticker: string, theme: ThemeCode, attempt: number): number[] {
  const p = AXIS[theme];
  const rng = mulberry32((fnv1a(ticker) ^ GLOBAL_SEED) + attempt * 97);
  const volJitter = 0.9 + 0.2 * rng(); // 종목별 변동성 ±10%
  const ddJitter = 1 + 0.15 * rng(); // 드로다운은 깊어지는 쪽으로만 지터
  const vol = (p.vol * volJitter) / Math.sqrt(252);
  const drift = (p.mu - (p.vol * volJitter) ** 2 / 2) / 252;
  const declinePerDay = (Math.log(1 + p.dd) * ddJitter) / DECLINE_DAYS;
  const recoveryPerDay = (-Math.log(1 + p.dd) * ddJitter * RECOVERY_RATIO) / RECOVERY_DAYS;

  let logP = Math.log(BASE_PRICE[ticker]);
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    if (i > 0) {
      let inj = 0;
      if (i >= DECLINE_START && i < DECLINE_START + DECLINE_DAYS) inj = declinePerDay;
      else if (i >= DECLINE_START + DECLINE_DAYS && i < DECLINE_START + DECLINE_DAYS + RECOVERY_DAYS)
        inj = recoveryPerDay;
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

// 대표 종목 제약: 축 변동성에 비례하는 낙폭 밴드 + 위험 4축은 -15%를 확실히 넘김 + 회복 확인
// (P0-11 합의안: KR_LARGE·KR_THEME·US_INDEX·GOLD_COMM ≤ -15%, BOND_CASH는 얕게)
const DD_BAND: Record<ThemeCode, [number, number]> = {
  KR_THEME: [-0.42, -0.28],
  GOLD_COMM: [-0.28, -0.17],
  KR_LARGE: [-0.26, -0.16],
  US_INDEX: [-0.26, -0.16],
  DIVIDEND: [-0.16, -0.08],
  BOND_CASH: [-0.07, -0.01],
};
function repOk(theme: ThemeCode, series: number[]): boolean {
  const mdd = maxDrawdown(series);
  const [lo, hi] = DD_BAND[theme];
  if (mdd < lo || mdd > hi) return false;
  const trough = Math.min(...series.slice(DECLINE_START, DECLINE_START + DECLINE_DAYS + 5));
  const afterRecovery = series[Math.min(N - 1, DECLINE_START + DECLINE_DAYS + RECOVERY_DAYS)];
  return theme === 'BOND_CASH' || afterRecovery > trough * 1.03;
}

const series: Record<string, number[]> = {};
const summary: string[] = [];
for (const t of TICKERS) {
  const isRep = REPRESENTATIVE[t.theme] === t.ticker;
  let s = genSeries(t.ticker, t.theme, 0);
  if (isRep) {
    let attempt = 0;
    while (!repOk(t.theme, s) && attempt < 200) {
      attempt += 1;
      s = genSeries(t.ticker, t.theme, attempt);
    }
    if (!repOk(t.theme, s)) {
      throw new Error(`대표 종목 제약 실패: ${t.ticker} (${t.theme}) mdd=${maxDrawdown(s).toFixed(4)}`);
    }
  }
  series[t.ticker] = s;
  if (isRep) summary.push(`${t.theme.padEnd(9)} ${t.ticker} MDD ${(maxDrawdown(s) * 100).toFixed(1)}%`);
}

const header = `// ⚠️ 자동 생성 파일 — \`npm run prices\`(scripts/generate-prices.ts)가 만든다. 직접 수정 금지.
// 교육용 합성 더미 시세이며 실제 시세와 무관하다. 결정론적 시드(${GLOBAL_SEED})로 생성됨.
// 구간 ${RANGE_START} ~ ${RANGE_END} 영업일 ${N}일 × ${TICKERS.length}종목.
`;
const body =
  `export const PRICE_DATES: string[] = ${JSON.stringify(DATES)};\n\n` +
  `export const PRICE_SERIES: Record<string, number[]> = {\n` +
  TICKERS.map((t) => `  '${t.ticker}': ${JSON.stringify(series[t.ticker])},`).join('\n') +
  `\n};\n`;

const outPath = join(dirname(fileURLToPath(import.meta.url)), '../db/seed/prices.ts');
writeFileSync(outPath, header + body);

console.log(`영업일 ${N}일 (${DATES[0]} ~ ${DATES[N - 1]}), 종목 ${TICKERS.length}개 → db/seed/prices.ts`);
console.log('대표 종목 최대낙폭(MDD):');
for (const line of summary) console.log('  ' + line);

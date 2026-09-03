// DB 시드 적재 (멱등). 실행: npm run seed
// tickers·holidays·settings는 upsert, prices는 전체 교체.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { inArray, sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { TICKERS } from '../db/seed/tickers';
import { HOLIDAYS_KR } from '../db/seed/holidays';
import { PRICE_DATES, PRICE_SERIES } from '../db/seed/prices';
import { THEME_CODES, type Weights } from '../lib/constants';
import { addDays, mondayOfWeeksAgo, weekOfDateStr } from '../lib/week';

try {
  process.loadEnvFile('.env.local');
} catch {
  // 셸 환경변수 사용
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL이 없습니다 (.env.local 또는 환경변수).');
  process.exit(1);
}
const db = drizzle(neon(url), { schema });

async function main() {
  await db
    .insert(schema.tickers)
    .values(TICKERS.map((t) => ({ ticker: t.ticker, name: t.name, theme: t.theme, kind: t.kind })))
    .onConflictDoUpdate({
      target: schema.tickers.ticker,
      set: { name: sql`excluded.name`, theme: sql`excluded.theme`, kind: sql`excluded.kind` },
    });


  await db
    .insert(schema.holidays)
    .values(HOLIDAYS_KR.map((h) => ({ holidayDate: h.date, name: h.name })))
    .onConflictDoUpdate({ target: schema.holidays.holidayDate, set: { name: sql`excluded.name` } });

  // 킬스위치 기본값. 이미 있으면 건드리지 않는다 (관리자가 끈 상태 보존)
  await db
    .insert(schema.settings)
    .values({ key: 'ai_enabled', value: 'true' })
    .onConflictDoNothing();

  // prices 전체 교체
  const rows: { ticker: string; tradeDate: string; close: number }[] = [];
  for (const [ticker, series] of Object.entries(PRICE_SERIES)) {
    for (let i = 0; i < PRICE_DATES.length; i++) {
      rows.push({ ticker, tradeDate: PRICE_DATES[i], close: series[i] });
    }
  }
  await db.delete(schema.prices);
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(schema.prices).values(rows.slice(i, i + CHUNK));
  }

  console.log(
    `시드 완료: tickers ${TICKERS.length}, holidays ${HOLIDAYS_KR.length}, prices ${rows.length} (${PRICE_DATES[0]} ~ ${PRICE_DATES[PRICE_DATES.length - 1]})`,
  );

  await seedDummyUsers();
}

// ---- 리그·성향분석용 더미 사용자 200명 (SPEC §7) ----
// 합성 분포·결정론적(시드 고정)·멱등(고정 UUID upsert). 닉네임은 실명처럼 보이지 않게.
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

const DUMMY_COUNT = 200;
const dummyId = (i: number) => `00000000-0000-4000-8000-${String(100000000000 + i)}`;
const NICKS = ['해뜰날', '강철비', '초코우유', '별헤는밤', '든든적금', '월급지킴이', '산바람', '바다안개', '새벽별', '고요아침', '달빛산책', '구름과자'];

// 포인트 20개를 무작위로 놓는다. 일부는 다 놓지 않아 예비대가 남는다 —
// 전원이 100%를 채우면 「예비대」 코호트 중앙값이 항상 0이 되어 비교 화면이 무의미해진다.
function randomWeights(rng: () => number): Weights {
  const w = Object.fromEntries(THEME_CODES.map((c) => [c, 0])) as Weights;
  const place = rng() < 0.3 ? 16 + Math.floor(rng() * 4) : 20; // 30%는 예비대를 남긴다
  for (let b = 0; b < place; b++) {
    const c = THEME_CODES[Math.floor(rng() * THEME_CODES.length)];
    w[c] += 5;
  }
  return w;
}

// 1포인트를 다른 전선으로 옮긴다. 합계는 그대로이므로 예비대도 그대로다.
function shiftWeights(rng: () => number, base: Weights): Weights {
  const w = { ...base };
  const from = THEME_CODES.filter((c) => w[c] >= 5);
  if (from.length === 0) return w;
  const a = from[Math.floor(rng() * from.length)];
  const b = THEME_CODES[Math.floor(rng() * THEME_CODES.length)];
  if (a !== b) {
    w[a] -= 5;
    w[b] += 5;
  }
  return w;
}

async function seedDummyUsers() {
  const rng = mulberry32(20260907);
  const now = new Date();
  const todayK = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

  // 전역 예정월: 60명은 (오늘+120일)의 달, 60명은 그 다음 달 — 데모 유저의 코호트가
  // 심사 기간 중 어느 날 만들어져도 n>=20이 성립하게 양쪽을 채운다. 나머지는 분산.
  const demoMonthA = addDays(todayK, 120).slice(0, 7);
  const demoMonthB = addDays(todayK, 150).slice(0, 7);

  const userRows = [];
  const allocRows = [];
  const scoreRows = [];
  const ranks = ['PRIVATE', 'PFC', 'CORPORAL', 'SERGEANT'];
  const branches = ['ARMY', 'NAVY', 'AIRFORCE', 'MARINE'];
  const distances = ['NEAR', 'MID', 'FAR', 'ISLAND'];

  for (let i = 0; i < DUMMY_COUNT; i++) {
    const id = dummyId(i);
    let dischargeMonth: string;
    if (i < 60) dischargeMonth = demoMonthA;
    else if (i < 120) dischargeMonth = demoMonthB;
    else dischargeMonth = addDays(todayK, 60 + Math.floor(rng() * 400)).slice(0, 7);
    const dischargeAt = `${dischargeMonth}-${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}`;

    userRows.push({
      id,
      nickname: `${NICKS[Math.floor(rng() * NICKS.length)]}${10 + Math.floor(rng() * 90)}`,
      rank: ranks[Math.floor(rng() * ranks.length)],
      branch: branches[Math.floor(rng() * branches.length)],
      enlistedAt: addDays(dischargeAt, -548),
      dischargeAt,
      homeDistance: distances[Math.floor(rng() * distances.length)],
      analyticsOptIn: i < 150, // 150명 동의 — AI-7 코호트 분포용
    });

    // 최근 3주 배분 이력 (회전율·비중 분포용)
    let w = randomWeights(rng);
    for (let ago = 3; ago >= 1; ago--) {
      if (ago < 3 && rng() < 0.7) w = shiftWeights(rng, w);
      const monday = mondayOfWeeksAgo(now, ago);
      allocRows.push({
        userId: id,
        weekOf: weekOfDateStr(monday),
        weights: w,
        details: null,
        templateId: null,
        decidedAt: new Date(`${addDays(monday, 6)}T11:00:00Z`),
        effectiveFrom: addDays(monday, 7),
      });
    }

    // 이번 주 포함 4주치 주간 점수 (심사 기간 커버)
    for (let off = -1; off <= 2; off++) {
      scoreRows.push({
        userId: id,
        weekOf: weekOfDateStr(mondayOfWeeksAgo(now, -off)),
        ...(() => {
          const grown = Math.round(rng() * 40 * 10) / 10;
          const spread = Math.round((10 + rng() * 20) * 10) / 10;
          const held = Math.round((12 + rng() * 18) * 10) / 10;
          return { grown, spread, held, total: Math.round((grown + spread + held) * 10) / 10 };
        })(),
      });
    }
  }

  const CHUNK = 500;
  for (let i = 0; i < userRows.length; i += CHUNK) {
    await db.insert(schema.users).values(userRows.slice(i, i + CHUNK)).onConflictDoNothing();
  }
  for (let i = 0; i < allocRows.length; i += CHUNK) {
    await db.insert(schema.allocations).values(allocRows.slice(i, i + CHUNK)).onConflictDoNothing();
  }
  const ids = userRows.map((u) => u.id);
  await db.delete(schema.weeklyScores).where(inArray(schema.weeklyScores.userId, ids));
  for (let i = 0; i < scoreRows.length; i += CHUNK) {
    await db.insert(schema.weeklyScores).values(scoreRows.slice(i, i + CHUNK));
  }
  console.log(`더미 사용자 ${DUMMY_COUNT}명 (동의 150) · 배분 ${allocRows.length} · 주간점수 ${scoreRows.length}`);
}

main().catch((e) => {
  console.error('시드 실패:', e);
  process.exit(1);
});

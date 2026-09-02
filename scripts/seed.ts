// DB 시드 적재 (멱등). 실행: npm run seed
// tickers·quests·holidays·settings는 upsert, prices와 더미 사용자는 전체 교체.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray, sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { TICKERS } from '../db/seed/tickers';
import { QUESTS } from '../db/seed/quests';
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
    .insert(schema.quests)
    .values(QUESTS.map((q) => ({ code: q.code, title: q.title, description: q.description, xp: q.xp, badge: q.badge })))
    .onConflictDoUpdate({
      target: schema.quests.code,
      set: {
        title: sql`excluded.title`,
        description: sql`excluded.description`,
        xp: sql`excluded.xp`,
        badge: sql`excluded.badge`,
      },
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
    `시드 완료: tickers ${TICKERS.length}, quests ${QUESTS.length}, holidays ${HOLIDAYS_KR.length}, prices ${rows.length} (${PRICE_DATES[0]} ~ ${PRICE_DATES[PRICE_DATES.length - 1]})`,
  );

  await seedDummyUsers();
}

// ---- 리그·성향분석용 더미 사용자 200명 (SPEC §7) ----
// 합성 분포·결정론적(시드 고정). 닉네임은 실명처럼 보이지 않게.
// ★ users.id는 서명 없는 익명 쿠키 값 그대로가 세션 자격증명이다 (lib/session.ts).
//   규칙적인 UUID를 코드에 박아 두면 그 계정 세션을 누구나 그대로 재현할 수 있으므로,
//   더미 ID는 실행할 때마다 난수로 만든다. 고정 UUID upsert로 얻던 멱등성은
//   "생성한 ID 목록을 settings에 남기고 → 다음 실행에서 지우고 다시 심는" 방식으로 대신한다.
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
const DUMMY_IDS_KEY = 'seed_dummy_user_ids';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// 순번 UUID로 심었던 구버전 더미. 이미 적재된 DB에 남아 있으면 그 세션이 그대로 열려 있으므로 걷어낸다.
const LEGACY_DUMMY_IDS = Array.from(
  { length: DUMMY_COUNT },
  (_, i) => `00000000-0000-4000-8000-${String(100000000000 + i)}`,
);
const NICKS = ['해뜰날', '강철비', '초코우유', '별헤는밤', '든든적금', '월급지킴이', '산바람', '바다안개', '새벽별', '고요아침', '달빛산책', '구름과자'];

function randomWeights(rng: () => number): Weights {
  const w = Object.fromEntries(THEME_CODES.map((c) => [c, 0])) as Weights;
  for (let b = 0; b < 20; b++) {
    const c = THEME_CODES[Math.floor(rng() * THEME_CODES.length)];
    w[c] += 5;
  }
  return w;
}

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

// 지난 실행이 심어 둔 더미 ID 목록. 값이 깨져 있으면 정리를 건너뛰지 않고 형식이 맞는 것만 쓴다.
async function storedDummyIds(): Promise<string[]> {
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, DUMMY_IDS_KEY)).limit(1);
  if (!rows[0]) return [];
  try {
    const parsed: unknown = JSON.parse(rows[0].value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string' && UUID_RE.test(v)) : [];
  } catch {
    return [];
  }
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
    const id = randomUUID(); // 코호트 분포는 i로 정하고, ID만 예측 불가하게 둔다
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
        twrPct: Math.round((rng() * 10 - 4) * 100) / 100,
        budgetAccuracy: Math.round((0.5 + rng() * 0.48) * 1000) / 1000,
        xp: Math.floor(rng() * 121),
      });
    }
  }

  // 이전 실행이 남긴 더미 + 구버전 순번 UUID 더미를 먼저 제거한다. allocations만 users를 FK로
  // 참조하므로 자식 행부터 지운다. (더미는 users·allocations·weekly_scores에만 존재한다)
  const staleIds = [...(await storedDummyIds()), ...LEGACY_DUMMY_IDS];
  await db.delete(schema.weeklyScores).where(inArray(schema.weeklyScores.userId, staleIds));
  await db.delete(schema.allocations).where(inArray(schema.allocations.userId, staleIds));
  await db.delete(schema.users).where(inArray(schema.users.id, staleIds));

  // 적재 전에 ID를 먼저 기록한다 — 도중에 실패해도 다음 실행이 남은 행을 정리할 수 있게.
  const ids = userRows.map((u) => u.id);
  await db
    .insert(schema.settings)
    .values({ key: DUMMY_IDS_KEY, value: JSON.stringify(ids) })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: sql`excluded.value` } });

  const CHUNK = 500;
  for (let i = 0; i < userRows.length; i += CHUNK) {
    await db.insert(schema.users).values(userRows.slice(i, i + CHUNK));
  }
  for (let i = 0; i < allocRows.length; i += CHUNK) {
    await db.insert(schema.allocations).values(allocRows.slice(i, i + CHUNK));
  }
  for (let i = 0; i < scoreRows.length; i += CHUNK) {
    await db.insert(schema.weeklyScores).values(scoreRows.slice(i, i + CHUNK));
  }
  console.log(`더미 사용자 ${DUMMY_COUNT}명 (동의 150) · 배분 ${allocRows.length} · 주간점수 ${scoreRows.length}`);
}

main().catch((e) => {
  console.error('시드 실패:', e);
  process.exit(1);
});

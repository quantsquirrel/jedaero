// DB 시드 적재 (멱등). 실행: npm run seed
// tickers·quests·holidays·settings는 upsert, prices는 전체 교체.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { TICKERS } from '../db/seed/tickers';
import { QUESTS } from '../db/seed/quests';
import { HOLIDAYS_KR } from '../db/seed/holidays';
import { PRICE_DATES, PRICE_SERIES } from '../db/seed/prices';

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
}

main().catch((e) => {
  console.error('시드 실패:', e);
  process.exit(1);
});

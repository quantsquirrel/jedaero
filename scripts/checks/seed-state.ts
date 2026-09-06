// F-16 진단 — 「함께 보기」가 전원 «집계 대기»로 보이는 원인을 가른다. 읽기 전용이다.
//
// board() 는 이번 주(weekOf(new Date())) 행만 읽는다 (lib/league.ts). 더미는 화면을
// 방문하지 않으니 lazy upsert 가 돌지 않고, scripts/seed.ts 가 미리 넣어 둔 4주치가
// 유일한 출처다. 그 4주 창 밖이면 목록이 통째로 「집계 대기」가 된다.
//
//   DATABASE_URL='...' npx tsx scripts/checks/seed-state.ts
import { Client } from 'pg';
import { weekOf } from '../../lib/week';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL 없음');
    process.exit(2);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  const q = async <T>(sql: string): Promise<T[]> => (await client.query(sql)).rows as T[];

  const week = weekOf(new Date());
  console.log(`이번 주(KST ISO): ${week}`);

  const [{ n: users }] = await q<{ n: string }>(`select count(*) n from users`);
  const stored = await q<{ value: string }>(
    `select value from settings where key='seed_dummy_user_ids'`,
  );
  let dummyN = 0;
  if (stored[0]) {
    try {
      const parsed: unknown = JSON.parse(stored[0].value);
      dummyN = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      dummyN = -1;
    }
  }
  console.log(`users 총수: ${users}`);
  console.log(
    `settings.seed_dummy_user_ids: ${stored[0] ? `${dummyN}건` : '**없음** — 재시드가 옛 더미를 못 지운다'}`,
  );

  console.log('\nweekly_scores 주차별:');
  const rows = await q<{ week_of: string; n: string; scored: string }>(
    `select week_of, count(*) n, count(total) scored from weekly_scores group by 1 order by 1`,
  );
  for (const r of rows) {
    const here = r.week_of === week ? '  ← 이번 주' : '';
    console.log(`  ${r.week_of}  행 ${r.n}  점수있음 ${r.scored}${here}`);
  }
  if (!rows.some((r) => r.week_of === week)) {
    console.log(`  (${week} 행이 하나도 없다 — 목록이 전원 「집계 대기」가 된다)`);
  }

  console.log('\n이번 주 점수를 «가진» 사용자 / «못 가진» 사용자:');
  const [gap] = await q<{ have: string; missing: string }>(
    `select
       count(*) filter (where s.total is not null) have,
       count(*) filter (where s.total is null) missing
     from users u
     left join weekly_scores s on s.user_id = u.id and s.week_of = '${week}'`,
  );
  console.log(`  가짐 ${gap.have} · 못 가짐 ${gap.missing}`);

  await client.end();
}

main().catch((e) => {
  console.error('진단 실패:', e instanceof Error ? e.message : e);
  process.exit(1);
});

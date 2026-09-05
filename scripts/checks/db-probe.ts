// DB에 붙어야만 판정할 수 있는 항목들 — P0-02·P0-04·P0-05·P0-09·P0-11·P1-07.
//
// ★ 왜 psql이 아니라 이 파일인가.
//   예전 verify.sh는 psql 바이너리를 호출했다. psql이 깔려 있지 않은 개발 머신에서는
//   DATABASE_URL이 멀쩡히 있어도 이 여섯 항목이 전부 FAIL로 찍혔고, 출력만 보면
//   「스키마가 깨졌다」와 구분되지 않는다. 제출 직전에 이 차이를 못 읽으면
//   멀쩡한 것을 고치려 들게 된다 (docs/VERIFY.md §D가 경계하는 상황이 바로 이것).
//   프로젝트에 이미 있는 pg 드라이버로 같은 쿼리를 돌리면 어느 머신에서나 같은 답이 나온다.
//
// 출력 형식: 한 줄에 하나, `ID|PASS|사유` — verify.sh가 그대로 읽어 report에 넘긴다.
// DB에 닿지 못하면 모든 항목을 FAIL로 내되 사유에 «연결 실패»를 적어 미구현과 구분한다.
import { Client } from 'pg';

const EXPECTED_TABLES = [
  'ai_calls',
  'allocations',
  'drafts',
  'group_members',
  'groups',
  'holidays',
  'prices',
  'settings',
  'tickers',
  'users',
  'weekly_scores',
];

// 위험 4전선 대표지수는 -15% 이상 빠지는 구간이 있어야 한다
const RISK_FRONTS: [string, string][] = [
  ['KR_STOCK', 'KR-IDX'],
  ['US_STOCK', 'US-IDX'],
  ['INTL_STOCK', 'IN-IDX'],
  ['REIT_INFRA', 'RE-IDX'],
];

const IDS = ['P0-02', 'P0-04', 'P0-05', 'P0-09', 'P0-11', 'P1-07'] as const;
const out = (id: string, ok: boolean, msg: string) =>
  console.log(`${id}|${ok ? 'PASS' : 'FAIL'}|${msg}`);
const r1 = (x: number) => Math.round(x * 1000) / 10;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    for (const id of IDS) out(id, false, 'DATABASE_URL 없음');
    return;
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e);
    for (const id of IDS) out(id, false, `DB 연결 실패 (미구현 아님): ${why}`);
    return;
  }

  const q = async <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
    (await client.query(sql, params)).rows as T[];

  try {
    // ---------- P0-02 테이블 정확히 11개, 목록 일치 ----------
    const tables = (
      await q<{ tablename: string }>(
        `select tablename from pg_tables where schemaname='public' order by 1`,
      )
    ).map((r) => r.tablename);
    const actual = tables.join(' ');
    const expected = EXPECTED_TABLES.join(' ');
    out(
      'P0-02',
      actual === expected,
      actual === expected ? '테이블 11개 목록 일치' : `테이블 불일치: [${actual || '없음'}]`,
    );

    // ---------- P0-04 holdings 테이블·cash_balance 컬럼 없음 ----------
    const [{ h }] = await q<{ h: string | null }>(
      `select to_regclass('public.holdings')::text as h`,
    );
    const [{ cb }] = await q<{ cb: string }>(
      `select count(*)::text as cb from information_schema.columns
       where table_schema='public' and column_name='cash_balance'`,
    );
    const okStruct = h === null && cb === '0';
    out(
      'P0-04',
      okStruct,
      okStruct
        ? 'holdings 테이블 없음, cash_balance 컬럼 없음'
        : `holdings=${h ?? '없음'}, cash_balance 컬럼 ${cb}개`,
    );

    // ---------- P0-05 allocations UNIQUE(user_id, week_of) ----------
    const uniq = await q<{ indexdef: string }>(
      `select indexdef from pg_indexes
       where schemaname='public' and tablename='allocations'
         and indexdef like '%UNIQUE%' and indexdef like '%user_id%' and indexdef like '%week_of%'`,
    );
    out(
      'P0-05',
      uniq.length >= 1,
      uniq.length >= 1
        ? 'UNIQUE(user_id, week_of) 존재'
        : 'allocations에 UNIQUE(user_id, week_of) 없음',
    );

    // ---------- P0-09 같은 주 2회 insert → unique_violation (반드시 롤백) ----------
    // ★ 트랜잭션 안에서만 쓰고 무조건 ROLLBACK 한다. 검증이 데이터를 남기면 안 된다.
    const PROBE_USER = '00000000-0000-0000-0000-000000000901';
    let dupMsg = '제약 위반이 발생하지 않음';
    let dupOk = false;
    await client.query('BEGIN');
    try {
      await client.query(
        `insert into users (id, nickname, rank, branch, enlisted_at, discharge_at, home_distance)
         values ($1, '검증용', 'PRIVATE', 'ARMY', '2026-01-01', '2027-06-30', 'NEAR')`,
        [PROBE_USER],
      );
      const ins = `insert into allocations (user_id, week_of, weights, decided_at, effective_from)
                   values ($1, '2099-01', '{}'::jsonb, now(), '2099-01-04')`;
      await client.query(ins, [PROBE_USER]);
      await client.query(ins, [PROBE_USER]);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === '23505') {
        dupOk = true;
        dupMsg = '같은 주 2회 insert → unique_violation(23505) 발생 (롤백됨)';
      } else {
        dupMsg = `예상과 다른 오류: ${code ?? (e as Error).message}`;
      }
    } finally {
      await client.query('ROLLBACK');
    }
    out('P0-09', dupOk, dupMsg);

    // ---------- P0-11 가격 시드 드로다운 ----------
    const closesOf = async (ticker: string): Promise<number[]> =>
      (
        await q<{ close: number }>(
          `select close from prices where ticker=$1 order by trade_date`,
          [ticker],
        )
      ).map((r) => Number(r.close));

    const mddOf = (closes: number[]): number | null => {
      if (closes.length === 0) return null;
      let peak = -Infinity;
      let mdd = 0;
      for (const v of closes) {
        if (v > peak) peak = v;
        const dd = v / peak - 1;
        if (dd < mdd) mdd = dd;
      }
      return r1(mdd);
    };

    const parts: string[] = [];
    const fails: string[] = [];
    for (const [axis, ticker] of RISK_FRONTS) {
      const mdd = mddOf(await closesOf(ticker));
      parts.push(`${axis} ${mdd ?? '없음'}%`);
      if (mdd === null) fails.push(`${axis}(시드없음)`);
      else if (!(mdd <= -15)) fails.push(`${axis}(${mdd}%)`);
    }
    // 채권은 얕게 — 여섯 전선이 같이 빠지면 리밸런싱을 가르칠 재료가 사라진다
    const bond = mddOf(await closesOf('BD-IDX'));
    parts.push(`BOND ${bond ?? '없음'}%`);
    if (bond === null) fails.push('BOND(시드없음)');
    else if (!(bond >= -8)) fails.push(`BOND(${bond}%)`);
    // 금·원자재는 주식이 빠지는 구간에 오르도록 생성된다 — 전구간 수익률이 양수여야 한다
    const gold = await closesOf('CM-IDX');
    const goldRet = gold.length >= 2 ? r1(gold[gold.length - 1] / gold[0] - 1) : null;
    parts.push(`GOLD_COMM 전구간 ${goldRet ?? '없음'}%`);
    if (goldRet === null) fails.push('GOLD_COMM(시드없음)');
    else if (!(goldRet > 0)) fails.push(`GOLD_COMM(전구간 ${goldRet}%)`);

    out(
      'P0-11',
      fails.length === 0,
      fails.length === 0
        ? `대표 종목 MDD: ${parts.join(' ')}`
        : `기준 미달: ${fails.join(' ')} (전체: ${parts.join(' ')})`,
    );

    // ---------- P1-07 analytics_opt_in 기본값 false ----------
    const def = await q<{ column_default: string | null }>(
      `select column_default from information_schema.columns
       where table_schema='public' and table_name='users' and column_name='analytics_opt_in'`,
    );
    const d = def[0]?.column_default ?? '';
    out(
      'P1-07',
      d.includes('false'),
      d.includes('false') ? 'analytics_opt_in DEFAULT false' : `기본값: ${d || '없음'}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  for (const id of IDS) out(id, false, `검사 실행 실패: ${e instanceof Error ? e.message : e}`);
  process.exit(0); // 판정은 위 줄들이 한다. 이 프로세스의 exit code로 판정하지 않는다.
});

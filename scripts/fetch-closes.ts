// 6전선 종가 적재 스크립트 (수동 실행). 런타임 pricesUpTo 교체 금지 — 심사 주간은 시드가 담당한다.
// 사용: npx tsx scripts/fetch-closes.ts closes.json
// JSON: { "date": "2026-09-03", "closes": { "069500": 41230, ... } }
// ★ 이 스크립트는 «검증만» 한다. 외부 API를 부르지 않고, DB 적재는 DATABASE_URL이 생긴 뒤에 붙인다.
//   맵 자체의 상시 검증은 scripts/checks/p1-20-krx-map.ts (verify.sh가 돌린다).
import { readFileSync } from 'node:fs';
import { validateCloses, validateKrxMap, type ClosesFile } from '../lib/krx/validate';

const file = process.argv[2];
if (!file) {
  console.error('사용법: npx tsx scripts/fetch-closes.ts <closes.json>');
  process.exit(2);
}

const problems = [...validateKrxMap(), ...validateCloses(JSON.parse(readFileSync(file, 'utf8')) as ClosesFile)];
for (const p of problems) console.log(p);
if (problems.length > 0) process.exit(1);
console.log(`${file} 종가 검증 통과 — 적재는 DATABASE_URL 연결 후`);

// P1-09: k-익명성 — 코호트 n<20 → 상위 코호트(전역 월→분기→전체)로 합산
async function main() {
  let m: { resolveCohort: (monthN: number, quarterN: number) => 'MONTH' | 'QUARTER' | 'ALL' };
  try {
    m = await import('../../lib/insights');
  } catch {
    console.log('lib/insights.ts 미구현 (3단계)');
    process.exit(1);
  }
  const cases: [number, number, string][] = [
    [25, 40, 'MONTH'],
    [19, 25, 'QUARTER'],
    [3, 10, 'ALL'],
  ];
  for (const [mn, qn, want] of cases) {
    const got = m.resolveCohort(mn, qn);
    if (got !== want) {
      console.log(`n(월)=${mn}, n(분기)=${qn} → ${got} (기대 ${want})`);
      process.exit(1);
    }
  }
  console.log('n<20이면 월→분기→전체로 합산');
}
main();

// P0-08: isRebalanceOpen() — 일 20:59→true, 일 21:01→false, 수요일→false (토요일은 종일 true)
async function main() {
  let m: { isRebalanceOpen: (d: Date) => boolean };
  try {
    m = await import('../../lib/day-type');
  } catch {
    console.log('lib/day-type.ts 미구현 (2단계)');
    process.exit(1);
  }
  const cases: [string, boolean, string][] = [
    ['2026-09-06T11:59:00Z', true, '일요일 20:59 KST'],
    ['2026-09-06T12:01:00Z', false, '일요일 21:01 KST'],
    ['2026-09-02T05:00:00Z', false, '수요일 14:00 KST'],
    ['2026-09-05T13:00:00Z', true, '토요일 22:00 KST'],
  ];
  for (const [iso, want, label] of cases) {
    const got = m.isRebalanceOpen(new Date(iso));
    if (got !== want) {
      console.log(`${label} → ${got} (기대 ${want})`);
      process.exit(1);
    }
  }
  console.log('일 20:59 열림, 일 21:01 마감, 평일 잠김');
}
main();

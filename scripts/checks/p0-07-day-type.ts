// P0-07: dayType() — 수요일→WEEKDAY, 토요일→WEEKEND, 공휴일(평일)→WEEKEND
async function main() {
  let m: { dayType: (d: Date) => 'WEEKDAY' | 'WEEKEND' };
  try {
    m = await import('../../lib/day-type');
  } catch {
    console.log('lib/day-type.ts 미구현 (2단계)');
    process.exit(1);
  }
  const cases: [string, 'WEEKDAY' | 'WEEKEND', string][] = [
    ['2026-09-02T03:00:00Z', 'WEEKDAY', '수요일 12:00 KST'],
    ['2026-09-05T03:00:00Z', 'WEEKEND', '토요일 12:00 KST'],
    ['2026-09-24T03:00:00Z', 'WEEKEND', '추석 연휴 목요일(평일 공휴일)'],
  ];
  for (const [iso, want, label] of cases) {
    const got = m.dayType(new Date(iso));
    if (got !== want) {
      console.log(`${label} → ${got} (기대 ${want})`);
      process.exit(1);
    }
  }
  console.log('수=WEEKDAY, 토=WEEKEND, 공휴일(평일)=WEEKEND');
}
main();

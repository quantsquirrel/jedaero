// P0-07: dayType() — 수요일→WEEKDAY, 토요일→WEEKEND, 공휴일(평일)→WEEKEND
async function main() {
  let m: {
    dayType: (d: Date) => 'WEEKDAY' | 'WEEKEND';
    daysUntilRebalance: (d: Date, currentType?: 'WEEKDAY' | 'WEEKEND') => number;
  };
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
  const saturday = new Date('2026-09-05T03:00:00Z');
  if (m.daysUntilRebalance(saturday, 'WEEKDAY') !== 1) {
    console.log('실제 토요일에 데모 평일 모드가 D-0으로 표시됨');
    process.exit(1);
  }
  console.log('수=WEEKDAY, 토=WEEKEND, 공휴일(평일)=WEEKEND, 실제 토요일의 데모 평일=D-1');
}
main();

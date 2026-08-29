// P1-05: 예산 준수율 = 1 − Σ|배정−실지출| / Σ배정, 0~1 클램프
async function main() {
  let m: { budgetAccuracy: (envelopes: { allocated: number; spent: number }[]) => number };
  try {
    m = await import('../../lib/budget');
  } catch {
    console.log('lib/budget.ts 미구현 (3단계)');
    process.exit(1);
  }
  const cases: [{ allocated: number; spent: number }[], number, string][] = [
    [
      [
        { allocated: 100_000, spent: 90_000 },
        { allocated: 50_000, spent: 70_000 },
      ],
      0.8,
      '기본',
    ],
    [[{ allocated: 10_000, spent: 100_000 }], 0, '하한 클램프'],
    [[{ allocated: 10_000, spent: 10_000 }], 1, '완전 일치'],
  ];
  for (const [env, want, label] of cases) {
    const got = m.budgetAccuracy(env);
    if (Math.abs(got - want) > 1e-9) {
      console.log(`${label}: ${got} (기대 ${want})`);
      process.exit(1);
    }
  }
  console.log('준수율 0.8 / 클램프 0 / 완전 일치 1');
}
main();

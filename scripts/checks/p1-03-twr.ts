// P1-03: TWR — docs/VERIFY.md §C 케이스. (1.10 × 1.10) − 1 = 21.00%
async function main() {
  let m: { twr: (segments: { start: number; flow: number; end: number }[]) => number };
  try {
    m = await import('../../lib/portfolio/twr');
  } catch {
    console.log('lib/portfolio/twr.ts 미구현 (3단계)');
    process.exit(1);
  }
  const got = m.twr([
    { start: 1_000_000, flow: 0, end: 1_100_000 },
    { start: 1_100_000, flow: 500_000, end: 1_760_000 },
  ]);
  if (Math.abs(got - 0.21) > 1e-9) {
    console.log(`TWR ${got} (기대 0.21)`);
    process.exit(1);
  }
  console.log('TWR 21.00% — §C 케이스 일치 (단순수익률 17.33%와 다름)');
}
main();

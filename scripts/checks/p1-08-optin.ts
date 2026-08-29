// P1-08: 상호주의 — 미동의 사용자에게 비교 화면 미노출 게이트
async function main() {
  let m: { needsOptIn: (u: { analyticsOptIn: boolean }) => boolean };
  try {
    m = await import('../../lib/insights');
  } catch {
    console.log('lib/insights.ts 미구현 (3단계)');
    process.exit(1);
  }
  if (m.needsOptIn({ analyticsOptIn: false }) !== true) {
    console.log('미동의인데 게이트가 열림');
    process.exit(1);
  }
  if (m.needsOptIn({ analyticsOptIn: true }) !== false) {
    console.log('동의했는데 게이트가 닫힘');
    process.exit(1);
  }
  console.log('미동의 → 비교 화면 미노출, 동의 → 노출');
}
main();

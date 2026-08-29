// P1-11: 부대명 필터 — `12사단 3대대` 차단 / `해뜰날 저축단` 허용 (정규식 1차)
async function main() {
  let m: { checkGroupName: (name: string) => { blocked: boolean; reason?: string } };
  try {
    m = await import('../../lib/filters/unit-filter');
  } catch {
    console.log('lib/filters/unit-filter.ts 미구현 (3단계)');
    process.exit(1);
  }
  if (m.checkGroupName('12사단 3대대').blocked !== true) {
    console.log('`12사단 3대대`가 차단되지 않음');
    process.exit(1);
  }
  if (m.checkGroupName('해뜰날 저축단').blocked !== false) {
    console.log('`해뜰날 저축단`이 차단됨 (오탐)');
    process.exit(1);
  }
  console.log('`12사단 3대대` 차단 / `해뜰날 저축단` 허용');
}
main();

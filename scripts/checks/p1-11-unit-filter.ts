// P1-11: 실제 편제명은 차단하고 일반 모임 표현은 허용한다 (정규식 1차).
async function main() {
  let m: { checkGroupName: (name: string) => { blocked: boolean; reason?: string } };
  try {
    m = await import('../../lib/filters/unit-filter');
  } catch {
    console.log('lib/filters/unit-filter.ts 미구현 (3단계)');
    process.exit(1);
  }
  const blocked = ['12사단 3대대', '제1보병사단', '제7기동군단', '1방공여단', '11전대', '2사령부'];
  for (const name of blocked) {
    if (m.checkGroupName(name).blocked !== true) {
      console.log(`\`${name}\`가 차단되지 않음`);
      process.exit(1);
    }
  }
  const allowed = ['해뜰날 저축단', '1000만원 도전단', '2026 청년연대', '82 군단위 지자체', '30분대 도착', '영업본부 회식'];
  for (const name of allowed) {
    if (m.checkGroupName(name).blocked !== false) {
      console.log(`\`${name}\`이 차단됨 (오탐)`);
      process.exit(1);
    }
  }
  console.log(`부대명 ${blocked.length}건 차단 / 일반 표현 ${allowed.length}건 허용`);
}
main();

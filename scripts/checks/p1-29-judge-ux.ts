// P1-29: 심사자가 데모 뒤에 온보딩을 볼 수 있고, 출처는 손가락으로 누를 수 있는가
import { readFileSync } from 'node:fs';

function fail(msg: string): never {
  console.log(msg);
  process.exit(1);
}

const onboarding = readFileSync('app/onboarding/page.tsx', 'utf8');
if (/if\s*\(\s*user\s*\)\s*redirect\(\s*['"]\/home['"]\s*\)/.test(onboarding)) {
  fail('온보딩이 세션만 있으면 /home 으로 보낸다 — 데모 세션은 통과시켜야 한다');
}
if (!/isDemo/.test(onboarding)) {
  fail('온보딩이 데모 세션(isDemo)을 구분하지 않는다');
}
if (!/체험으로 돌아가기/.test(onboarding)) {
  fail('데모로 온보딩을 열었을 때 체험으로 돌아가는 길이 없다');
}

const principles = readFileSync('app/(app)/principles/page.tsx', 'utf8');
const sourceAnchors = principles.match(/<a[\s\S]*?>[\s\S]*?출처[\s\S]*?<\/a>/g) ?? [];
if (sourceAnchors.length < 2) fail(`출처 링크 ${sourceAnchors.length}개 (기대 ≥2)`);
for (const a of sourceAnchors) {
  if (!/\b(min-h-11|h-11)\b/.test(a) || !/\b(min-w-11|w-11)\b/.test(a)) {
    fail('출처 링크 탭 영역이 44×44px 미만이다');
  }
}

const guide = readFileSync('components/demo-guide.tsx', 'utf8');
if (!guide.includes('/onboarding')) {
  fail('심사용 동선에 온보딩 미리보기 링크가 없다');
}

console.log(
  `온보딩 데모 통과 · 출처 ${sourceAnchors.length}개 44px · 동선에 /onboarding`,
);

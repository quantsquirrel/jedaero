// P1-24: 쿠키 신뢰 경계·초대코드 CSPRNG·더미 세션 UUID 회귀 방지.
import { readFileSync } from 'node:fs';
import { trustedDemoOverride } from '../../lib/demo-override';

function fail(message: string): never {
  console.log(message);
  process.exit(1);
}

if (trustedDemoOverride('WEEKDAY', false) !== null) fail('일반 사용자의 WEEKDAY 쿠키가 인정됨');
if (trustedDemoOverride('WEEKEND', false) !== null) fail('일반 사용자의 WEEKEND 쿠키가 인정됨');
if (trustedDemoOverride('WEEKDAY', true) !== 'WEEKDAY') fail('데모 사용자의 WEEKDAY 쿠키가 거부됨');
if (trustedDemoOverride('WEEKEND', true) !== 'WEEKEND') fail('데모 사용자의 WEEKEND 쿠키가 거부됨');
if (trustedDemoOverride('INVALID', true) !== null) fail('잘못된 데모 요일 값이 인정됨');

const groupsSource = readFileSync('lib/groups.ts', 'utf8');
if (!groupsSource.includes('randomInt(CODE_CHARS.length)')) fail('초대코드가 CSPRNG를 사용하지 않음');
if (groupsSource.includes('Math.random() * CODE_CHARS.length')) fail('초대코드에 Math.random()이 남아 있음');

const seedSource = readFileSync('scripts/seed.ts', 'utf8');
if (!seedSource.includes('const id = randomUUID()')) fail('더미 사용자 ID가 UUID v4 난수가 아님');
if (seedSource.includes('const dummyId =')) fail('예측 가능한 더미 사용자 ID 생성기가 남아 있음');

const dayContextSource = readFileSync('lib/day-context.ts', 'utf8');
if (!dayContextSource.includes('user?.isDemo === true')) fail('demo_day 쿠키가 서버의 isDemo 값으로 검증되지 않음');

console.log('demo_day 서버 검증 · 초대코드 CSPRNG · 더미 세션 UUID v4 확인');

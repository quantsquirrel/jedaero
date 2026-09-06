// P1-28: 심사 전 감사에서 잡힌 화면·시스템 불일치
// — 지수 힌트가 산식(목표 비중 변경폭)과 같아야 한다
// — CJK next/font 가 모든 unicode-range 를 preload 하면 랜딩 LCP 가 무너진다
// — --faint 가 본문 14px 에서 WCAG AA(4.5:1) 를 못 넘기면 안 된다
// — 하단 탭이 본문 클릭을 먹지 않게 scroll-padding / safe-area 가 있어야 한다
import { readFileSync } from 'node:fs';
import { INDEX_LABELS } from '../../lib/jedaero-index';

function fail(msg: string): never {
  console.log(msg);
  process.exit(1);
}

const held = INDEX_LABELS.find((row) => row.key === 'held');
if (!held) fail('INDEX_LABELS 에 held 축이 없다');
if (/몇 주 유지/.test(held.hint)) {
  fail(`판단을 지킨 힘 힌트가 산식과 다르다: "${held.hint}" (목표 비중 변경폭이어야 한다)`);
}
if (!/비중/.test(held.hint)) {
  fail(`판단을 지킨 힘 힌트에 「비중」이 없다: "${held.hint}"`);
}

const layout = readFileSync('app/layout.tsx', 'utf8');
const krBlock = layout.match(/IBM_Plex_Sans_KR\(\{[\s\S]*?\}\)/);
if (!krBlock) fail('app/layout.tsx 에 IBM_Plex_Sans_KR 설정이 없다');
if (!/preload:\s*false/.test(krBlock[0])) {
  fail('IBM_Plex_Sans_KR 이 모든 unicode-range 청크를 preload 한다 — preload: false 가 필요하다');
}

const css = readFileSync('app/globals.css', 'utf8');
const faintVals = [...css.matchAll(/--faint:\s*oklch\(\s*([0-9.]+)/g)].map((m) => Number(m[1]));
if (faintVals.length < 1) fail('--faint oklch 값을 읽지 못했다');
for (const L of faintVals) {
  // 배경 oklch(0.145) 위에서 14px 본문이 4.5:1 을 내려면 L 이 대략 0.64 이상이어야 한다.
  if (L < 0.64) fail(`--faint 명도 ${L} — 본문 대비 4.5:1 미달 (0.64 이상)`);
}

const appLayout = readFileSync('app/(app)/layout.tsx', 'utf8');
const nav = readFileSync('components/bottom-nav.tsx', 'utf8');
const globalsPad = /scroll-padding-bottom/.test(css);
const htmlPad = /scroll-pb-/.test(appLayout);
if (!globalsPad && !htmlPad) {
  fail('하단 탭용 scroll-padding-bottom / scroll-pb-* 가 없다');
}
if (!/safe-area-inset-bottom/.test(nav) && !/safe-area-inset-bottom/.test(appLayout)) {
  fail('하단 탭에 safe-area-inset-bottom 이 없다');
}

console.log(
  `held 힌트 "${held.hint}" · KR preload false · faint L ${faintVals.join('/')} · 탭 여백 있음`,
);

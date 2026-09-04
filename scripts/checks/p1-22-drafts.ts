// P1-22: 명령하달 초안 — allocations 와 분리, 사실 서술로 끝남, 저장 텍스트는 부대정보 필터를 거침
// ★ 초안은 «체결»이 아니다. 안 적은 주가 정상이고, 그 사실이 화면 문구에도 남아야 한다.
import { readFileSync } from 'node:fs';
import { compareDraft, NOTE_MAX } from '../../lib/drafts/compare';
import { detectInjection } from '../../lib/filters/injection-filter';
import { ADVICE_PATTERN, FORECAST_PATTERN, LABEL_PATTERN } from '../../lib/ai/output-guard';
import { isValidWeights } from '../../lib/portfolio/weights';
import type { Weights } from '../../lib/constants';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

const W = (o: Partial<Weights>): Weights =>
  ({ KR_STOCK: 0, US_STOCK: 0, INTL_STOCK: 0, BOND: 0, GOLD_COMM: 0, REIT_INFRA: 0, ...o }) as Weights;

// ---- ① 같으면 «같았습니다», 다르면 어느 전선이 얼마나 달랐는지 ----------
const same = compareDraft(W({ KR_STOCK: 40, BOND: 60 }), W({ KR_STOCK: 40, BOND: 60 }));
if (!same.same) fail('같은 편성인데 다르다고 판정함');
if (same.changed.length !== 0 || same.movedPoints !== 0) fail(`같은 편성인데 변화가 잡힘: ${JSON.stringify(same)}`);

const diff = compareDraft(W({ KR_STOCK: 50, BOND: 50 }), W({ KR_STOCK: 30, BOND: 50, GOLD_COMM: 20 }));
if (diff.same) fail('다른 편성인데 같다고 판정함');
if (diff.changed.length !== 2) fail(`달라진 전선 ${diff.changed.length}개 — 2개여야 함`);
if (diff.movedPoints !== 4) fail(`옮긴 포인트 ${diff.movedPoints} — 4여야 함 (20%p ÷ 5 = 4포인트)`);
if (!diff.sentence.includes('국내 주식 10→6포인트')) fail(`문장에 전선별 변화가 없음: ${diff.sentence}`);

// ---- ② 비교 문장은 «사실 서술»로 끝난다 (C8, C10) ----------------------
for (const s of [same.sentence, diff.sentence]) {
  if (ADVICE_PATTERN.test(s)) fail(`비교 문장에 조언 어미: ${s}`);
  if (LABEL_PATTERN.test(s)) fail(`비교 문장에 성향 라벨: ${s}`);
  if (FORECAST_PATTERN.test(s)) fail(`비교 문장에 전망·매매 방향: ${s}`);
}

// ---- ③ 초안 값은 편성과 같은 규칙을 따른다 -----------------------------
if (!isValidWeights(W({}))) fail('전부 예비대인 초안이 거부됨 — 빈 초안도 유효한 선택이다');
if (!isValidWeights(W({ KR_STOCK: 100 }))) fail('20포인트 전부를 한 전선에 놓은 초안이 거부됨');
if (isValidWeights(W({ KR_STOCK: 100, BOND: 5 }))) fail('20포인트를 넘는 초안이 통과함');
if (isValidWeights(W({ KR_STOCK: 3 }))) fail('5의 배수가 아닌 초안이 통과함');

// ---- ④ 저장되는 한 줄은 부대정보 파이프라인을 거친다 (C4) ---------------
// 회고와 달리 drafts.note 는 «DB에 남는» 자유 텍스트다. 필터가 빠지면 부대 정보가 저장된다.
const src = readFileSync('app/actions/drafts.ts', 'utf8');
if (!src.includes('detectInjection')) {
  fail('drafts 저장 경로에 detectInjection 이 없음 — 저장되는 텍스트에 부대정보가 남을 수 있다 (C4)');
}
if (!src.includes('allocations')) fail('drafts 저장 경로가 이번 주 확정 여부를 확인하지 않음');
for (const bad of ['12사단 3대대', '주민번호 900101-1234567']) {
  if (!detectInjection(bad).blocked) fail(`초안 한 줄 필터가 통과시킴: ${bad}`);
}
for (const good of ['반도체를 줄이고 채권을 늘리고 싶다', '이번 주는 그대로 두려고 한다']) {
  if (detectInjection(good).blocked) fail(`정상 한 줄이 차단됨: ${good}`);
}

// ---- ⑤ 초안은 allocations 를 쓰지 않는다 (주 1회 규율 불변) -------------
if (/insert\s*\(\s*allocations/.test(src) || src.includes('.insert(allocations')) {
  fail('초안이 allocations 에 쓴다 — 주 1회 규율을 건드린다');
}
if (NOTE_MAX > 200) fail(`한 줄 최대 ${NOTE_MAX}자 — 초안은 일지가 아니라 메모다`);

if (failed > 0) process.exit(1);
console.log(
  `초안 비교 사실서술 · 값 규칙 = 편성과 동일 · 저장 텍스트 부대정보 필터 통과 · allocations 미사용 (한 줄 ${NOTE_MAX}자)`,
);

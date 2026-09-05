// P1-25: 기준선 상수 — 합계 100, 메타 필드 존재, 갱신 예정일 경과는 «경고»
// ★ 경과를 FAIL로 잡지 않는다. 심사 기간 뒤 verify.sh에 빨간 줄이 생기는데
//   그것은 코드 결함이 아니라 달력 문제라 성격이 다르다 (설계 문서 §4).
import { BENCHMARKS, SPIVA } from '../../db/seed/benchmarks';
import { benchmarkRows, staleBenchmarks } from '../../lib/principles/benchmarks';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

if (BENCHMARKS.length !== 5) fail(`기준선 ${BENCHMARKS.length}개 — 5개여야 함`);

for (const b of BENCHMARKS) {
  const sum = b.slices.reduce((s, x) => s + x.pct, 0);
  if (Math.abs(sum - 100) > 0.1) fail(`${b.id} 합계 ${sum.toFixed(1)} ≠ 100`);
  if (b.slices.length === 0) fail(`${b.id} 배분 항목 없음`);
  if (!DATE_RE.test(b.asOf)) fail(`${b.id} asOf 형식 오류: ${b.asOf}`);
  if (!DATE_RE.test(b.nextReviewAt)) fail(`${b.id} nextReviewAt 형식 오류: ${b.nextReviewAt}`);
  if (!b.sourceUrl.startsWith('https://')) fail(`${b.id} sourceUrl 없음/비HTTPS`);
  if (!b.label || !b.note) fail(`${b.id} label 또는 note 비어 있음`);
  if (b.nextReviewAt <= b.asOf) fail(`${b.id} nextReviewAt이 asOf보다 앞`);
}

// 국민연금은 연중에도 바뀐다 — 확인 주기를 1년 넘게 잡지 않는다 (2026년에 두 번 바뀜)
const nps = BENCHMARKS.find((b) => b.id === 'NPS');
if (!nps) fail('NPS 기준선 없음');
else {
  const gapDays = (Date.parse(nps.nextReviewAt) - Date.parse(nps.asOf)) / 86_400_000;
  if (gapDays > 400) fail(`NPS 확인 주기 ${Math.round(gapDays)}일 — 연 2회(최대 400일) 이내여야 함`);
}

if (!(SPIVA.tenYearPct > 50 && SPIVA.tenYearPct < 100)) fail(`SPIVA 10년 ${SPIVA.tenYearPct}% 범위 밖`);
if (!(SPIVA.twentyYearPct > SPIVA.tenYearPct)) fail('SPIVA 20년이 10년보다 크지 않음');
if (!SPIVA.sourceUrl.startsWith('https://')) fail('SPIVA sourceUrl 없음');

// 경과 판정이 날짜만으로 동작하는가 (네트워크 없음)
const future = staleBenchmarks('2020-01-01');
if (future.length !== 0) fail(`2020년 기준으로 경과 ${future.length}건 — 0이어야 함`);
const past = staleBenchmarks('2100-01-01');
if (past.length !== BENCHMARKS.length) fail(`2100년 기준으로 경과 ${past.length}건 — 전부여야 함`);

const rows = benchmarkRows('2026-09-07');
if (rows.length !== BENCHMARKS.length) fail(`행 ${rows.length}개`);
if (rows.some((r) => typeof r.stale !== 'boolean')) fail('stale 플래그 누락');

if (failed > 0) process.exit(1);
const warn = staleBenchmarks(new Date().toISOString().slice(0, 10));
if (warn.length > 0) {
  console.log(`경고: 갱신 확인 예정일 경과 — ${warn.map((w) => `${w.label}(${w.asOf})`).join(', ')}`);
}
console.log(`기준선 ${BENCHMARKS.length}개 합계·메타·경과 판정 통과 (SPIVA 10년 ${SPIVA.tenYearPct}%)`);

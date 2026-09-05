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
const EXPECTED_IDS = ['NPS', 'GPFG_STRATEGY', 'GPFG_ACTUAL', 'SIXTY_FORTY', 'EQUAL_WEIGHT'] as const;

// 모양만 보면 2026-13-40도 통과한다. UTC로 읽고 다시 쓴 값까지 같아야 실제 달력 날짜다.
const isCanonicalDate = (value: string) => {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const isHttpsUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

if (BENCHMARKS.length !== 5) fail(`기준선 ${BENCHMARKS.length}개 — 5개여야 함`);

// 길이만 5면 중복으로 다른 기준선 하나를 밀어낼 수 있다. 집합 자체를 고정한다.
const benchmarkIds = BENCHMARKS.map((b) => b.id);
const uniqueBenchmarkIds = new Set(benchmarkIds);
if (uniqueBenchmarkIds.size !== benchmarkIds.length) fail(`기준선 id 중복: ${benchmarkIds.join(', ')}`);
for (const id of EXPECTED_IDS) {
  if (!uniqueBenchmarkIds.has(id)) fail(`기준선 id 누락: ${id}`);
}
for (const id of uniqueBenchmarkIds) {
  if (!(EXPECTED_IDS as readonly string[]).includes(id)) fail(`예상하지 않은 기준선 id: ${id}`);
}

for (const b of BENCHMARKS) {
  for (const slice of b.slices) {
    // NaN은 합계 비교도 거짓으로 만들어 아래 100% 검사를 우회하므로 먼저 막는다.
    if (!Number.isFinite(slice.pct) || slice.pct < 0) {
      fail(`${b.id} ${slice.name} 비중이 유한한 0 이상 숫자가 아님: ${slice.pct}`);
    }
  }
  const sum = b.slices.reduce((s, x) => s + x.pct, 0);
  if (Math.abs(sum - 100) > 0.1) fail(`${b.id} 합계 ${sum.toFixed(1)} ≠ 100`);
  if (b.slices.length === 0) fail(`${b.id} 배분 항목 없음`);
  if (!isCanonicalDate(b.asOf)) fail(`${b.id} asOf 실제 날짜/형식 오류: ${b.asOf}`);
  if (!isCanonicalDate(b.nextReviewAt)) fail(`${b.id} nextReviewAt 실제 날짜/형식 오류: ${b.nextReviewAt}`);
  if (!isHttpsUrl(b.sourceUrl)) fail(`${b.id} sourceUrl 없음/비HTTPS`);
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
if (!isCanonicalDate(SPIVA.asOf)) fail(`SPIVA asOf 실제 날짜/형식 오류: ${SPIVA.asOf}`);
if (!isHttpsUrl(SPIVA.sourceUrl)) fail('SPIVA sourceUrl 없음/비HTTPS');

// 경과 판정이 날짜만으로 동작하는가 (네트워크 없음)
const future = staleBenchmarks('2020-01-01');
if (future.length !== 0) fail(`2020년 기준으로 경과 ${future.length}건 — 0이어야 함`);
const past = staleBenchmarks('2100-01-01');
if (past.length !== BENCHMARKS.length) fail(`2100년 기준으로 경과 ${past.length}건 — 전부여야 함`);

// 행마다 nextReviewAt을 보는지 확인한다. 단일 전역 마감일이면 이 중간 상태를 맞출 수 없다.
const partlyStaleIds = staleBenchmarks('2027-02-01').map((b) => b.id);
if (partlyStaleIds.length !== 1 || partlyStaleIds[0] !== 'NPS') {
  fail(`2027-02-01 경과 id ${partlyStaleIds.join(', ') || '없음'} — NPS만이어야 함`);
}

// 예정일 당일은 아직 경과가 아니고 다음 날부터 경과다. 비교 연산자는 반드시 > 여야 한다.
if (nps && isCanonicalDate(nps.nextReviewAt)) {
  const dayAfterReview = new Date(Date.parse(`${nps.nextReviewAt}T00:00:00.000Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (staleBenchmarks(nps.nextReviewAt).some((b) => b.id === 'NPS')) {
    fail(`NPS 예정일 당일(${nps.nextReviewAt})에 이미 경과로 판정됨`);
  }
  if (!staleBenchmarks(dayAfterReview).some((b) => b.id === 'NPS')) {
    fail(`NPS 예정일 다음 날(${dayAfterReview})에도 경과로 판정되지 않음`);
  }
}

const rows = benchmarkRows('2026-09-07');
if (rows.length !== BENCHMARKS.length) fail(`행 ${rows.length}개`);
if (rows.some((r) => typeof r.stale !== 'boolean')) fail('stale 플래그 누락');

if (failed > 0) process.exit(1);
const warn = staleBenchmarks(new Date().toISOString().slice(0, 10));
if (warn.length > 0) {
  console.log(`경고: 갱신 확인 예정일 경과 — ${warn.map((w) => `${w.label}(${w.asOf})`).join(', ')}`);
}
console.log(`기준선 ${BENCHMARKS.length}개 합계·메타·경과 판정 통과 (SPIVA 10년 ${SPIVA.tenYearPct}%)`);

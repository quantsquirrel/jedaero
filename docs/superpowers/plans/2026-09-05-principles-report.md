# 나의 투자 원칙 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 복무 기간의 편성 이력에서 측정한 사실 문장과 공표된 기관 자산배분 비교표를 한 화면(`/principles`)에 놓고, 왜 다른지를 AI가 목적·기간으로 설명하게 한다.

**Architecture:** 새 테이블·새 엔진·런타임 외부 호출이 없다. 기준선은 `db/seed/benchmarks.ts` 상수, 사실 문장은 기존 `computeCurve`·`effectiveFronts`·`runDrill` 조합, AI-8은 `lib/ai/narrative.ts`(AI-7)와 같은 가드 파이프라인, 이미지는 `next/og`의 `ImageResponse` 서버 렌더.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind v4 · Drizzle(Neon) · OpenAI · `next/og`(내장)

## Global Constraints

- 설계 원문은 `docs/superpowers/specs/2026-09-05-principles-report-design.md`. 문안은 그 문서 §5가 원본이다
- **새 테이블 없음.** 테이블 11개 유지 (`verify.sh` P0-02가 강제)
- **런타임 외부 API 호출 없음** (C6). 기준선은 전부 상수
- **사용자의 선택·산출물을 저장하지 않는다.** 파일·DB·로그 어디에도
- **문안 규칙:** 과거형 사실만. 미래 시제·명령형·권유형 금지. 성향 라벨 금지. 「추천」·「최적」·「일치율」 금지 (C10)
- **어투 「합니다」체, 호칭 「사용자님」**
- **제대로 지수 점수를 이 화면에 넣지 않는다** (평일 잠금 우회 금지)
- 금액은 원 단위 정수로 계산한다. 표시만 만원 단위로 축약한다
- `lib/**` 순수 계산 파일은 **DB 클라이언트(`db/index.ts`)를** import하지 않는다 — `DATABASE_URL` 없이 검증 스크립트가 돌아야 한다. `db/seed/*` 상수 파일은 순수 데이터이므로 허용한다 (`lib/portfolio/prices.ts`가 이미 그렇게 한다)
- 새 npm 의존성을 추가하지 않는다 (`next/og`는 내장)
- 작업 브랜치 `feat/principles-report`. `main`에 직접 커밋하지 않는다

### ★ 착수 전 반드시 알아야 하는 두 가지

**1. `output-guard`의 `ADVICE_PATTERN`이 「필요합니다」·「고려」·「좋습니다」·「해야」·「추천」·「권장」을 폐기한다.**

설계 문서 §5 문안 23의 예시가 「팔 수 있는 자산이 **필요합니다**」였다. 그대로 프롬프트에 넣으면 AI-8 출력이 매번 폐기되고 화면은 항상 폴백으로 내려간다. **AI-8 프롬프트와 폴백 문장에서 이 어휘를 뺀다.** 이 계획의 Task 4 코드가 수정본이다.

**2. 고정 문안에 「추천」이 «정상적으로» 등장한다.**

문안 12 「추천이 아닙니다」, 문안 31 「추천하지 않습니다」. P1-26에서 `추천`을 단순 grep하면 정상 문안이 FAIL한다. **부정형을 먼저 제거한 뒤 검사한다.** Task 2 코드가 그 처리를 담는다.

### 문안 수정 3건 (설계 문서 §5 대비)

| 문안 | 원문 | 수정 | 이유 |
|---|---|---|---|
| 10 | 석 달을 그 상태로 지나야 합니다 | 저점까지 약 3개월이 걸립니다 | 「석 달」은 사람이 붙인 말이다. `troughTradingDays`에서 계산한 값을 쓴다 |
| 17 | 「연합작전」이 이것입니다 | 「연합작전」이 이에 가깝습니다 | 연합작전은 20/20/15/20/15/10이고 균등이 아니다. 「이것입니다」는 사실과 다르다 |
| 23 | 팔 수 있는 자산이 필요합니다 | 팔 수 있는 자산을 함께 들고 있습니다 | `ADVICE_PATTERN`이 「필요합니다」를 폐기한다 |

---

## File Structure

| 파일 | 책임 |
|---|---|
| `db/seed/benchmarks.ts` | 기준선 상수 + 메타(`asOf`/`sourceUrl`/`nextReviewAt`). 순수 데이터 |
| `lib/principles/benchmarks.ts` | 비교표 행 조립 + 갱신 경과 판정. `db` import 없음 |
| `lib/format.ts` | `manWon()` 추가 |
| `lib/principles/facts.ts` | 사실 문장 7종 계산. `db` import 없음 |
| `lib/principles/copy.ts` | 고정 문안 + 문안 규칙 검사기. 화면과 검증이 같은 원본을 본다 |
| `lib/ai/principles.ts` | AI-8 프롬프트·가드·폴백 |
| `app/actions/principles.ts` | AI-8 서버 액션 |
| `app/(app)/principles/page.tsx` | 화면 (서버 컴포넌트) |
| `components/principles-sheet.tsx` | 체크박스 + 이미지 저장 링크 (클라이언트) |
| `components/principles-ai.tsx` | AI-8 호출 버튼 + 배지 (클라이언트) |
| `app/principles/image/route.tsx` | `ImageResponse` PNG |
| `assets/fonts/NotoSansKR-Regular.ttf` | 이미지 렌더용 한글 폰트 |
| `scripts/checks/p1-25-benchmarks.ts` | 기준선 합계·메타·경과 |
| `scripts/checks/p1-26-principles-copy.ts` | 문안 규칙 + 사실 문장 계산 |
| `scripts/checks/p1-27-principles-ai.ts` | AI-8 폴백이 두 가드를 통과 |

---

## Task 1: 기준선 상수와 갱신 판정

**Files:**
- Create: `db/seed/benchmarks.ts`
- Create: `lib/principles/benchmarks.ts`
- Create: `scripts/checks/p1-25-benchmarks.ts`
- Modify: `scripts/verify.sh` (P1 블록 끝, `run_check P1-24` 다음 줄)

**Interfaces:**
- Consumes: 없음 (첫 작업)
- Produces:
  - `BENCHMARKS: readonly Benchmark[]` — `Benchmark = { id, label, slices: {name,pct}[], asOf, sourceUrl, nextReviewAt, note }`
  - `SPIVA: { tenYearPct: number; twentyYearPct: number; asOf: string; sourceUrl: string }`
  - `benchmarkRows(todayStr: string): BenchmarkRow[]` — `BenchmarkRow = Benchmark & { stale: boolean }`
  - `staleBenchmarks(todayStr: string): BenchmarkRow[]`

- [ ] **Step 1: 검증 스크립트를 먼저 쓴다 (실패해야 정상)**

Create `scripts/checks/p1-25-benchmarks.ts`:

```ts
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

if (BENCHMARKS.length !== 4) fail(`기준선 ${BENCHMARKS.length}개 — 4개여야 함`);

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
const past = staleBenchmarks('2099-01-01');
if (past.length !== BENCHMARKS.length) fail(`2099년 기준으로 경과 ${past.length}건 — 전부여야 함`);

const rows = benchmarkRows('2026-09-07');
if (rows.length !== BENCHMARKS.length) fail(`행 ${rows.length}개`);
if (rows.some((r) => typeof r.stale !== 'boolean')) fail('stale 플래그 누락');

if (failed > 0) process.exit(1);
const warn = staleBenchmarks(new Date().toISOString().slice(0, 10));
if (warn.length > 0) {
  console.log(`경고: 갱신 확인 예정일 경과 — ${warn.map((w) => `${w.label}(${w.asOf})`).join(', ')}`);
}
console.log(`기준선 ${BENCHMARKS.length}개 합계·메타·경과 판정 통과 (SPIVA 10년 ${SPIVA.tenYearPct}%)`);
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsx scripts/checks/p1-25-benchmarks.ts`
Expected: FAIL — `Cannot find module '../../db/seed/benchmarks'`

- [ ] **Step 3: 기준선 상수를 만든다**

Create `db/seed/benchmarks.ts`:

```ts
// 공표된 기관 자산배분 + 학술 기준선 (설계 문서 §3)
// ★ 개별 전문가 전망·애널리스트 리포트를 쓰지 않는다. 「전문가 평균은 주식 60%인데 당신은 40%」는
//   목표 비중 제시이고, 권위가 붙어 AI가 말하는 것보다 강한 추천이 된다 (C10).
// ★ 전부 상수다. 런타임 외부 호출이 없다 (C6). 갱신은 사람이 하고 P1-25가 기계로 확인한다.
// ★ 공표 분류를 그대로 둔다. 우리 6자산군으로 강제 매핑하지 않는다 —
//   국민연금에는 금·원자재 자산군이 아예 없고, 맞춰 넣으면 «우리가 만든 숫자»가 된다.

export type BenchmarkSlice = { name: string; pct: number };

export type Benchmark = {
  id: 'NPS' | 'GPFG_STRATEGY' | 'GPFG_ACTUAL' | 'EQUAL_WEIGHT';
  label: string;
  slices: BenchmarkSlice[];
  /** 이 숫자의 기준일 */
  asOf: string;
  sourceUrl: string;
  /** 다음 확인 예정일. 지나면 화면이 스스로 신고한다 */
  nextReviewAt: string;
  note: string;
};

export const BENCHMARKS: readonly Benchmark[] = [
  {
    id: 'NPS',
    label: '국민연금',
    slices: [
      { name: '국내주식', pct: 20.8 },
      { name: '해외주식', pct: 34.7 },
      { name: '국내채권', pct: 23.1 },
      { name: '해외채권', pct: 7.4 },
      { name: '대체투자', pct: 14.0 },
    ],
    asOf: '2026-05-28',
    sourceUrl: 'https://fund.nps.or.kr/',
    // ★ 2026년에 두 번 바뀌었다 (1월 14.4→14.9, 5월 →20.8). 연 1회로 잡으면 낡은 숫자가 남는다.
    nextReviewAt: '2027-01-31',
    note: '2026년 말 목표비중 · 기금운용위원회 의결',
  },
  {
    id: 'GPFG_STRATEGY',
    label: '노르웨이 국부펀드 (목표)',
    slices: [
      { name: '주식', pct: 70 },
      { name: '채권', pct: 30 },
    ],
    asOf: '2019-05-01',
    sourceUrl: 'https://www.nbim.no/en/investments/benchmark-index/',
    nextReviewAt: '2027-02-28',
    note: '재무부가 정한 전략 기준지수',
  },
  {
    id: 'GPFG_ACTUAL',
    label: '노르웨이 국부펀드 (실제)',
    slices: [
      { name: '주식', pct: 72.1 },
      { name: '채권', pct: 25.8 },
      { name: '비상장 부동산', pct: 1.6 },
      { name: '비상장 인프라', pct: 0.5 },
    ],
    asOf: '2026-06-30',
    sourceUrl: 'https://www.nbim.no/en/investments/the-funds-value/',
    nextReviewAt: '2027-02-28',
    // 목표 70인데 실제 72.1 — 「목표 vs 현재」 갭의 실물 증거다. 학습 카드 4단계가 여기서 증명된다.
    note: '반기보고서 실제 배분',
  },
  {
    id: 'EQUAL_WEIGHT',
    label: '균등배분',
    // 6등분은 16.666…이라 소수 첫째자리로는 합이 100.2가 된다. 넷은 16.7, 둘은 16.6으로 100.0을 맞춘다.
    slices: [
      { name: '국내 주식', pct: 16.7 },
      { name: '미국 주식', pct: 16.7 },
      { name: '기타 해외', pct: 16.7 },
      { name: '채권', pct: 16.7 },
      { name: '금·원자재', pct: 16.6 },
      { name: '리츠·인프라', pct: 16.6 },
    ],
    asOf: '2026-09-05',
    sourceUrl: 'https://academic.oup.com/rfs/article/22/5/1915/1592901',
    nextReviewAt: '2099-12-31',
    note: 'DeMiguel · Garlappi · Uppal (2009)',
  },
] as const;

/** 액티브 펀드가 지수를 밑돈 비율. 「전문가를 따라가라」를 스스로 차단하는 근거다.
 *  ★ 한국 펀드만의 10년 집계는 공개된 것이 없다. 미국 기준임을 화면에 명시한다. */
export const SPIVA = {
  tenYearPct: 90.4,
  twentyYearPct: 95.0,
  asOf: '2025-12-31',
  sourceUrl: 'https://www.spglobal.com/spdji/en/research-insights/spiva/',
  note: '미국 주식형 액티브 펀드 (All Domestic Funds vs S&P Composite 1500)',
} as const;
```

- [ ] **Step 4: 조회·경과 판정을 만든다**

Create `lib/principles/benchmarks.ts`:

```ts
// 비교표 행 조립 + 갱신 경과 판정 (설계 문서 §4)
// ★ db를 import하지 않는다 — DATABASE_URL 없이 P1-25가 돌아야 한다.
// ★ 판정은 날짜 비교뿐이다. 네트워크가 없다. 요일 판정과 같은 규율 —
//   서버에서 판단하고 클라이언트 시계를 믿지 않는다.
import { BENCHMARKS, type Benchmark } from '../../db/seed/benchmarks';

export type BenchmarkRow = Benchmark & { stale: boolean };

export function benchmarkRows(todayStr: string): BenchmarkRow[] {
  return BENCHMARKS.map((b) => ({ ...b, stale: todayStr > b.nextReviewAt }));
}

export function staleBenchmarks(todayStr: string): BenchmarkRow[] {
  return benchmarkRows(todayStr).filter((b) => b.stale);
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsx scripts/checks/p1-25-benchmarks.ts`
Expected: PASS — `기준선 4개 합계·메타·경과 판정 통과 (SPIVA 10년 90.4%)`

- [ ] **Step 6: `verify.sh`에 등록한다**

Modify `scripts/verify.sh` — `run_check P1-24 scripts/checks/p1-24-security-hardening.ts` 바로 다음 줄에 추가:

```bash
run_check P1-25 scripts/checks/p1-25-benchmarks.ts
```

- [ ] **Step 7: 타입 검사와 린트**

Run: `cd /Users/barella/projects/jedaero && npx tsc --noEmit && npx eslint db/seed/benchmarks.ts lib/principles/benchmarks.ts scripts/checks/p1-25-benchmarks.ts`
Expected: exit 0, 출력 없음

- [ ] **Step 8: 커밋**

```bash
cd /Users/barella/projects/jedaero
git add db/seed/benchmarks.ts lib/principles/benchmarks.ts scripts/checks/p1-25-benchmarks.ts scripts/verify.sh
git commit -m "feat: 공표 기관 자산배분 기준선 상수 + 갱신 경과 판정 (P1-25)"
```

---

## Task 2: 사실 문장 계산과 문안 규칙 검사

**Files:**
- Create: `lib/principles/facts.ts`
- Create: `lib/principles/copy.ts`
- Create: `scripts/checks/p1-26-principles-copy.ts`
- Modify: `lib/format.ts` (파일 끝에 `manWon` 추가)
- Modify: `scripts/verify.sh` (`run_check P1-25` 다음 줄)

**Interfaces:**
- Consumes: Task 1의 `BENCHMARKS`·`SPIVA` (문안 14~17·20이 이 값을 읽는다)
- Produces:
  - `manWon(n: number): string` — `18_400_000` → `'1,840만원'`
  - `PrincipleId = 'alloc' | 'spread' | 'decisions' | 'drawdown' | 'cash' | 'drill' | 'attrib'`
  - `PrincipleSentence = { id: PrincipleId; text: string }`
  - `PrincipleRow = { weekOf: string; effectiveFrom: string; weights: Weights; details: Details | null }`
  - `buildPrincipleSentences(input: PrincipleInput): PrincipleSentence[]`
  - `FIXED_COPY: Record<string, string>` · `violatesCopyRules(text: string): string | null`

- [ ] **Step 1: 검증 스크립트를 먼저 쓴다**

Create `scripts/checks/p1-26-principles-copy.ts`:

```ts
// P1-26: 나의 투자 원칙 — 사실 문장 계산 + 문안 규칙
// ★ 문장 규칙을 사람의 주의력이 아니라 스크립트가 지킨다. 이 기능의 핵심 방어선이다.
// ★ DB를 쓰지 않는다. 가격 시드 파일과 순수 함수만으로 돌린다.
import { PRICE_DATES } from '../../db/seed/prices';
import { pricesUpTo } from '../../lib/portfolio/prices';
import { ACTIVE_WEIGHT_STORY } from '../../lib/demo-story';
import { buildPrincipleSentences, type PrincipleRow } from '../../lib/principles/facts';
import { FIXED_COPY, violatesCopyRules } from '../../lib/principles/copy';
import type { Weights } from '../../lib/constants';
import { weekOfDateStr } from '../../lib/week';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

// ---------- 고정 문안 규칙 ----------
for (const [key, text] of Object.entries(FIXED_COPY)) {
  const reason = violatesCopyRules(text);
  if (reason) fail(`고정 문안 ${key}: ${reason} — "${text.slice(0, 40)}…"`);
}

// 부정형이 «정상»으로 통과하는지 (문안 12·31이 「추천」을 담고 있다)
if (violatesCopyRules('추천이 아닙니다.')) fail('「추천이 아닙니다」가 규칙에 걸림 — 부정형 처리 실패');
if (violatesCopyRules('특정 상품이나 종목을 추천하지 않습니다.')) {
  fail('「추천하지 않습니다」가 규칙에 걸림 — 부정형 처리 실패');
}
// 진짜 위반은 잡아야 한다
if (!violatesCopyRules('채권 비중을 늘리세요.')) fail('명령형을 못 잡음');
if (!violatesCopyRules('사용자님은 공격형 투자자입니다.')) fail('성향 라벨을 못 잡음');
if (!violatesCopyRules('이 배분을 추천합니다.')) fail('추천을 못 잡음');
if (!violatesCopyRules('기준선과 72% 일치합니다.')) fail('일치율을 못 잡음');
if (!violatesCopyRules('가장 최적인 배분입니다.')) fail('「최적」을 못 잡음');

// 제대로 지수 점수가 이 화면에 새지 않는가
for (const [key, text] of Object.entries(FIXED_COPY)) {
  if (/제대로 지수|100점|점수/.test(text)) fail(`고정 문안 ${key}에 지수·점수 표현이 있음`);
}

// ---------- 사실 문장 계산 ----------
// 가격 시드에서 8개 시점을 골라 데모와 같은 형태의 이력을 만든다 (결정론적)
const { dates, series } = pricesUpTo(PRICE_DATES[PRICE_DATES.length - 1]);
const step = Math.floor(dates.length / (ACTIVE_WEIGHT_STORY.length + 2));
const rows: PrincipleRow[] = ACTIVE_WEIGHT_STORY.map((w, i) => {
  const d = dates[step * (i + 1)];
  return {
    weekOf: weekOfDateStr(d),
    effectiveFrom: d,
    weights: w.weights as Weights,
    details: null,
  };
});
const currentWeek = weekOfDateStr(dates[dates.length - 1]);

const sentences = buildPrincipleSentences({ rows, currentWeek, dates, series });

if (sentences.length < 6) fail(`사실 문장 ${sentences.length}개 — 6개 이상이어야 함`);
for (const s of sentences) {
  const reason = violatesCopyRules(s.text);
  if (reason) fail(`사실 문장 ${s.id}: ${reason} — "${s.text}"`);
  if (!/\d/.test(s.text)) fail(`사실 문장 ${s.id}에 숫자가 없음 — 계산 결과가 비었다`);
  if (/NaN|Infinity|undefined|null/.test(s.text)) fail(`사실 문장 ${s.id}에 계산 실패 값: ${s.text}`);
}

const ids = sentences.map((s) => s.id);
for (const need of ['alloc', 'spread', 'decisions', 'drawdown', 'drill', 'attrib'] as const) {
  if (!ids.includes(need)) fail(`필수 문장 ${need} 없음`);
}

// 현금이 0인 편성에서는 cash 문장이 뜨지 않는다 (마지막 편성은 합 100)
const lastPlaced = Object.values(rows[rows.length - 1].weights).reduce((a, b) => a + b, 0);
if (lastPlaced === 100 && ids.includes('cash')) fail('현금 0인데 cash 문장이 뜸');

// 반사실 곡선이 실제로 다른 값을 내는가 — 같으면 attrib이 «항상 0원»이 된다
const single = buildPrincipleSentences({ rows: [rows[0]], currentWeek, dates, series });
if (single.some((s) => s.id === 'attrib')) fail('편성이 하나뿐인데 attrib 문장이 뜸');

if (failed > 0) process.exit(1);
console.log(
  `고정 문안 ${Object.keys(FIXED_COPY).length}건 · 사실 문장 ${sentences.length}건 규칙 통과 (부정형 허용, 명령형·라벨·추천·일치율 차단)`,
);
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsx scripts/checks/p1-26-principles-copy.ts`
Expected: FAIL — `Cannot find module '../../lib/principles/facts'`

- [ ] **Step 3: `manWon`을 추가한다**

Modify `lib/format.ts` — 파일 끝에 추가:

```ts
/** 만원 단위 축약 표시. 계산은 원 단위 정수로 하고 «표시만» 줄인다.
 *  ★ 병사에게는 「1,840만원」이 「18,400,000원」보다 먼저 읽힌다.
 *  다른 화면은 won()을 그대로 쓴다 — 이 축약은 /principles 전용이다. */
export const manWon = (n: number) => `${Math.round(n / 10_000).toLocaleString('ko-KR')}만원`;
```

- [ ] **Step 4: 문안 규칙 검사기와 고정 문안을 만든다**

Create `lib/principles/copy.ts`:

```ts
// 고정 문안 원본 + 문안 규칙 검사기 (설계 문서 §5)
// ★ 화면과 검증 스크립트가 «같은 원본»을 본다. 화면에만 있으면 규칙이 지켜지는지 알 수 없다.
import { BENCHMARKS, SPIVA } from '../../db/seed/benchmarks';

const bench = (id: string) => {
  const b = BENCHMARKS.find((x) => x.id === id);
  if (!b) throw new Error(`기준선 ${id}가 BENCHMARKS에 없습니다.`);
  return b;
};
const slices = (id: string) =>
  bench(id)
    .slices.map((s) => `${s.name} ${s.pct}`)
    .join(' · ');

const nps = bench('NPS');
const gpfgStrategy = bench('GPFG_STRATEGY');
const gpfgActual = bench('GPFG_ACTUAL');

export const FIXED_COPY: Record<string, string> = {
  entry: '나의 투자 원칙 · 기록으로 한 장 만들기',
  title: '나의 투자 원칙',
  subtitle: '지금까지의 기록을 그대로 옮겼습니다.',
  checkHint: '빼고 싶은 문장은 체크를 풀면 됩니다',

  benchTitle: '다른 곳은 어떻게 나눠 뒀나',
  benchLead: '추천이 아닙니다. 목적도 기간도 다른 곳들의 배분입니다.',
  nps: `국민연금 — ${slices('NPS')} (${nps.asOf} 기금운용위원회 의결, ${nps.note})`,
  gpfg: `노르웨이 국부펀드 — 목표는 ${slices('GPFG_STRATEGY')}, 실제는 주식 ${
    gpfgActual.slices[0].pct
  } · 채권 ${gpfgActual.slices[1].pct} (NBIM ${gpfgActual.asOf})`,
  equalWeight: '균등배분 — 여섯 개에 고르게. 훈련의 「연합작전」이 이에 가깝습니다.',
  mappingNote:
    '자산군을 어떻게 자를지는 기관마다 다릅니다. 국민연금에는 금·원자재 자산군이 없고, 대체투자 14%는 리츠·인프라와 다릅니다 — 사모투자가 들어갑니다. 해외주식 34.7%도 미국과 그 밖을 나눠 공개하지 않습니다. 억지로 맞추지 않았습니다.',
  gapNote: `노르웨이는 목표가 주식 ${gpfgStrategy.slices[0].pct}인데 실제는 ${gpfgActual.slices[0].pct}입니다. 시장이 움직이면 비중은 목표에서 저절로 멀어집니다. 세계에서 가장 큰 국부펀드도 그렇습니다.`,
  spiva: `전문가와 다른 것이 문제가 아닙니다. 미국 주식형 액티브 펀드 중 10년 동안 지수를 밑돈 비율이 ${SPIVA.tenYearPct}%, 20년은 ${SPIVA.twentyYearPct}%였습니다.`,
  spivaSource:
    'S&P Dow Jones Indices, SPIVA U.S. Scorecard 2025년 말. 한국 펀드만의 10년 집계는 공개된 것이 없어 미국 기준입니다.',

  aiTitle: '왜 다른가',
  aiNoAnswer: '답을 적는 칸은 없습니다. 답은 다음 의사결정으로 하면 됩니다.',

  transferTitle: '밖에서는 이렇게 불립니다',
  transfer:
    '국내 주식 · 미국 주식 · 기타 해외 · 채권 · 금·원자재 · 리츠·인프라 — 증권 앱에서도 같은 이름으로 찾을 수 있습니다. 이런 지수를 따라가는 ETF가 여러 운용사에서 나와 있습니다.',
  twrSplit:
    '지금까지는 2,000만원이 한 번에 들어간 상태였습니다. 전역하고 월급을 넣기 시작하면, 화면에 뜨는 수익률과 판단이 얼마나 맞았는지가 갈라집니다. 갈라지는 것은 오류가 아닙니다.',

  saveNote:
    '저장한 이미지는 서버에 보관하지 않습니다. 이 서비스는 사용자님에 대한 판단을 보관하지 않습니다.',
  saveButton: '이미지로 저장',

  footerSim: '이 서비스의 시세는 교육용 모의 데이터입니다. 실제 거래는 일어나지 않습니다.',
  footerNoRec: '특정 상품이나 종목을 추천하지 않습니다.',
};

/** 갱신 경과 배너 (문안 21). 경과했을 때만 화면에 붙는다 */
export function staleNotice(label: string, asOf: string): string {
  return `${label} 기준선은 ${asOf} 기준입니다. 확인 예정일이 지났습니다.`;
}

// ★ 「추천」은 부정형으로 «정상» 등장한다 (문안 12·31). 먼저 지우고 검사한다 —
//   단순 grep이면 멀쩡한 문안이 FAIL하고, 그걸 피하려고 규칙을 지우게 된다.
const NEGATED = [/추천이 아닙니다/g, /추천하지 않습니다/g, /추천하지 않아요/g];

/** 명령형·권유형 어미. output-guard의 ADVICE_PATTERN보다 좁다 —
 *  고정 문안은 「하면 됩니다」처럼 정상적인 서술을 쓰기 때문이다. */
const IMPERATIVE = /(세요|십시오|하시죠|하시길|권장|권합니다|바랍니다|해야 합니다|하는 것이 좋)/;
const LABEL = /(공격적|보수적|안정형|공격형|위험중립형|무모|과감한 성향|신중한 성향|당신에게 맞는)/;
const BANNED = /(추천|최적|일치율|유사도|적정 비중)/;
const FUTURE = /(할 것입니다|하게 됩니다|될 것입니다|전망|목표가)/;

/** 위반 사유를 돌려준다. 위반이 없으면 null */
export function violatesCopyRules(text: string): string | null {
  let t = text;
  for (const re of NEGATED) t = t.replace(re, '');
  if (IMPERATIVE.test(t)) return '명령형·권유형';
  if (LABEL.test(t)) return '성향 라벨';
  if (BANNED.test(t)) return '금지 어휘(추천·최적·일치율)';
  if (FUTURE.test(t)) return '미래 시제·전망';
  return null;
}
```

- [ ] **Step 5: 사실 문장 계산을 만든다**

Create `lib/principles/facts.ts`:

```ts
// 사실 문장 7종 — 전부 기존 함수 조합. 새 엔진이 없다 (설계 문서 §6)
// ★ db를 import하지 않는다. 가격·이력을 인자로 받아 순수 계산한다 (P1-26이 DB 없이 돈다).
// ★ LLM이 이 숫자를 만들지 않는다. 여기서 만들고, AI는 문장만 쓴다 (docs/AI-ROLES.md ②/④).
import { SEED_AMOUNT, THEMES, THEME_CODES, type Weights } from '../constants';
import { manWon } from '../format';
import { effectiveFronts } from '../jedaero-index';
import { reserveWeight } from '../insights';
import { computeCurve, type WeightHistoryItem } from '../portfolio/engine';
import type { Details } from '../portfolio/details';
import { runDrill } from '../drill/run';
import { weekOfDateStr, weeksBetween } from '../week';

export type PrincipleId =
  | 'alloc'
  | 'spread'
  | 'decisions'
  | 'drawdown'
  | 'cash'
  | 'drill'
  | 'attrib';

export type PrincipleSentence = { id: PrincipleId; text: string };

export type PrincipleRow = {
  weekOf: string;
  effectiveFrom: string;
  weights: Weights;
  details: Details | null;
};

export type PrincipleInput = {
  /** effectiveFrom 오름차순 */
  rows: PrincipleRow[];
  currentWeek: string;
  dates: string[];
  series: Record<string, number[]>;
};

const KO = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'] as const;

/** 1~10은 한글 수사 + 띄어쓰기(「여섯 개」), 그 위는 숫자 + 붙여쓰기(「12개」).
 *  ★ 「마흔일곱 번」 같은 표기를 만들지 않는다. 복무 기간이 길어져도 문장이 무너지지 않는다. */
export function koCount(n: number, unit: string): string {
  return n >= 0 && n <= 10 ? `${KO[n]} ${unit}` : `${n}${unit}`;
}

const placedSum = (w: Weights) => THEME_CODES.reduce((s, c) => s + (w[c] ?? 0), 0);

const toHistory = (rows: PrincipleRow[]): WeightHistoryItem[] =>
  rows.map((r) => ({
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Record<string, number>,
    details: (r.details as Record<string, Record<string, number>> | null) ?? null,
  }));

export function buildPrincipleSentences(input: PrincipleInput): PrincipleSentence[] {
  const { rows, currentWeek, dates, series } = input;
  if (rows.length === 0) return [];

  const out: PrincipleSentence[] = [];
  const latest = rows[rows.length - 1];
  const history = toHistory(rows);
  const cashflows = { [rows[0].effectiveFrom]: SEED_AMOUNT };
  const curve = computeCurve(dates, series, history, cashflows);

  // ── 문안 5: 배분 ──
  const nonZero = THEME_CODES.filter((c) => (latest.weights[c] ?? 0) > 0);
  const maxCode = nonZero.reduce(
    (best, c) => ((latest.weights[c] ?? 0) > (latest.weights[best] ?? 0) ? c : best),
    nonZero[0],
  );
  const maxName = THEMES.find((t) => t.code === maxCode)?.name ?? maxCode;
  const maxAmount = (SEED_AMOUNT * (latest.weights[maxCode] ?? 0)) / 100;
  out.push({
    id: 'alloc',
    text: `${manWon(SEED_AMOUNT)}을 ${koCount(nonZero.length, '개')} 자산군에 나눠 뒀습니다. 가장 큰 것은 ${maxName}이고 ${manWon(maxAmount)}입니다.`,
  });

  // ── 문안 6: 분산 ──
  const fronts = effectiveFronts(latest.weights);
  out.push({
    id: 'spread',
    text: `${koCount(nonZero.length, '개')}로 나눴지만 실제 분산은 ${koCount(Math.round(fronts), '개')} 수준이었습니다. ${maxName} 하나가 컸습니다.`,
  });

  // ── 문안 7: 의사결정 횟수 ──
  const spanWeeks = Math.max(1, weeksBetween(rows[0].weekOf, currentWeek) + 1);
  const heldWeeks = Math.max(0, spanWeeks - rows.length);
  out.push({
    id: 'decisions',
    text: `${spanWeeks}주 동안 ${koCount(rows.length, '번')} 의사결정했습니다. ${koCount(heldWeeks, '주')}는 그대로 뒀습니다.`,
  });

  // ── 문안 8: 최대 하락 ──
  // 저점 시점의 주에 편성 행이 있었는지로 뒷문장이 갈린다. 둘 다 사실이다.
  let peak = 0;
  let worst = 0;
  let trough = 0;
  let peakAtTrough = 0;
  let troughIdx = 0;
  for (let i = 0; i < curve.values.length; i++) {
    const v = curve.values[i];
    if (v <= 0) continue;
    if (v > peak) peak = v;
    const dd = v / peak - 1;
    if (dd < worst) {
      worst = dd;
      trough = v;
      peakAtTrough = peak;
      troughIdx = i;
    }
  }
  if (worst < 0 && peakAtTrough > 0) {
    const troughWeek = weekOfDateStr(dates[troughIdx]);
    const changedThatWeek = rows.some((r) => r.weekOf === troughWeek);
    out.push({
      id: 'drawdown',
      text: `가장 큰 하락 추세에서 ${manWon(peakAtTrough)}이 ${manWon(trough)}까지 내려갔습니다. 그 주에 배분을 ${changedThatWeek ? '바꿨습니다' : '바꾸지 않았습니다'}.`,
    });
  }

  // ── 문안 9: 현금 (0이면 뜨지 않는다) ──
  const avgReserve = rows.reduce((s, r) => s + reserveWeight(r.weights), 0) / rows.length;
  if (avgReserve >= 1) {
    out.push({
      id: 'cash',
      text: `평균 ${manWon((SEED_AMOUNT * avgReserve) / 100)}은 현금으로 뒀습니다. 잃지도, 늘지도 않았습니다.`,
    });
  }

  // ── 문안 10: 급락장 ──
  const drill = runDrill(
    latest.weights,
    'crash-recover',
    (latest.details as Record<string, Record<string, number>> | null) ?? undefined,
  );
  const troughMonths = Math.max(1, Math.round(drill.troughTradingDays / 21));
  out.push({
    id: 'drill',
    text: `2020년 급락장에 이 배분을 넣으면 ${manWon(drill.troughValue)}까지 내려갑니다. 저점까지 약 ${troughMonths}개월이 걸립니다.`,
  });

  // ── 문안 11: 내 조정이 움직인 금액 (편성이 하나뿐이면 뜨지 않는다) ──
  // ★ 같은 엔진에 이력 배열만 바꿔 넣는다. 첫 편성을 끝까지 유지한 반사실 곡선이다.
  // ★ 크기만 적는다. 합성 시세에서 어느 쪽이 높은지는 우연이고, 우리 데이터가 뒷받침하지 못한다.
  if (rows.length > 1) {
    const held = computeCurve(dates, series, [history[0]], cashflows);
    const diff = Math.abs(
      (curve.values[curve.values.length - 1] ?? 0) - (held.values[held.values.length - 1] ?? 0),
    );
    out.push({
      id: 'attrib',
      text: `${spanWeeks}주 동안 배분을 바꿔서 움직인 금액은 ${manWon(diff)}입니다. 나머지는 시장이 움직였습니다.`,
    });
  }

  return out;
}

/** AI-8 입력용 요약 비중. 주식 3전선을 합쳐 기관 분류와 견줄 수 있게 만든다 */
export function myAssetMix(w: Weights): { equity: number; bond: number; cash: number } {
  return {
    equity: (w.KR_STOCK ?? 0) + (w.US_STOCK ?? 0) + (w.INTL_STOCK ?? 0),
    bond: w.BOND ?? 0,
    cash: 100 - placedSum(w),
  };
}
```

- [ ] **Step 6: 통과를 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsx scripts/checks/p1-26-principles-copy.ts`
Expected: PASS — `고정 문안 ...건 · 사실 문장 ...건 규칙 통과 (부정형 허용, 명령형·라벨·추천·일치율 차단)`

- [ ] **Step 7: `verify.sh`에 등록한다**

Modify `scripts/verify.sh` — `run_check P1-25` 다음 줄:

```bash
run_check P1-26 scripts/checks/p1-26-principles-copy.ts
```

- [ ] **Step 8: 타입 검사와 린트**

Run: `cd /Users/barella/projects/jedaero && npx tsc --noEmit && npx eslint lib/principles scripts/checks/p1-26-principles-copy.ts lib/format.ts`
Expected: exit 0

- [ ] **Step 9: 커밋**

```bash
cd /Users/barella/projects/jedaero
git add lib/principles/facts.ts lib/principles/copy.ts lib/format.ts scripts/checks/p1-26-principles-copy.ts scripts/verify.sh
git commit -m "feat: 사실 문장 계산 + 문안 규칙 검사기 (P1-26)"
```

---

## Task 3: AI-8 — 왜 다른가

**Files:**
- Create: `lib/ai/principles.ts`
- Create: `app/actions/principles.ts`
- Create: `scripts/checks/p1-27-principles-ai.ts`
- Modify: `scripts/verify.sh` (`run_check P1-26` 다음 줄)

**Interfaces:**
- Consumes: Task 2의 `myAssetMix`, Task 1의 `BENCHMARKS`
- Produces:
  - `PrinciplesAiInput` — 숫자만 담긴 평평한 객체
  - `buildPrinciplesInput(mix): PrinciplesAiInput`
  - `principlesFallback(input): PrincipleNarrative`
  - `generatePrinciplesNarrative(input): Promise<PrincipleNarrative | null>`
  - `PrincipleNarrative = { text: string; question: string }`
  - `generatePrinciplesAction(): Promise<PrinciplesResult>`

- [ ] **Step 1: 검증 스크립트를 먼저 쓴다**

Create `scripts/checks/p1-27-principles-ai.ts`:

```ts
// P1-27: AI-8 폴백이 두 가드를 통과하는가
// ★ 폴백이 가드에 걸리면 킬스위치를 내렸을 때 화면이 빈다. 그것이 가장 조용한 실패다.
// ★ output-guard의 ADVICE_PATTERN은 「필요합니다」·「고려」·「좋습니다」도 폐기한다.
//   설계 문서 §5의 예시 문안이 「필요합니다」였고, 그대로 쓰면 AI 출력이 매번 버려진다.
import { readFileSync } from 'node:fs';
import { buildPrinciplesInput, principlesFallback } from '../../lib/ai/principles';
import { verifyFactualOutput } from '../../lib/ai/output-guard';
import { verifyNumbersFrom } from '../../lib/ai/number-guard';

let failed = 0;
const fail = (msg: string) => {
  console.log(msg);
  failed += 1;
};

const CASES = [
  { equity: 60, bond: 20, cash: 20 },
  { equity: 90, bond: 10, cash: 0 },
  { equity: 0, bond: 0, cash: 100 },
  { equity: 55, bond: 30, cash: 15 },
];

for (const mix of CASES) {
  const input = buildPrinciplesInput(mix);
  const fb = principlesFallback(input);
  const whole = `${fb.text} ${fb.question}`;

  const factual = verifyFactualOutput(whole);
  if (!factual.ok) fail(`폴백이 output-guard에 걸림 (${factual.reason}) — mix=${JSON.stringify(mix)}: ${whole}`);

  const nums = verifyNumbersFrom(whole, input);
  if (!nums.ok) fail(`폴백이 number-guard에 걸림 (${nums.reason} ${nums.value}) — ${whole}`);

  if (!/\?$/.test(fb.question.trim())) fail(`질문이 물음표로 끝나지 않음: ${fb.question}`);
  if (whole.length > 400) fail(`폴백이 너무 김 (${whole.length}자)`);
  if (!whole.includes('사용자님')) fail(`호칭 「사용자님」 없음: ${whole}`);
}

// 프롬프트에 금지 어휘가 남아 있지 않은가 — 있으면 출력이 매번 폐기된다
const src = readFileSync('lib/ai/principles.ts', 'utf8');
for (const banned of ['필요합니다', '고려', '좋습니다', '권장']) {
  // 금지 목록을 «나열하는» 줄은 제외하고, 프롬프트 본문에 섞였는지만 본다
  const lines = src.split('\n').filter((l) => l.includes(banned) && !l.includes('금지'));
  if (lines.length > 0) fail(`프롬프트/폴백에 금지 어휘 「${banned}」: ${lines[0].trim().slice(0, 60)}`);
}

if (failed > 0) process.exit(1);
console.log(`AI-8 폴백 ${CASES.length}케이스가 output-guard·number-guard 통과 (금지 어휘 0건)`);
```

- [ ] **Step 2: 실패를 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsx scripts/checks/p1-27-principles-ai.ts`
Expected: FAIL — `Cannot find module '../../lib/ai/principles'`

- [ ] **Step 3: AI-8을 만든다**

Create `lib/ai/principles.ts`:

```ts
// AI-8: 왜 다른가 — 내 배분과 공표 기관 배분의 «차이의 이유»를 목적·기간으로 서술
// ★ 숫자는 규칙이 만든다. LLM은 문장만 쓴다 (docs/AI-ROLES.md ②/④).
// ★ 어느 배분이 낫다고 말하지 않는다. 그 순간 목표 비중 제시가 된다 (C10).
// ★ 사용자 자유 텍스트를 입력으로 받지 않는다 — 전부 서버 계산값과 상수다. 인젝션 표면이 없다.
// ★ 금지 어휘: output-guard의 ADVICE_PATTERN이 폐기하는 어미·자문 어휘를 프롬프트에도 쓰지 않는다.
//   프롬프트가 그 단어를 쓰면 LLM이 따라 쓰고, 출력이 매번 버려져 폴백만 보인다.
import OpenAI from 'openai';
import { BENCHMARKS } from '../../db/seed/benchmarks';
import { verifyNumbersFrom } from './number-guard';
import { verifyFactualOutput } from './output-guard';

export type PrincipleNarrative = { text: string; question: string };

export type PrinciplesAiInput = {
  내_주식비중: number;
  내_채권비중: number;
  내_현금비중: number;
  국민연금_주식비중: number;
  국민연금_채권비중: number;
  노르웨이_주식목표: number;
  노르웨이_주식실제: number;
};

const sliceOf = (id: string, name: string) => {
  const b = BENCHMARKS.find((x) => x.id === id);
  const s = b?.slices.find((x) => x.name === name);
  if (!s) throw new Error(`기준선 ${id}의 ${name} 항목이 없습니다.`);
  return s.pct;
};

const r1 = (x: number) => Math.round(x * 10) / 10;

export function buildPrinciplesInput(mix: {
  equity: number;
  bond: number;
  cash: number;
}): PrinciplesAiInput {
  return {
    내_주식비중: r1(mix.equity),
    내_채권비중: r1(mix.bond),
    내_현금비중: r1(mix.cash),
    국민연금_주식비중: r1(sliceOf('NPS', '국내주식') + sliceOf('NPS', '해외주식')),
    국민연금_채권비중: r1(sliceOf('NPS', '국내채권') + sliceOf('NPS', '해외채권')),
    노르웨이_주식목표: sliceOf('GPFG_STRATEGY', '주식'),
    노르웨이_주식실제: sliceOf('GPFG_ACTUAL', '주식'),
  };
}

const SYSTEM_PROMPT = `너는 병사의 자산 배분과 «공표된 기관 배분»의 차이를 설명하는 도구다.

규칙 (어기면 출력이 폐기된다):
- 어느 배분이 낫다고 말하지 않는다. 조언·평가·권유를 하지 않는다.
- 금지 어휘: "~하세요", "~하십시오", "권장", "추천", "고려", "필요합니다", "낫습니다", "유리합니다", "좋습니다", "전망", "목표가", "매수", "매도".
- "공격적", "보수적", "안정형" 같은 성향 라벨을 붙이지 않는다.
- 주어진 숫자만 쓴다. 새 숫자를 계산하거나 지어내지 않는다.
- 차이가 «왜» 생기는지를 기관의 자금 목적·지급 의무·운용 기간으로만 설명한다.
  국민연금은 연금 지급이 매달 나가는 기관이다. 노르웨이 국부펀드는 세대를 넘겨 운용한다.
  병사의 목돈은 한 번 들어오고 나갈 날이 정해져 있지 않다.
- "합니다"체. 상대는 "사용자님"이라고 부른다.
- 사실 3~4문장을 쓰고, 마지막에 스스로 돌아보게 하는 열린 질문 1개를 쓴다.
- 250자 이내.

출력 형식(JSON):
{"text": "사실 문장들", "question": "열린 질문 1개"}`;

/** 규칙 기반 폴백. 킬스위치·429·가드 폐기에서 같은 자리에 뜬다 — 화면이 비지 않는다.
 *  ★ 이 문장이 output-guard·number-guard를 통과해야 한다 (P1-27이 지킨다). */
export function principlesFallback(input: PrinciplesAiInput): PrincipleNarrative {
  return {
    text: `국민연금은 주식 ${input.국민연금_주식비중}%, 채권 ${input.국민연금_채권비중}%입니다. 사용자님은 주식 ${input.내_주식비중}%, 채권 ${input.내_채권비중}%, 현금 ${input.내_현금비중}%입니다. 국민연금은 연금 지급이 매달 나가는 기관이라 값이 흔들려도 팔 수 있는 자산을 함께 들고 있습니다. 사용자님의 목돈은 나갈 날이 정해져 있지 않습니다. 어느 쪽이 맞아서 생긴 차이가 아닙니다.`,
    question: '이 돈을 언제 쓸 생각인지 정해 두셨습니까?',
  };
}

export async function generatePrinciplesNarrative(
  input: PrinciplesAiInput,
): Promise<PrincipleNarrative | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const client = new OpenAI();
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(input) },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.3,
    });
    const raw = res.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { text?: unknown; question?: unknown };
    if (typeof parsed.text !== 'string' || typeof parsed.question !== 'string') return null;
    const out: PrincipleNarrative = { text: parsed.text.trim(), question: parsed.question.trim() };
    if (!out.text || !out.question) return null;

    const whole = `${out.text} ${out.question}`;
    if (!verifyFactualOutput(whole).ok) return null;
    if (!verifyNumbersFrom(whole, input).ok) return null;
    return out;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 서버 액션을 만든다**

Create `app/actions/principles.ts`:

```ts
'use server';
// AI-8 서버 액션 — guardedAiCall이 킬스위치·429·호출 기록을 담당한다 (기존 파이프라인 그대로).
// ★ 요일로 잠그지 않는다. 심사 5일이 전부 평일이므로 잠기면 평가에서 사라진다.
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db';
import { allocations } from '../../db/schema';
import { guardedAiCall } from '../../lib/ai/guard';
import {
  buildPrinciplesInput,
  generatePrinciplesNarrative,
  principlesFallback,
  type PrincipleNarrative,
} from '../../lib/ai/principles';
import { myAssetMix } from '../../lib/principles/facts';
import { getSessionUser } from '../../lib/session';
import type { Weights } from '../../lib/constants';

export type PrinciplesResult =
  | { narrative: PrincipleNarrative; source: 'ai' | 'rule'; notice?: string }
  | { error: string };

export async function generatePrinciplesAction(): Promise<PrinciplesResult> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const rows = await db
    .select({ weights: allocations.weights })
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom));
  if (rows.length === 0) return { error: '아직 편성 기록이 없습니다. 주말에 첫 편성을 확정하면 열립니다.' };

  const latest = rows[rows.length - 1].weights as Weights;
  const input = buildPrinciplesInput(myAssetMix(latest));

  const result = await guardedAiCall(user.id, 'AI-8', () => generatePrinciplesNarrative(input));
  if ('ok' in result) return { narrative: result.ok, source: 'ai' };
  return { narrative: principlesFallback(input), source: 'rule', notice: result.message };
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsx scripts/checks/p1-27-principles-ai.ts`
Expected: PASS — `AI-8 폴백 4케이스가 output-guard·number-guard 통과 (금지 어휘 0건)`

- [ ] **Step 6: `verify.sh`에 등록한다**

Modify `scripts/verify.sh` — `run_check P1-26` 다음 줄:

```bash
run_check P1-27 scripts/checks/p1-27-principles-ai.ts
```

- [ ] **Step 7: 타입 검사와 린트**

Run: `cd /Users/barella/projects/jedaero && npx tsc --noEmit && npx eslint lib/ai/principles.ts app/actions/principles.ts scripts/checks/p1-27-principles-ai.ts`
Expected: exit 0

- [ ] **Step 8: 커밋**

```bash
cd /Users/barella/projects/jedaero
git add lib/ai/principles.ts app/actions/principles.ts scripts/checks/p1-27-principles-ai.ts scripts/verify.sh
git commit -m "feat: AI-8 차이 서술 + 규칙 폴백 (P1-27)"
```

---

## Task 4: 화면

**Files:**
- Create: `app/(app)/principles/page.tsx`
- Create: `components/principles-sheet.tsx`
- Create: `components/principles-ai.tsx`
- Modify: `app/(app)/home/page.tsx` (하단 `JobLinks` 항목 추가)
- Modify: `app/(app)/learn/page.tsx` (하단 `JobLinks` 항목 추가)

**Interfaces:**
- Consumes: `buildPrincipleSentences`·`PrincipleSentence`(Task 2), `FIXED_COPY`·`staleNotice`(Task 2), `benchmarkRows`·`SPIVA`(Task 1), `generatePrinciplesAction`(Task 3)
- Produces: `/principles` 라우트. `PrinciplesSheet`가 체크된 문장 id를 `/principles/image?lines=` 링크로 넘긴다 (Task 5가 그 라우트를 만든다)

- [ ] **Step 1: 화면을 만든다**

Create `app/(app)/principles/page.tsx`:

```tsx
// S12 나의 투자 원칙 — 전역 시점 산출물 (설계 문서)
// ★ 평일에도 전부 열린다. 심사 5일이 전부 평일이므로 잠기면 평가에서 사라진다.
//   지표 교체와 충돌하지 않는다 — 여기 숫자는 누적·최대낙폭처럼 «느린 숫자»이고
//   「이번 주 변동」이 없다. 제대로 지수 점수를 넣지 않는 이유도 같다 (주말 전용이므로).
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { SPIVA } from '@/db/seed/benchmarks';
import { PageHeader } from '@/components/page-header';
import { SourceChip } from '@/components/source-chip';
import { PrinciplesSheet } from '@/components/principles-sheet';
import { PrinciplesAi } from '@/components/principles-ai';
import { kstToday } from '@/lib/day-type';
import { pricesUpTo } from '@/lib/portfolio/prices';
import { benchmarkRows } from '@/lib/principles/benchmarks';
import { FIXED_COPY, staleNotice } from '@/lib/principles/copy';
import { buildPrincipleSentences, type PrincipleRow } from '@/lib/principles/facts';
import { getSessionUser } from '@/lib/session';
import { weekOf } from '@/lib/week';
import type { Weights } from '@/lib/constants';
import type { Details } from '@/lib/portfolio/details';

export default async function PrinciplesPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="space-y-4">
        <PageHeader title={FIXED_COPY.title} description="세션이 없습니다." />
      </div>
    );
  }

  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom), asc(allocations.decidedAt));

  const today = kstToday();
  const bench = benchmarkRows(today);
  const stale = bench.filter((b) => b.stale);

  const principleRows: PrincipleRow[] = rows.map((r) => ({
    weekOf: r.weekOf,
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Weights,
    details: (r.details as Details | null) ?? null,
  }));
  const { dates, series } = pricesUpTo(today);
  const sentences =
    principleRows.length > 0
      ? buildPrincipleSentences({
          rows: principleRows,
          currentWeek: weekOf(new Date()),
          dates,
          series,
        })
      : [];

  return (
    <div className="space-y-8 pb-4">
      <PageHeader
        title={FIXED_COPY.title}
        description={FIXED_COPY.subtitle}
        badge={<SourceChip kind="human" label="확정은 본인이 합니다" />}
      />

      {sentences.length === 0 ? (
        <p className="rounded-xl border border-border px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          아직 편성 기록이 없습니다. 주말에 첫 편성을 확정하면 이 화면이 채워집니다.
        </p>
      ) : (
        <PrinciplesSheet sentences={sentences} />
      )}

      {/* ── 기준선 비교 ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{FIXED_COPY.benchTitle}</h2>
        <SourceChip kind="rule" />
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.benchLead}</p>

        <ul className="space-y-2">
          {bench.map((b) => (
            <li key={b.id} className="rounded-xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">{b.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {b.slices.map((s) => `${s.name} ${s.pct}`).join(' · ')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {b.note} · {b.asOf} 기준 ·{' '}
                <a href={b.sourceUrl} className="underline" target="_blank" rel="noreferrer noopener">
                  출처
                </a>
              </p>
            </li>
          ))}
        </ul>

        {stale.length > 0 ? (
          <p className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            {stale.map((b) => staleNotice(b.label, b.asOf)).join(' ')}
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.mappingNote}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.gapNote}</p>
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-sm font-semibold leading-relaxed">{FIXED_COPY.spiva}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {FIXED_COPY.spivaSource}{' '}
            <a href={SPIVA.sourceUrl} className="underline" target="_blank" rel="noreferrer noopener">
              출처
            </a>
          </p>
        </div>
      </section>

      {/* ── AI-8 ── */}
      {sentences.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{FIXED_COPY.aiTitle}</h2>
          <PrinciplesAi />
          <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.aiNoAnswer}</p>
        </section>
      ) : null}

      {/* ── 전이 ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{FIXED_COPY.transferTitle}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.transfer}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.twrSplit}</p>
      </section>

      <footer className="space-y-1 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">{FIXED_COPY.footerSim}</p>
        <p className="text-xs text-muted-foreground">{FIXED_COPY.footerNoRec}</p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: 체크박스 + 저장 링크를 만든다**

Create `components/principles-sheet.tsx`:

```tsx
'use client';
// 사실 문장 체크박스 + 이미지 저장 링크
// ★ 선택을 서버에 저장하지 않는다. 링크의 문장 id로만 넘긴다.
//   이미지 라우트가 세션에서 문장을 «다시 계산»하므로 사용자 입력이 렌더러에 닿지 않는다.
import { useState } from 'react';
import type { PrincipleSentence } from '@/lib/principles/facts';
import { FIXED_COPY } from '@/lib/principles/copy';
import { SourceChip } from '@/components/source-chip';

export function PrinciplesSheet({ sentences }: { sentences: PrincipleSentence[] }) {
  const [picked, setPicked] = useState<string[]>(() => sentences.map((s) => s.id));
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const href = `/principles/image?lines=${picked.join(',')}`;

  return (
    <section className="space-y-3">
      <SourceChip kind="rule" />
      <p className="text-xs text-muted-foreground">{FIXED_COPY.checkHint}</p>

      <ul className="space-y-2">
        {sentences.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-muted-foreground/40">
              <input
                type="checkbox"
                checked={picked.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="text-sm leading-relaxed">{s.text}</span>
            </label>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.saveNote}</p>

      {picked.length > 0 ? (
        <a
          href={href}
          download="나의-투자-원칙.png"
          className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {FIXED_COPY.saveButton}
        </a>
      ) : (
        <p className="text-xs text-muted-foreground">문장을 하나 이상 남기면 저장할 수 있습니다.</p>
      )}
    </section>
  );
}
```

- [ ] **Step 3: AI 버튼을 만든다**

Create `components/principles-ai.tsx`:

```tsx
'use client';
// AI-8 호출 버튼. 배지 없이 AI 응답을 띄우지 않는다 (C9).
import { useState, useTransition } from 'react';
import { generatePrinciplesAction, type PrinciplesResult } from '@/app/actions/principles';
import { AiNotice } from '@/components/ai-notice';
import { SourceChip } from '@/components/source-chip';

export function PrinciplesAi() {
  const [result, setResult] = useState<PrinciplesResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {result === null ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => setResult(await generatePrinciplesAction()))}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:border-muted-foreground/40 disabled:opacity-60"
        >
          {pending ? '읽는 중…' : '왜 다른지 보기'}
        </button>
      ) : 'error' in result ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {result.error}
        </p>
      ) : (
        <div className="space-y-2 rounded-xl border border-border px-4 py-3.5">
          {result.source === 'ai' ? <AiNotice /> : <SourceChip kind="rule" />}
          <p className="text-sm leading-relaxed">{result.narrative.text}</p>
          <p className="text-sm font-semibold leading-relaxed">{result.narrative.question}</p>
          {result.notice ? (
            <p className="text-xs text-muted-foreground">{result.notice}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 진입 링크를 붙인다**

Modify `app/(app)/home/page.tsx` 및 `app/(app)/learn/page.tsx` — 각 파일의 `JobLinks` `items` 배열 끝에 항목을 추가한다:

```tsx
{ href: '/principles', label: '나의 투자 원칙', hint: '기록으로 한 장 만들기' },
```

> 하단 네비는 4개(홈·포트폴리오·지수·학습)를 유지한다. `/groups`와 같은 취급이다.

- [ ] **Step 5: 빌드로 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsc --noEmit && npx eslint app/\(app\)/principles components/principles-sheet.tsx components/principles-ai.tsx`
Expected: exit 0

- [ ] **Step 6: 문안 검사를 다시 돌린다 (화면이 문안 원본을 쓰는지)**

Run: `cd /Users/barella/projects/jedaero && npx tsx scripts/checks/p1-26-principles-copy.ts`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
cd /Users/barella/projects/jedaero
git add "app/(app)/principles/page.tsx" components/principles-sheet.tsx components/principles-ai.tsx "app/(app)/home/page.tsx" "app/(app)/learn/page.tsx"
git commit -m "feat: /principles 화면 + 홈·학습 진입"
```

---

## Task 5: 이미지 저장

**Files:**
- Create: `app/principles/image/route.tsx`
- Create: `assets/fonts/NotoSansKR-Regular.ttf` (다운로드)
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `buildPrincipleSentences`(Task 2), `FIXED_COPY`(Task 2), `BENCHMARKS`(Task 1), `PrinciplesSheet`가 만드는 `?lines=` 파라미터(Task 4)
- Produces: `GET /principles/image?lines=...` → PNG

- [ ] **Step 1: 한글 폰트를 넣는다**

```bash
cd /Users/barella/projects/jedaero
mkdir -p assets/fonts
curl -fsSL -o assets/fonts/NotoSansKR-Regular.ttf \
  https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf
ls -lh assets/fonts/
```

Expected: 파일이 생기고 크기가 0이 아니다 (수 MB).

> **왜 서브셋하지 않는가:** 전체 폰트를 넣으면 한글 글리프가 전부 있어 «빈 칸 렌더»가 구조적으로 불가능하다. `pyftsubset`(fonttools) 의존을 추가하지 않는 대가로 콜드스타트에 수 MB를 읽는다. 이미지 라우트 하나만 이 파일을 읽으므로 다른 화면에는 영향이 없다.
>
> **별명을 이미지에 넣지 않는 이유는 폰트가 아니라 데이터 최소화다.** 전체 폰트를 넣으면 글리프 문제는 사라지지만, 이 산출물은 신원이 아니라 판단을 담는다 (C4).

- [ ] **Step 2: 폰트를 서버 번들에 포함시킨다**

Modify `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /principles/image 가 fs로 읽는 폰트를 서버 번들에 포함시킨다.
  // 빠지면 배포 환경에서만 ENOENT가 나고 로컬에서는 재현되지 않는다.
  outputFileTracingIncludes: {
    '/principles/image': ['./assets/fonts/*.ttf'],
  },
};

export default nextConfig;
```

- [ ] **Step 3: 이미지 라우트를 만든다**

Create `app/principles/image/route.tsx`:

```tsx
// 나의 투자 원칙 — PNG 산출 (설계 문서 §8)
// ★ 클라이언트는 문장 id만 보낸다. 문장 텍스트는 서버가 세션에서 다시 계산한다.
//   사용자 입력이 렌더러에 닿지 않으므로 주입 경로가 없다.
// ★ 생성 결과를 저장하지 않는다. 파일·DB·로그 어디에도 쓰지 않는다 —
//   문안의 「서버에 보관하지 않습니다」가 정확한 서술이어야 한다.
// ★ 별명을 넣지 않는다 (C4).
// ★ Satori는 CSS 서브셋만 지원한다. oklch()·color-mix()를 쓰지 않고 hex로 적는다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { asc, eq } from 'drizzle-orm';
import { ImageResponse } from 'next/og';
import { db } from '../../../db';
import { allocations } from '../../../db/schema';
import { BENCHMARKS } from '../../../db/seed/benchmarks';
import { kstToday } from '../../../lib/day-type';
import { pricesUpTo } from '../../../lib/portfolio/prices';
import { buildPrincipleSentences, type PrincipleRow } from '../../../lib/principles/facts';
import { getSessionUser } from '../../../lib/session';
import { weekOf } from '../../../lib/week';
import type { Weights } from '../../../lib/constants';
import type { Details } from '../../../lib/portfolio/details';

export const runtime = 'nodejs';

const FONT = readFileSync(join(process.cwd(), 'assets/fonts/NotoSansKR-Regular.ttf'));

const BG = '#09090b';
const FG = '#fafafa';
const MUTED = '#a1a1aa';
const LINE = '#27272a';
const ACCENT = '#fbbf24';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response('세션이 없습니다.', { status: 401 });

  const requested = new URL(request.url).searchParams.get('lines') ?? '';
  const wanted = new Set(requested.split(',').filter(Boolean));

  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom), asc(allocations.decidedAt));
  if (rows.length === 0) return new Response('편성 기록이 없습니다.', { status: 404 });

  const today = kstToday();
  const principleRows: PrincipleRow[] = rows.map((r) => ({
    weekOf: r.weekOf,
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Weights,
    details: (r.details as Details | null) ?? null,
  }));
  const { dates, series } = pricesUpTo(today);
  const all = buildPrincipleSentences({
    rows: principleRows,
    currentWeek: weekOf(new Date()),
    dates,
    series,
  });
  const picked = all.filter((s) => wanted.has(s.id));
  if (picked.length === 0) return new Response('문장을 하나 이상 선택해주세요.', { status: 400 });

  const nps = BENCHMARKS.find((b) => b.id === 'NPS');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BG,
          color: FG,
          padding: '64px',
          fontFamily: 'NotoSansKR',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: 22, color: ACCENT }}>제대로</div>
          <div style={{ fontSize: 52 }}>나의 투자 원칙</div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginTop: '44px',
            borderTop: `2px solid ${LINE}`,
            paddingTop: '36px',
          }}
        >
          {picked.map((s) => (
            <div key={s.id} style={{ display: 'flex', fontSize: 27, lineHeight: 1.5 }}>
              {s.text}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: 'auto',
            borderTop: `2px solid ${LINE}`,
            paddingTop: '28px',
            fontSize: 18,
            color: MUTED,
          }}
        >
          <div style={{ display: 'flex' }}>
            기준선은 국민연금 {nps?.asOf} 의결 기준입니다. 이 기록은 {today} 기준입니다.
          </div>
          <div style={{ display: 'flex' }}>
            교육용 모의 데이터입니다. 실제 거래는 일어나지 않습니다. 특정 상품이나 종목을 추천하지
            않습니다.
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [{ name: 'NotoSansKR', data: FONT, weight: 400, style: 'normal' }],
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
```

- [ ] **Step 4: 빌드로 확인한다**

Run: `cd /Users/barella/projects/jedaero && npx tsc --noEmit && npm run build 2>&1 | tail -25`
Expected: `/principles` 와 `/principles/image` 라우트가 목록에 나오고 exit 0.
(`DATABASE_URL`이 없으면 `db/index.ts`가 모듈 로드 시점에 죽어 빌드가 실패한다 — 그때는 `.env.local`을 먼저 채운다.)

- [ ] **Step 5: 실제로 PNG가 나오는지 눈으로 본다**

```bash
cd /Users/barella/projects/jedaero
npx next start -p 3140 &
sleep 6
curl -sL -c /tmp/jar -b /tmp/jar -o /dev/null http://localhost:3140/demo
curl -s -b /tmp/jar "http://localhost:3140/principles/image?lines=alloc,spread,decisions,drawdown,drill,attrib" -o /tmp/principles.png
file /tmp/principles.png
```

Expected: `/tmp/principles.png: PNG image data, 1080 x 1350`
그리고 이미지를 열어 **한글이 빈 칸으로 찍히지 않았는지** 확인한다. 확인 후 `kill %1`.

- [ ] **Step 6: 커밋**

```bash
cd /Users/barella/projects/jedaero
git add "app/principles/image/route.tsx" next.config.ts assets/fonts/NotoSansKR-Regular.ttf
git commit -m "feat: 나의 투자 원칙 PNG 산출 (next/og, 서버 렌더)"
```

> **폴백:** Step 5에서 한글이 깨지거나 빌드가 서지 않으면 **이 Task를 되돌리고** `components/principles-sheet.tsx`의 저장 링크를 `<button onClick={() => window.print()}>인쇄 · PDF로 저장</button>`으로 바꾼다. 화면 본편(Task 4)은 그것과 무관하게 동작한다. 되돌린 사실을 `docs/FAILURE-LOG.md`에 한 줄 남긴다.

---

## Task 6: 문서 반영

**Files:**
- Modify: `SPEC.md` (§2 `ai_calls` 주석, §4 AI 표, §6 화면 표, §8 구현 상태)
- Modify: `docs/VERIFY.md` (P1 표에 P1-25·26·27, §B 심사 시나리오)
- Modify: `README.md` (사람이 직접 해야 하는 것 — 갱신 캘린더)

**Interfaces:**
- Consumes: Task 1~5의 산출물
- Produces: 문서 = 제품

- [ ] **Step 1: `SPEC.md`를 고친다**

§2 데이터 모델의 `ai_calls` 주석에서 `-- kind: AI-3|AI-4|AI-5|AI-7` 을 다음으로 바꾼다:

```
  kind text NOT NULL,           -- AI-3|AI-4|AI-5|AI-7|AI-8
```

§4 AI 적용 지점 표의 `AI-7` 행 다음에 추가:

```
| **AI-8** | 유지 | 나의 투자 원칙 — 내 배분과 공표 기관 배분의 «차이의 이유»를 목적·기간으로 서술. 어느 배분이 낫다고 말하지 않는다 |
```

§6 화면 표의 `S11` 행 다음에 추가:

```
| S12 | `/principles` | 나의 투자 원칙 | 측정된 사실 문장 + 공표 기관 배분 비교 + AI-8. 이미지 저장. 하단 네비 없음(홈·학습에서 진입) |
```

§8 구현 상태의 「동작 중」 목록 끝에 `·**나의 투자 원칙(AI-8)**` 을 덧붙인다.

- [ ] **Step 2: `docs/VERIFY.md`를 고친다**

P1 표 끝에 추가:

```
| P1-25 | 기준선 상수 | 배분 합계 100 · `asOf`/`sourceUrl`/`nextReviewAt` 존재 · 갱신 경과는 경고(exit 0) |
| P1-26 | 문안 규칙 | 고정 문안·사실 문장에 명령형·성향 라벨·「추천」·「최적」·「일치율」 없음 (부정형은 허용) |
| P1-27 | AI-8 폴백 | 폴백 문장이 `output-guard`·`number-guard`를 통과 |
```

§B 심사자 시나리오 끝에 추가:

```
| 22 | 평일 → `/principles` | **열림.** 사실 문장에 숫자가 채워지고, 기준선 4종에 기준일·출처가 붙는다. 제대로 지수 점수는 없다 |
| 23 | `/principles`에서 「왜 다른지 보기」 | AI 배지 + 사실 서술 + 질문 1개. 조언 없음. 키가 없으면 규칙 폴백이 같은 자리에 뜬다 |
| 24 | 문장 체크를 풀고 「이미지로 저장」 | 선택한 문장만 담긴 PNG. 별명 없음. 기준일이 이미지에 각인됨 |
```

- [ ] **Step 3: `README.md`를 고친다**

「사람이 직접 해야 하는 것」 목록 끝에 추가:

```markdown
- [ ] 기준선 갱신 확인 — **1월·6월 국민연금 / 2월·8월 노르웨이 / 3월·9월 SPIVA** (`db/seed/benchmarks.ts`)
```

- [ ] **Step 4: 전체 검증을 돌린다**

Run: `cd /Users/barella/projects/jedaero && bash scripts/verify.sh 2>&1 | tail -20`
Expected: P1-25·P1-26·P1-27이 PASS. `DATABASE_URL`이 없으면 DB 항목은 FAIL이 정상이다.

- [ ] **Step 5: 커밋**

```bash
cd /Users/barella/projects/jedaero
git add SPEC.md docs/VERIFY.md README.md
git commit -m "docs: 나의 투자 원칙 반영 (S12, AI-8, P1-25~27, 기준선 갱신 캘린더)"
```

---

## Self-Review

**1. 스펙 커버리지**

| 스펙 절 | 담당 Task |
|---|---|
| §1 만드는 것 1 (사실 문장) | Task 2 |
| §1 만드는 것 2 (비교표) | Task 1 · 4 |
| §1 만드는 것 3 (AI-8) | Task 3 |
| §1 만드는 것 4 (이미지) | Task 5 |
| §1 만들지 않는 것 (새 테이블·일치율·지수 점수·미래 시제·라벨) | Task 2의 `violatesCopyRules` + P1-26 |
| §2 측정된 원칙 / 컨셉 버리기 / 자산군·섹터 | Task 2 `FIXED_COPY`(메타 설명 없음) |
| §3 외부 데이터 (기관 배분·매핑 정직성·노르웨이 갭·SPIVA) | Task 1 상수 · Task 2 문안 |
| §4 갱신 주기·저장 형태·자기신고·검증·수동 갱신 | Task 1 `nextReviewAt`·P1-25 · Task 4 배너 · Task 6 README |
| §5 문안 원문 31개 | Task 2 `FIXED_COPY` + Task 2 사실 문장 + Task 3 AI |
| §6 계산 (기존 함수 재사용·반사실·요일) | Task 2 |
| §7 AI-8 (프롬프트·가드·폴백) | Task 3 |
| §8 이미지 (서버 렌더·별명 제외·미보관·폴백) | Task 5 |
| §9 파일 목록 | 전 Task |
| §10 검증 P1-25·26·27 + 심사 시나리오 | Task 1·2·3 · Task 6 |
| §11 범위 밖 (초안 대조) | 착수하지 않음 |

**2. 스펙과 어긋나 이 계획에서 고친 것**

- 문안 10·17·23 (위 「문안 수정 3건」). §5 원문을 그대로 넣으면 각각 계산되지 않는 말·사실 오류·가드 폐기를 낳는다
- §9 파일 목록에 `lib/principles/copy.ts`가 없었다. 화면에만 문안을 두면 P1-26이 검사할 원본이 없어 규칙이 지켜지는지 알 수 없다 — 파일을 추가했다
- §9의 `lib/demo-seed.ts` 수정 행은 초안 대조(§11 범위 밖)용이므로 지웠다
- §8의 「별명 제외 = 글리프 위험」 근거는 전체 폰트를 넣으면 성립하지 않는다. 제외 결정은 유지하되 근거를 데이터 최소화(C4)로 바꿨다

**3. 타입 일관성 확인**

- `PrincipleRow`·`PrincipleSentence`·`PrincipleId`: Task 2 정의 → Task 4·5에서 같은 이름으로 사용 ✓
- `buildPrincipleSentences({ rows, currentWeek, dates, series })`: 인자 이름이 Task 2·4·5·P1-26에서 동일 ✓
- `myAssetMix` → `buildPrinciplesInput`: `{ equity, bond, cash }` 형태가 Task 2·3에서 동일 ✓
- `benchmarkRows(todayStr)` → `BenchmarkRow.stale`: Task 1 정의 → Task 4 사용 ✓
- `guardedAiCall(userId, kind, fn)`: 기존 `lib/ai/guard.ts` 시그니처 그대로 ✓
- `runDrill(weights, scenarioId, details?)`: 기존 시그니처 그대로 ✓
- `effectiveFronts(w)`·`reserveWeight(w)`·`maxDrawdown(values)`·`computeCurve(dates, series, history, cashflows)`: 전부 기존 시그니처 ✓
- `FIXED_COPY` 키: Task 2 정의 → Task 4 화면에서 같은 키로 참조 ✓

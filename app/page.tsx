import Link from 'next/link';
import { Reveal } from '@/components/reveal';
import {
  EFFECTIVE_FRONTS_FULL,
  INDEX_MAX,
  SHARPE_FULL,
  TURNOVER_ZERO,
} from '@/lib/jedaero-index';

// S1 랜딩 — 히어로(선택지 2개만) + 스크롤하며 기능이 순차 등장.
// 색 비율 6:3:1 — 바탕 background / 표면 card / 강조 primary. 강조색은 한 화면에 한 곳만.
// 리터럴 색을 쓰지 않는다. 토큰만 쓴다 — 테마를 한 곳(app/globals.css)에서 바꾸기 위해서다.
// 기능 화면에는 설명을 붙이지 않는다. 설명은 전부 여기서 끝낸다.

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{children}</p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-balance break-keep text-3xl font-bold leading-[1.25] tracking-tight sm:text-4xl">
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[52ch] break-keep text-[15px] leading-relaxed text-muted-foreground">{children}</p>;
}

/** 좌우 교차 배치 — 데스크톱에서 시선이 Z자로 흐른다 */
function Split({
  reverse = false,
  children,
}: {
  reverse?: boolean;
  children: [React.ReactNode, React.ReactNode];
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={reverse ? 'md:order-2' : undefined}>{children[0]}</div>
      <div className={reverse ? 'md:order-1' : undefined}>{children[1]}</div>
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

const FRONTS = [
  { name: '국내 주식', pt: 4 },
  { name: '미국 주식', pt: 4 },
  { name: '기타 해외', pt: 3 },
  { name: '채권', pt: 4 },
  { name: '금·원자재', pt: 3 },
  { name: '리츠·인프라', pt: 2 },
];

const INDEX_ROWS = [
  { label: '위험을 이긴 성과', hint: '위험 대비 성과', solo: 40, spread: 33, max: INDEX_MAX.grown },
  { label: '분산의 힘', hint: '실질 분산 정도', solo: 2, spread: 30, max: INDEX_MAX.spread },
  { label: '판단을 지킨 힘', hint: '목표 비중 유지', solo: 8, spread: 30, max: INDEX_MAX.held },
];

// 산정 근거 — ★ lib/jedaero-index.ts의 상수와 반드시 일치시킬 것.
// 심사에서 읽히는 화면이므로 실제 계산과 어긋나면 그 자체가 결함이다.
const METHOD = [
  {
    label: '위험을 이긴 성과',
    formula: '연환산 수익률 ÷ 연환산 변동성',
    full: `샤프 ${SHARPE_FULL} 이상이면 만점`,
    notes: [
      '무위험수익률을 0으로 둡니다. 어디에도 놓지 않은 예비대가 곧 무위험 자산이라, 이미 편성 안에 들어 있기 때문입니다. 밖에서 따로 빼지 않습니다.',
      '손실 구간은 0점이지 음수가 아닙니다.',
    ],
  },
  {
    label: '분산의 힘',
    formula: '1 ÷ Σ(비중²)',
    full: `유효 전선 ${EFFECTIVE_FRONTS_FULL}개 이상이면 만점`,
    notes: [
      '한 곳에 다 넣으면 1.0, 네 곳에 고르게 넣으면 4.0이 나옵니다. 여섯 칸에 나눴어도 한 칸이 90%면 실질은 1개에 가깝습니다.',
      '예비대도 한 몫으로 셉니다. 빼면 전부 예비대인 편성의 값이 무한대가 됩니다.',
    ],
  },
  {
    label: '판단을 지킨 힘',
    formula: '주당 평균 변경폭 = Σ|Δ목표비중| ÷ 2',
    full: `0%p면 만점, ${TURNOVER_ZERO}%p면 0점`,
    notes: [
      '체결량이 아니라 목표 비중의 변화량으로 잽니다. 그래서 흐트러진 비중을 목표로 되돌리는 리밸런싱은 여기에 잡히지 않습니다 — 같은 목표를 다시 확정하는 것이라 변화량이 0입니다.',
      '규칙으로 예외를 두지 않고 계산 방식이 그 구분을 대신합니다.',
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* ── 히어로 ───────────────────────────────── */}
      <section className="relative flex min-h-[92dvh] flex-col items-center justify-center px-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_38%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_70%)]"
        />
        <Reveal className="relative">
          <div className="mb-7 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            {['군 장병 맞춤 금융교육', '교육용 모의 서비스 · 실제 거래 없음'].map((label) => (
              <span key={label} className="rounded-full border border-border px-3 py-1">
                {label}
              </span>
            ))}
          </div>
          <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">제대로</h1>
          <p className="mx-auto mt-6 max-w-[24ch] text-balance break-keep text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
            전역 전, 첫 <span className="text-primary">2천만원</span>의 판단을 연습합니다
          </p>
          <p className="mx-auto mt-4 max-w-[38ch] text-pretty break-keep text-base leading-relaxed text-muted-foreground sm:text-lg">
            전역할 때 받게 될 목돈을, 복무 중에 미리 굴려보는 모의투자 훈련.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-faint">
            <span>평일에는 읽고</span>
            <span aria-hidden className="text-faint/50">·</span>
            <span>주말에 한 번 결정하고</span>
            <span aria-hidden className="text-faint/50">·</span>
            <span>AI는 질문만 합니다</span>
          </div>
        </Reveal>

        <Reveal delay={140} className="relative mt-12 w-full max-w-sm">
          <div className="flex flex-col gap-3">
            <Link
              href="/demo"
              prefetch={false}
              className="group flex h-14 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              3분 심사 데모 시작
            </Link>
            <Link
              href="/onboarding"
              className="flex h-14 items-center justify-center rounded-xl border border-input text-base font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-foreground/60 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              시작하기
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-faint/70">
            가입 없이 시장 읽기 → AI 코치 → 주말 편성 → 제대로 지수 → AI 회고
          </p>
        </Reveal>

        <div
          aria-hidden
          className="absolute bottom-8 flex flex-col items-center gap-2 text-faint/50 motion-safe:animate-bounce"
        >
          <span className="text-[11px] tracking-widest">SCROLL</span>
          <span className="h-8 w-px bg-gradient-to-b from-input to-transparent" />
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-24 px-6 pb-32 sm:space-y-28">
        {/* ── 1. 시드 ─────────────────────────────── */}
        <Reveal>
          <Split>
            <div className="flex flex-col gap-5">
              <Eyebrow>훈련 시드</Eyebrow>
              <SectionTitle>
                전역할 때 <span className="text-primary">2,000만원</span>을 받습니다
              </SectionTitle>
              <Body>
                장병내일준비적금을 채우면 목돈이 손에 들어옵니다. 문제는 그 돈을 처음 만지는 날이
                전역일이라는 것입니다. 처음 하는 판단을 가장 큰 금액으로 하게 됩니다.
              </Body>
              <Body>
                제대로는 그 판단을 복무 중에 미리 시켜봅니다. 전원 같은 금액으로 시작하니, 결과를
                가르는 것은 오직 편성뿐입니다.
              </Body>
            </div>
            <Panel className="text-center">
              <p className="text-sm text-faint">모의 시드</p>
              <p className="mt-2 font-mono text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
                20,000,000
              </p>
              <p className="mt-1 text-sm text-faint">원</p>
              <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
                실제 거래는 일어나지 않습니다. 훈련용 기준 금액입니다.
              </p>
            </Panel>
          </Split>
        </Reveal>

        {/* ── 2. 주말에 한 번 ──────────────────────── */}
        <Reveal>
          <Split reverse>
            <div className="flex flex-col gap-5">
              <Eyebrow>훈련 규율</Eyebrow>
              <SectionTitle>
                편성(목표 비중)은 <span className="text-primary">주말에 한 번</span>만 정합니다
              </SectionTitle>
              <Body>
                평일 일과 후 휴대전화 이용 환경에서는 국내 증시 장중 대응이 어렵습니다. 이 제약을
                짧은 시세 반응보다 긴 호흡의 판단을 연습하는 조건으로 바꿉니다.
              </Body>
              <Body>
                평일에는 전선이 어떻게 움직였는지만 읽습니다. 실행은 주말에 한 번. 바꾸지 않기로
                한 주도 그대로 기록됩니다.
              </Body>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Panel>
                <p className="text-xs font-semibold tracking-wider text-faint">평일</p>
                <p className="mt-3 text-lg font-semibold">읽고, 계획한다</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>전선 등락을 읽는다</li>
                  <li>학습 카드</li>
                  <li>편성 현황 보기</li>
                </ul>
              </Panel>
              <Panel className="border-primary/30 bg-primary/5">
                <p className="text-xs font-semibold tracking-wider text-primary/80">주말</p>
                <p className="mt-3 text-lg font-semibold">한 번 실행한다</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>편성 조정</li>
                  <li>이번 주 변동</li>
                  <li>제대로 지수</li>
                </ul>
              </Panel>
            </div>
          </Split>
        </Reveal>

        {/* ── 3. 포인트 편성 ───────────────────────── */}
        <Reveal>
          <Split>
            <div className="flex flex-col gap-5">
              <Eyebrow>편성</Eyebrow>
              <SectionTitle>
                6개 전선(자산군)에 <span className="text-primary">포인트 20개</span>를 놓습니다
              </SectionTitle>
              <Body>
                종목을 고르고 수량을 계산하는 대신, 포인트를 나눠 놓습니다. 몇 주를 몇 원에 살지가
                아니라 어디에 얼마나 걸지를 배우는 훈련입니다.
              </Body>
              <Body>
                더 깊이 들어가고 싶으면 각 전선 안에서 반도체·바이오 같은 테마로 다시 나눌 수
                있습니다. 놓지 않은 포인트는 예비대(현금성 자산)로 남습니다.
              </Body>
            </div>
            <Panel>
              <div className="flex flex-col gap-3.5">
                {FRONTS.map((f) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-sm text-muted-foreground">{f.name}</span>
                    <span className="flex flex-1 gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`h-2.5 flex-1 rounded-full ${i < f.pt ? 'bg-primary/70' : 'bg-secondary'}`}
                        />
                      ))}
                    </span>
                    <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums text-faint">
                      {f.pt}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-border pt-4 text-sm text-faint">
                합계 <span className="font-mono tabular-nums text-foreground">20</span> 포인트 · 1포인트 = 5%
              </p>
            </Panel>
          </Split>
        </Reveal>

        {/* ── 4. 브리핑 ───────────────────────────── */}
        <Reveal>
          <Split reverse>
            <div className="flex flex-col gap-5">
              <Eyebrow>평일</Eyebrow>
              <SectionTitle>
                오늘 시장이 어떻게 움직였는지 <span className="text-primary">한눈에</span>
              </SectionTitle>
              <Body>
                들어오면 오늘의 지형이 먼저 보입니다. 전선별 등락은 규칙으로 계산합니다. 내 손익이
                이번 주에 얼마나 흔들렸는지는 주말에 봅니다.
              </Body>
              <Body>
                AI는 숫자를 지어내지 않습니다. 등락은 규칙으로 먼저 계산하고, AI는 그 숫자를 받아
                읽기 좋게 정리한 뒤 질문을 되돌려줍니다. 결정은 본인이 합니다.
              </Body>
            </div>
            <Panel>
              <p className="text-xs font-semibold tracking-wider text-faint">오늘의 지형</p>
              <div className="mt-4 flex flex-col gap-3 font-mono text-sm tabular-nums">
                {[
                  ['국내 주식', '+1.2%', 'text-up'],
                  ['미국 주식', '+0.4%', 'text-up'],
                  ['채권', '−0.3%', 'text-down'],
                  ['금·원자재', '+0.9%', 'text-up'],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="font-sans text-muted-foreground">{k}</span>
                    <span className={c}>{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 break-keep rounded-lg border border-border bg-background/60 p-3 text-sm leading-relaxed text-muted-foreground">
                당신이 가장 많이 담은 전선이 오늘 올랐습니다. 지난주에는 반대였습니다.
              </p>
            </Panel>
          </Split>
        </Reveal>

        {/* ── 5. 제대로 지수 ★ ─────────────────────── */}
        <Reveal>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-5">
              <Eyebrow>제대로 지수</Eyebrow>
              <SectionTitle>
                많이 번 결과보다 <span className="text-primary">제대로 결정한 힘</span>을 봅니다
              </SectionTitle>
              <Body>
                한 번의 수익은 운일 수 있습니다. 제대로 지수는 위험을 감안한 성과, 분산의 구조,
                판단을 지킨 일관성을 함께 봅니다. 그래서 한 곳에 몰아 크게 벌어도 1등이 되지 않습니다.
              </Body>
            </div>

            <Panel className="border-primary/35 bg-primary/5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-primary/90">제대로 지수 산식</p>
                <p className="font-mono text-sm tabular-nums text-faint">총 100점</p>
              </div>
              <p className="mt-3 break-keep text-lg font-bold leading-relaxed text-foreground sm:text-xl">
                제대로 지수 = 위험을 이긴 성과 + 분산의 힘 + 판단을 지킨 힘
              </p>
              <div className="mt-6 grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
                {[
                  [`${INDEX_MAX.grown}점`, '위험을 이긴 성과', '많이 벌었는가가 아니라, 흔들림까지 감안한 성과'],
                  [`${INDEX_MAX.spread}점`, '분산의 힘', '실질적으로 몇 개의 자산군에 나누었는가'],
                  [`${INDEX_MAX.held}점`, '판단을 지킨 힘', '처음 정한 목표 비중을 얼마나 지켰는가'],
                ].map(([score, title, description], index) => (
                  <div key={title} className="contents">
                    {index > 0 ? (
                      <span aria-hidden className="hidden self-center text-2xl text-primary/70 sm:block">
                        +
                      </span>
                    ) : null}
                    <div className="rounded-xl border border-border bg-background/50 px-4 py-4">
                      <p className="font-mono text-2xl font-bold tabular-nums text-primary">{score}</p>
                      <p className="mt-2 font-semibold text-foreground">{title}</p>
                      <p className="mt-1.5 break-keep text-xs leading-relaxed text-faint">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 break-keep text-sm leading-relaxed text-foreground">
                <span className="font-semibold text-primary/90">결과에 주는 점수는 40점뿐입니다.</span> 나머지 60점은
                위험을 나누고, 처음의 판단을 지켜낸 과정에 줍니다.
              </p>
            </Panel>

            <Panel className="!p-0 overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <p className="text-sm font-semibold">같은 기간, 두 개의 판단</p>
                <p className="mt-1 text-xs text-faint">
                  수익률이 앞선 편성이 반드시 더 높은 점수를 받지는 않습니다.
                </p>
              </div>
              <div className="space-y-5 px-6 py-6">
                {INDEX_ROWS.map((r) => (
                  <div key={r.label}>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-foreground">{r.label}</span>
                      <span className="text-xs text-faint/70">{r.hint}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-faint">한 곳에 몰빵</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                          <span
                            className="block h-full rounded-full bg-faint"
                            style={{ width: `${(r.solo / r.max) * 100}%` }}
                          />
                        </span>
                        <span className="w-7 shrink-0 text-right font-mono text-xs tabular-nums text-faint">
                          {r.solo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-faint">6전선 분산</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                          <span
                            className="block h-full rounded-full bg-primary/80"
                            style={{ width: `${(r.spread / r.max) * 100}%` }}
                          />
                        </span>
                        <span className="w-7 shrink-0 text-right font-mono text-xs tabular-nums text-primary">
                          {r.spread}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border px-6 py-5">
                <span className="text-sm font-semibold">제대로 지수 합계</span>
                <span className="flex items-baseline gap-5 font-mono tabular-nums">
                  <span className="text-lg text-faint">
                    {INDEX_ROWS.reduce((a, r) => a + r.solo, 0)}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {INDEX_ROWS.reduce((a, r) => a + r.spread, 0)}
                  </span>
                </span>
              </div>
            </Panel>

            <Body>
              수익률만 보면 한 곳에 몰아넣은 편성이 다섯 배 앞섰습니다. 그러나 위험까지 감안하면 차이가
              줄고, 분산과 판단 유지를 더하면 결과가 뒤집힙니다. 배점은 임의가 아닙니다. 짧은 기간의
              수익률은 통계적으로 불안정하고, 잦은 거래는 개인투자자의 성과를 갉아먹는다는 연구에 근거합니다.
            </Body>

            {/* 산정 근거 — 핵심 설명은 남기되 상세 산식은 요청할 때만 연다. */}
            <details className="overflow-hidden rounded-2xl border border-border bg-card">
              <summary className="cursor-pointer px-6 py-4">
                <span className="text-sm font-semibold">계산 근거 자세히 보기</span>
                <p className="mt-1 text-xs text-faint">
                  세 축의 합이 {INDEX_MAX.grown + INDEX_MAX.spread + INDEX_MAX.held}점이고, 한 축만
                  밀어서는 만점이 나오지 않습니다. 한 곳에 몰아넣고 크게 벌어도 상한은{' '}
                  {INDEX_MAX.grown}점입니다.
                </p>
              </summary>
              <div className="divide-y divide-border">
                {METHOD.map((m) => (
                  <div key={m.label} className="px-6 py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="font-mono text-xs text-faint">{m.full}</p>
                    </div>
                    <p className="mt-2 overflow-x-auto whitespace-nowrap rounded-md bg-background/60 px-3 py-2 font-mono text-xs text-muted-foreground">
                      {m.formula}
                    </p>
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {m.notes.map((n) => (
                        <li key={n} className="break-keep text-[13px] leading-relaxed text-faint">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-6 py-5">
                <p className="text-xs font-semibold text-muted-foreground">배점 근거</p>
                <ul className="mt-2 flex flex-col gap-1.5 text-[13px] leading-relaxed text-faint">
                  <li className="break-keep">
                    Lo (2002), <i>The Statistics of Sharpe Ratios</i> — 샤프 비율은 관측 기간이
                    짧을수록 추정오차가 커집니다. 그래서 주간 수익률 하나로 줄을 세우지 않습니다.
                  </li>
                  <li className="break-keep">
                    Barber &amp; Odean (2000), <i>Trading Is Hazardous to Your Wealth</i> — 자주
                    거래한 개인투자자일수록 성과가 나빴습니다. 「판단을 지킨 힘」에 30점을 둔 이유입니다.
                  </li>
                  <li className="break-keep">
                    Benartzi &amp; Thaler (1995), 근시안적 손실회피 — 평가 주기가 투자 기간과
                    어긋나면 판단이 망가집니다. 주 1회 편성과 예비대 표시가 여기서 나왔습니다.
                  </li>
                </ul>
                <p className="mt-4 break-keep text-[13px] leading-relaxed text-faint">
                  등수 숫자는 만들지 않습니다. 목록도 점수순이 아니라 가입순입니다 — 정렬 자체가
                  등수가 되기 때문입니다. 수익 금액도 어디에도 표시하지 않습니다.
                </p>
              </div>
            </details>
          </div>
        </Reveal>

        {/* ── 5-B. 신뢰 설계 — 지수 뒤에 둔다. 방어가 아니라 설계 역량으로 읽혀야 한다 */}
        <Reveal>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <Eyebrow>신뢰 설계</Eyebrow>
              <SectionTitle>
                신뢰는 문구가 아니라 <span className="text-primary">구조</span>로 만듭니다
              </SectionTitle>
              <Body>
                숫자는 공개된 규칙이 계산하고, AI는 그 숫자를 정리해 질문만 돌려주며, 확정은 사람이 주말에
                한 번 합니다. 이 경계는 안내 문구가 아니라 코드가 강제합니다.
              </Body>
            </div>

            <Panel className="!p-0 overflow-hidden">
              <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  ['규칙', '계산', '수익률, 제대로 지수, 전선 등락을 공개된 규칙으로 계산합니다.'],
                  ['AI', '해석과 질문', '규칙이 만든 숫자를 읽기 좋게 정리하고 되묻습니다. 숫자를 만들지 않습니다.'],
                  ['사람', '확정', '주말에 한 번, 본인이 편성을 확정합니다. AI가 대신 확정하지 않습니다.'],
                ].map(([who, role, description]) => (
                  <div key={who} className="px-6 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">{who}</p>
                    <p className="mt-2 font-semibold text-foreground">{role}</p>
                    <p className="mt-2 break-keep text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel>
                <Eyebrow>AI·데이터 안전장치</Eyebrow>
                <h2 className="mt-3 text-xl font-bold">AI는 계산하지 않고, 해석하고 질문합니다</h2>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>수익률과 제대로 지수는 공개된 규칙으로 계산</li>
                  <li>LLM에는 편성, 유지 기간, 주간 변동, 한 줄 회고만 전달</li>
                  <li>회고 원문은 응답 뒤 저장하지 않고 폐기</li>
                  <li>군 소속 정보는 수집하지 않고 그룹은 익명 초대코드로 참여</li>
                </ul>
                <p className="mt-4 text-xs font-semibold text-primary/90">생성형 AI 제안 · 확정은 본인이 합니다</p>
              </Panel>
              <Panel>
                <Eyebrow>재현 가능한 합성 데이터</Eyebrow>
                <h2 className="mt-3 text-xl font-bold">같은 입력이면 같은 계산 결과가 나옵니다</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  심사용 가격·편성 이력과 산출 규칙을 고정해 결과를 다시 확인할 수 있습니다. 학습의 세
                  시나리오를 직접 전환해 한 전략이 언제나 이기는지 비교합니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground">
                  {['급락 후 회복', '주식·채권 동반 하락', '1년 후에도 미회복'].map((label) => (
                    <span key={label} className="rounded-full bg-secondary px-2.5 py-1">
                      {label}
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </Reveal>

        {/* ── 6. 마무리 ───────────────────────────── */}
        <Reveal>
          <div className="flex flex-col items-center gap-8 border-t border-border pt-20 text-center">
            <SectionTitle>지금 시작하세요</SectionTitle>
            <Body>
              <span className="block text-center">
                가입 없이 바로 둘러볼 수 있습니다. 마음에 들면 그때 시작하면 됩니다.
              </span>
            </Body>
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Link
                href="/demo"
                prefetch={false}
                className="flex h-14 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                3분 심사 데모 시작
              </Link>
              <Link
                href="/onboarding"
                className="flex h-14 items-center justify-center rounded-xl border border-input text-base font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-foreground/60 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                시작하기
              </Link>
            </div>
            <p className="max-w-[56ch] text-pretty break-keep text-xs leading-relaxed text-faint/70">
              본 서비스의 시세는 교육용 데이터이며 실제 금융거래·주문·결제가 일어나지 않습니다.
              투자 판단을 확정하거나 특정 종목을 추천하지 않습니다. 2026 금융 AI Challenge 출품작.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

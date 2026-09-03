import Link from 'next/link';
import { Reveal } from '@/components/reveal';

// S1 랜딩 — 히어로(선택지 2개만) + 스크롤하며 기능이 순차 등장.
// 색 비율 6:3:1 — 바탕 zinc-950 / 표면 zinc-900 / 강조 amber. 강조색은 한 화면에 한 곳만.
// 기능 화면에는 설명을 붙이지 않는다. 설명은 전부 여기서 끝낸다.

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/80">{children}</p>
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
  return <p className="max-w-[52ch] break-keep text-[15px] leading-relaxed text-zinc-400">{children}</p>;
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
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] ${className ?? ''}`}
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
  { label: '불린 만큼', hint: '위험 대비 수익', solo: 40, spread: 33, max: 40 },
  { label: '나눠 담은 만큼', hint: '실질 몇 개에 나눴나', solo: 2, spread: 30, max: 30 },
  { label: '버틴 만큼', hint: '몇 주 유지했나', solo: 8, spread: 30, max: 30 },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-zinc-950 text-zinc-100">
      {/* ── 히어로 ───────────────────────────────── */}
      <section className="relative flex min-h-[92dvh] flex-col items-center justify-center px-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_38%,rgba(245,158,11,0.09),transparent_70%)]"
        />
        <Reveal className="relative">
          <p className="mb-7 inline-block rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
            교육용 모의 서비스 · 실제 거래 없음
          </p>
          <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">제대로</h1>
          <p className="mx-auto mt-6 max-w-[34ch] text-pretty break-keep text-lg leading-relaxed text-zinc-400">
            전역할 때 받게 될 목돈을, 복무 중에 미리 굴려보는 훈련.
          </p>
        </Reveal>

        <Reveal delay={140} className="relative mt-12 w-full max-w-sm">
          <div className="flex flex-col gap-3">
            <Link
              href="/demo"
              className="group flex h-14 items-center justify-center rounded-xl bg-amber-400 text-base font-semibold text-zinc-950 shadow-lg shadow-amber-400/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-xl hover:shadow-amber-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              데모 체험하기
            </Link>
            <Link
              href="/onboarding"
              className="flex h-14 items-center justify-center rounded-xl border border-zinc-700 text-base font-semibold text-zinc-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              시작하기
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            데모는 가입 없이 바로 들어갑니다
          </p>
        </Reveal>

        <div
          aria-hidden
          className="absolute bottom-8 flex flex-col items-center gap-2 text-zinc-700 motion-safe:animate-bounce"
        >
          <span className="text-[11px] tracking-widest">SCROLL</span>
          <span className="h-8 w-px bg-gradient-to-b from-zinc-700 to-transparent" />
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-32 px-6 pb-32 sm:space-y-40">
        {/* ── 1. 시드 ─────────────────────────────── */}
        <Reveal>
          <Split>
            <div className="flex flex-col gap-5">
              <Eyebrow>훈련 시드</Eyebrow>
              <SectionTitle>
                전역할 때 <span className="text-amber-400">2,000만원</span>을 받습니다
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
              <p className="text-sm text-zinc-500">모의 시드</p>
              <p className="mt-2 font-mono text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
                20,000,000
              </p>
              <p className="mt-1 text-sm text-zinc-500">원</p>
              <p className="mt-6 border-t border-zinc-800 pt-5 text-sm leading-relaxed text-zinc-400">
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
                편성은 <span className="text-amber-400">주말에 한 번</span>만 정합니다
              </SectionTitle>
              <Body>
                병사가 휴대전화를 쓰는 시간과 증시가 열리는 시간은 1분도 겹치지 않습니다. 장중에
                시세를 볼 수 없는 환경은 약점이 아니라, 장기투자를 배우기에 가장 좋은 조건입니다.
              </Body>
              <Body>
                평일에는 시장을 읽고 계획만 세웁니다. 실행은 주말에 한 번. 바꾸지 않기로 한 주도
                그대로 기록됩니다.
              </Body>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Panel>
                <p className="text-xs font-semibold tracking-wider text-zinc-500">평일</p>
                <p className="mt-3 text-lg font-semibold">읽고, 계획한다</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  <li>시장 브리핑</li>
                  <li>작전계획 작성</li>
                  <li>다른 사람과 비교</li>
                </ul>
              </Panel>
              <Panel className="border-amber-400/30 bg-amber-400/[0.04]">
                <p className="text-xs font-semibold tracking-wider text-amber-400/80">주말</p>
                <p className="mt-3 text-lg font-semibold">한 번 실행한다</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                  <li>편성 조정</li>
                  <li>수익률 확인</li>
                  <li>한 주 회고</li>
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
                6개 전선에 <span className="text-amber-400">포인트 20개</span>를 놓습니다
              </SectionTitle>
              <Body>
                종목을 고르고 수량을 계산하는 대신, 포인트를 나눠 놓습니다. 몇 주를 몇 원에 살지가
                아니라 어디에 얼마나 걸지를 배우는 훈련입니다.
              </Body>
              <Body>
                더 깊이 들어가고 싶으면 각 전선 안에서 반도체·바이오 같은 테마로 다시 나눌 수
                있습니다. 놓지 않은 포인트는 예비대로 남습니다.
              </Body>
            </div>
            <Panel>
              <div className="flex flex-col gap-3.5">
                {FRONTS.map((f) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-sm text-zinc-400">{f.name}</span>
                    <span className="flex flex-1 gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`h-2.5 flex-1 rounded-full ${i < f.pt ? 'bg-amber-400/70' : 'bg-zinc-800'}`}
                        />
                      ))}
                    </span>
                    <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums text-zinc-500">
                      {f.pt}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
                합계 <span className="font-mono tabular-nums text-zinc-300">20</span> 포인트 · 1포인트 = 5%
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
                오늘 시장이 어떻게 움직였는지 <span className="text-amber-400">한눈에</span>
              </SectionTitle>
              <Body>
                들어오면 오늘의 지형이 먼저 보입니다. 내가 담은 전선을 중심으로 정리되기 때문에,
                같은 시장이라도 사람마다 다른 순서로 읽힙니다.
              </Body>
              <Body>
                AI는 숫자를 지어내지 않습니다. 등락은 규칙으로 먼저 계산하고, AI는 그 숫자를 받아
                읽기 좋게 정리한 뒤 질문을 되돌려줍니다. 결정은 본인이 합니다.
              </Body>
            </div>
            <Panel>
              <p className="text-xs font-semibold tracking-wider text-zinc-500">오늘의 지형</p>
              <div className="mt-4 flex flex-col gap-3 font-mono text-sm tabular-nums">
                {[
                  ['국내 주식', '+1.2%', 'text-emerald-400'],
                  ['미국 주식', '+0.4%', 'text-emerald-400'],
                  ['채권', '−0.3%', 'text-rose-400'],
                  ['금·원자재', '+0.9%', 'text-emerald-400'],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="font-sans text-zinc-400">{k}</span>
                    <span className={c}>{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 break-keep rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm leading-relaxed text-zinc-400">
                당신이 가장 많이 담은 전선이 오늘 올랐습니다. 지난주에는 반대였습니다.
              </p>
            </Panel>
          </Split>
        </Reveal>

        {/* ── 5. 제대로 지수 ★ ─────────────────────── */}
        <Reveal>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-5">
              <Eyebrow>순위</Eyebrow>
              <SectionTitle>
                수익률 1등이 <span className="text-amber-400">1등이 아닙니다</span>
              </SectionTitle>
              <Body>
                한 종목에 몰아넣고 운이 좋으면 한 주 수익률은 1등이 됩니다. 그런데 그건 실력이
                아니라 운이고, 다음 주에 그대로 돌려줍니다. 그래서 순위를 세 가지로 나눠서 봅니다.
              </Body>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['불린 만큼', '40점', '수익을 위험으로 나눈 값. 많이 벌어도 크게 흔들렸다면 점수가 깎입니다.'],
                ['나눠 담은 만큼', '30점', '실질적으로 몇 개에 나눈 셈인지 계산합니다. 한 곳에 몰수록 낮습니다.'],
                ['버틴 만큼', '30점', '편성을 얼마나 유지했는지. 자주 바꿀수록 낮습니다.'],
              ].map(([t, p, d]) => (
                <Panel key={t}>
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold">{t}</p>
                    <p className="font-mono text-sm tabular-nums text-zinc-500">{p}</p>
                  </div>
                  <p className="mt-3 break-keep text-sm leading-relaxed text-zinc-400">{d}</p>
                </Panel>
              ))}
            </div>

            <Panel className="!p-0 overflow-hidden">
              <div className="border-b border-zinc-800 px-6 py-4">
                <p className="text-sm font-semibold">같은 기간, 두 사람</p>
              </div>
              <div className="space-y-5 px-6 py-6">
                {INDEX_ROWS.map((r) => (
                  <div key={r.label}>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-zinc-300">{r.label}</span>
                      <span className="text-xs text-zinc-600">{r.hint}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-zinc-500">한 곳에 몰빵</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <span
                            className="block h-full rounded-full bg-zinc-600"
                            style={{ width: `${(r.solo / r.max) * 100}%` }}
                          />
                        </span>
                        <span className="w-7 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-500">
                          {r.solo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-zinc-500">6전선 분산</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <span
                            className="block h-full rounded-full bg-amber-400/80"
                            style={{ width: `${(r.spread / r.max) * 100}%` }}
                          />
                        </span>
                        <span className="w-7 shrink-0 text-right font-mono text-xs tabular-nums text-amber-400">
                          {r.spread}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-5">
                <span className="text-sm font-semibold">제대로 지수</span>
                <span className="flex items-baseline gap-5 font-mono tabular-nums">
                  <span className="text-lg text-zinc-500">50</span>
                  <span className="text-2xl font-bold text-amber-400">93</span>
                </span>
              </div>
            </Panel>

            <Body>
              수익률만 보면 몰빵이 다섯 배 앞섰지만, 위험까지 계산하면 거의 붙습니다. 거기에 나눠
              담은 정도와 버틴 기간을 더하면 순위가 뒤집힙니다. 배점은 임의로 정하지 않았습니다 —
              짧은 기간의 수익률 지표는 통계적으로 불안정하다는 연구와, 자주 거래한 개인투자자일수록
              성과가 나빴다는 실증에 근거합니다.
            </Body>
          </div>
        </Reveal>

        {/* ── 6. 마무리 ───────────────────────────── */}
        <Reveal>
          <div className="flex flex-col items-center gap-8 border-t border-zinc-800 pt-20 text-center">
            <SectionTitle>지금 시작하세요</SectionTitle>
            <Body>
              <span className="block text-center">
                가입 없이 바로 둘러볼 수 있습니다. 마음에 들면 그때 시작하면 됩니다.
              </span>
            </Body>
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Link
                href="/demo"
                className="flex h-14 items-center justify-center rounded-xl bg-amber-400 text-base font-semibold text-zinc-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                데모 체험하기
              </Link>
              <Link
                href="/onboarding"
                className="flex h-14 items-center justify-center rounded-xl border border-zinc-700 text-base font-semibold text-zinc-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                시작하기
              </Link>
            </div>
            <p className="max-w-[56ch] text-pretty break-keep text-xs leading-relaxed text-zinc-600">
              본 서비스의 시세는 교육용 데이터이며 실제 금융거래·주문·결제가 일어나지 않습니다.
              투자 판단을 확정하거나 특정 종목을 추천하지 않습니다. 2026 금융 AI Challenge 출품작.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

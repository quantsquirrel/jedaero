import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndexGauge } from '@/components/index-gauge';
import { JobLinks } from '@/components/job-links';
import { MarketWeekCard } from '@/components/market-week-card';
import { PageHeader } from '@/components/page-header';
import { ReviewForm } from '@/components/review-form';
import { SEED_AMOUNT, THEMES } from '@/lib/constants';
import { currentDayType, currentRebalanceOpen } from '@/lib/day-context';
import { daysUntilRebalance, kstToday } from '@/lib/day-type';
import { pct, won } from '@/lib/format';
import { computeWeeklyScore } from '@/lib/league';
import { computeMarketWeek } from '@/lib/market-week';
import { portfolioSummary } from '@/lib/portfolio/summary';
import { collectReviewFacts } from '@/lib/review-context';
import { getSessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';

// S3 홈 — 브리핑룸. 「지금 어디에 있나 / 오늘 무엇을 하나」만 둔다.
// 하단 네비와 같은 화면을 다시 깔지 않는다. 그룹만 네비 밖이라 여기서 연다.
// ★ 지표 교체 (DESIGN-DECISIONS §5): 평일에는 누적(느린 숫자)만, 주말에 평가액·이번 주 변동·제대로 지수.
export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  const weekend = dt === 'WEEKEND';
  const open = await currentRebalanceOpen();
  const dday = daysUntilRebalance(new Date(), dt);

  const me = await portfolioSummary(user.id);
  const week = computeMarketWeek(kstToday(), me.weights);
  const score = weekend ? await computeWeeklyScore(user) : null;
  const reviewFacts = await collectReviewFacts(user.id);
  const parts = score ? [score.grown, score.spread, score.held] : [];
  const leadingWeights = THEMES.map((theme) => ({
    name: theme.name,
    value: me.weights[theme.code] ?? 0,
  }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  const allocationLabel = leadingWeights.length
    ? leadingWeights.map((item) => `${item.name} ${item.value}%`).join(' · ')
    : '예비대(현금성 자산) 100%';
  const durationLabel = reviewFacts.changedThisWeek
    ? `이번 주 ${reviewFacts.turnoverPp.toFixed(0)}%p 조정`
    : `${reviewFacts.weeksUnchanged}주 유지`;

  const jobs = open
    ? [
        { href: '/portfolio', label: '편성 조정', hint: '포인트 20개 · 이번 주 한 번', primary: true },
        { href: '/league', label: '제대로 지수', hint: '세 축으로 함께 보기' },
        { href: '#ai-coach', label: '한 줄 회고', hint: '사실 + 질문 하나' },
        { href: '/principles', label: '나의 투자 원칙', hint: '전역 후에도 남는 기록' },
      ]
    : [
        { href: '#market', label: '오늘의 지형', hint: '전선 등락 · 내 손익 가중은 주말에' },
        { href: '/portfolio', label: '명령하달 초안', hint: '실행되지 않는 메모. 안 적어도 됩니다' },
        { href: '/learn#drill', label: '도상훈련', hint: '지금 편성을 과거 지형에 넣기' },
        { href: '/principles', label: '나의 투자 원칙', hint: '전역 후에도 남는 기록' },
      ];

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <PageHeader
        kicker={`${user.nickname}님`}
        title={open ? '지금 편성할 수 있습니다' : `다음 편성까지 D-${dday}`}
        badge={
          <Badge variant="outline" className="shrink-0">
            {weekend ? '주말·휴일' : '평일'}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 할 수 있는 일</CardTitle>
        </CardHeader>
        <CardContent>
          <JobLinks
            items={jobs}
            footnote={
              open ? (
                <>
                  마감은 일요일 21:00. <b className="text-foreground">조정하지 않으면 기존 편성이 그대로 유지됩니다.</b>
                </>
              ) : (
                <>
                  전선이 어떻게 움직였는지 읽고, 편성 현황을 볼 수 있습니다.{' '}
                  <b className="text-foreground">편성을 바꾸는 창은 주말에 한 번</b> 열립니다.
                </>
              )
            }
          />
        </CardContent>
      </Card>

      {/* 내 편성 — 평일은 누적만, 주말은 평가액 + 이번 주 변동 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {weekend ? '내 편성(목표 비중) 평가액' : '누적 수익률'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {!me.hasAllocation ? (
            <p className="text-sm text-muted-foreground">
              아직 편성이 없습니다.{' '}
              <Link href="/portfolio" className="underline">
                포인트 20개를 놓으러 가기 →
              </Link>
            </p>
          ) : me.awaitingFirstFill ? (
            <p className="text-sm text-muted-foreground">
              첫 체결 대기 중 — {me.effectiveFrom} 종가로 {won(SEED_AMOUNT)}이 배분됩니다.
            </p>
          ) : weekend ? (
            <>
              <p className="text-3xl font-bold tabular-nums">{won(me.value)}</p>
              <p className="text-sm text-muted-foreground">
                원금 {won(SEED_AMOUNT)} ·{' '}
                <span className={me.cumulativePct >= 0 ? 'text-up' : 'text-down'}>
                  누적 {pct(me.cumulativePct, 2)}
                </span>
              </p>
              {week ? (
                <p className="text-sm">
                  이번 주 내 편성 기준{' '}
                  <span className={week.weightedPct >= 0 ? 'text-up' : 'text-down'}>
                    {pct(week.weightedPct)}
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p
                className={cn(
                  'text-3xl font-bold tabular-nums',
                  me.cumulativePct >= 0 ? 'text-up' : 'text-down',
                )}
              >
                {pct(me.cumulativePct, 2)}
              </p>
              <p className="text-sm text-muted-foreground">
                평가액 {won(me.value)} · 원금 {won(SEED_AMOUNT)}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                시작 이후 전체입니다. 이번 주가 얼마나 흔들렸는지는 주말에 봅니다.{' '}
                <Link href="/learn#card-patience" className="underline">
                  왜 다른 숫자를 보나 →
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card id="market" className="scroll-mt-40">
        <CardHeader>
          <CardTitle className="text-base">오늘의 지형</CardTitle>
        </CardHeader>
        <CardContent>
          {week ? (
            <MarketWeekCard
              fromDate={week.fromDate}
              toDate={week.toDate}
              tradingDays={week.tradingDays}
              moves={week.moves}
              weightedPct={week.weightedPct}
              variant={weekend ? 'full' : 'terrain'}
            />
          ) : (
            <p className="text-sm text-muted-foreground">아직 집계할 거래 구간이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Card id="ai-coach" className="scroll-mt-40 border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">AI 행동 회고 코치</CardTitle>
            <Badge variant="outline" className="border-primary/40 text-primary/90">
              판단 보조
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            규칙으로 계산한 편성·유지·변동과 한 줄 회고를 연결해 행동 패턴을 짚고 질문 하나를
            돌려줍니다.
          </p>
        </CardHeader>
        <CardContent>
          <ReviewForm
            coachContext={{
              allocation: allocationLabel,
              duration: durationLabel,
              weeklyMove: week ? pct(week.weightedPct) : '집계 전',
              defaultReview: user.isDemo
                ? '이번 주 변동을 보며 편성을 바꾸고 싶은 마음이 들었다'
                : undefined,
            }}
          />
        </CardContent>
      </Card>

      {/* 제대로 지수 — 주말에만 숫자. 평일은 잠긴 이유를 한 덩어리로. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>제대로 지수</span>
            <Link href="/league" className="text-xs font-normal text-muted-foreground underline">
              {weekend ? '자세히 →' : '지수 화면 →'}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!score ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              비교는 주말에 한 번에 봅니다. 짧은 구간의 점수 줄 세우기는 대개 운입니다.
            </p>
          ) : !score.hasHistory ? (
            <p className="text-sm text-muted-foreground">
              아직 편성 이력이 없어 집계할 것이 없습니다.
            </p>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">
                {score.total}
                <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
              </p>
              <IndexGauge parts={parts} />
              <p className="text-xs leading-relaxed text-muted-foreground">
                세 축 중 하나만 밀어서는 만점이 나오지 않습니다. 등수는 매기지 않습니다.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Link
        href="/groups"
        className="flex items-center justify-between rounded-xl border border-border px-4 py-3.5 transition-colors hover:border-muted-foreground/40"
      >
        <span>
          <span className="block font-semibold">그룹</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            하단 메뉴 밖 · 초대코드로 「우리 그룹」 비교
          </span>
        </span>
        <span className="text-sm text-muted-foreground">→</span>
      </Link>

      <p className="text-xs leading-relaxed text-muted-foreground">
        모의 시드 {won(SEED_AMOUNT)}은 전원 동일한 훈련용 기준 금액입니다. 결과를 가르는 것은
        편성뿐입니다.{' '}
        <Link href="/learn#card-seed" className="underline">
          자세히 →
        </Link>
      </p>
    </main>
  );
}

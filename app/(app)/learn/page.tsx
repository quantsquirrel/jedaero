import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { DrillDeck } from '@/components/drill-deck';
import { LearnCardsView } from '@/components/learn-cards-view';
import { MarketWeekCard } from '@/components/market-week-card';
import { PageHeader } from '@/components/page-header';
import { JobLinks } from '@/components/job-links';
import { ReviewForm } from '@/components/review-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { BASELINE_OPERATION, type ThemeCode } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { DRILL_SCENARIOS } from '@/lib/drill/scenarios';
import { runDrill } from '@/lib/drill/run';
import { LEARN_CARDS } from '@/lib/learn-cards';
import { computeMarketWeek } from '@/lib/market-week';
import type { WeightHistoryItem } from '@/lib/portfolio/engine';
import { getSessionUser } from '@/lib/session';

// S8 학습 — 도상훈련이 훅, 카드는 기능과 1:1 참고서, 등락표·회고는 명세대로 유지.
export default async function LearnPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();

  const [latest] = await db
    .select({ weights: allocations.weights, details: allocations.details })
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(desc(allocations.effectiveFrom))
    .limit(1);
  const weights = (latest?.weights ?? {}) as Partial<Record<ThemeCode, number>>;
  const details = (latest?.details ?? null) as WeightHistoryItem['details'];
  const week = computeMarketWeek(kstToday(), weights);
  const baseline = BASELINE_OPERATION.weights;
  const drillItems = DRILL_SCENARIOS.map((sc) => ({
    id: sc.id,
    mine: runDrill(weights, sc.id, details),
    alliance: runDrill(baseline, sc.id),
  }));

  return (
    <main className="flex flex-col gap-5 px-5 py-8">
      <PageHeader
        title="학습"
        description="지금 편성을 과거 지형에 넣어 본 뒤, 궁금한 기능의 카드를 엽니다."
      />

      <DrillDeck items={drillItems} hasAllocation={Boolean(latest)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">이번 주 6전선은 어떻게 움직였나</CardTitle>
        </CardHeader>
        <CardContent>
          {week ? (
            <MarketWeekCard
              fromDate={week.fromDate}
              toDate={week.toDate}
              tradingDays={week.tradingDays}
              moves={week.moves}
              weightedPct={week.weightedPct}
              variant={dt === 'WEEKEND' ? 'full' : 'terrain'}
            />
          ) : (
            <p className="text-sm text-muted-foreground">아직 집계할 거래 구간이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-base font-semibold">다섯 카드</h2>
        <p className="text-sm text-muted-foreground">
          각각 이 서비스의 한 기능과 짝을 이룹니다. 기능을 쓰다 궁금해진 순간이 가장 좋은 읽을
          때입니다.
        </p>
        <LearnCardsView cards={LEARN_CARDS} />
      </section>

      <Card id="review" className="scroll-mt-40">
        <CardHeader>
          <CardTitle className="text-base">한 줄 회고</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            홈의 AI 코치와 같은 한 줄입니다. 여기서는 학습 5단계와 붙여 둡니다. 입력은 저장되지
            않습니다.
          </p>
          <ReviewForm />
        </CardContent>
      </Card>

      <JobLinks
        items={[{ href: '/principles', label: '나의 투자 원칙', hint: '기록으로 한 장 만들기' }]}
      />
    </main>
  );
}

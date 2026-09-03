import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { LearnCardsView } from '@/components/learn-cards-view';
import { MarketWeekCard } from '@/components/market-week-card';
import { ReviewForm } from '@/components/review-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import type { ThemeCode } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { LEARN_CARDS } from '@/lib/learn-cards';
import { computeMarketWeek } from '@/lib/market-week';
import { getSessionUser } from '@/lib/session';

// S8 학습·회고 — 5단계 학습 카드는 기능과 1:1 페어링, 각 기능 화면에서 이리로 진입한다
// 전선 등락(시황)은 평일에도 연다. 내 손익 가중과 AI-4 브리핑만 주말 (DESIGN-DECISIONS §5).
export default async function LearnPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();

  const [latest] = await db
    .select({ weights: allocations.weights })
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(desc(allocations.effectiveFrom))
    .limit(1);
  const week = computeMarketWeek(kstToday(), (latest?.weights ?? {}) as Partial<Record<ThemeCode, number>>);

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">학습</h1>
      <p className="text-sm text-muted-foreground">
        다섯 카드는 각각 이 서비스의 한 기능과 짝을 이룹니다. 기능을 쓰다 궁금해진 순간이 가장
        좋은 읽을 때입니다.
      </p>
      <LearnCardsView cards={[...LEARN_CARDS]} />

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">한 줄 회고</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm />
        </CardContent>
      </Card>
    </main>
  );
}

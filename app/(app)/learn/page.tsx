import Link from 'next/link';
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
// 주간 브리핑(AI-4)은 주말에만 연다. 장중에 보지 않는 훈련이라는 같은 이유다 (SPEC §3-4).
export default async function LearnPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();

  let week = null;
  if (dt === 'WEEKEND') {
    const [latest] = await db
      .select({ weights: allocations.weights })
      .from(allocations)
      .where(eq(allocations.userId, user.id))
      .orderBy(desc(allocations.effectiveFrom))
      .limit(1);
    week = computeMarketWeek(kstToday(), (latest?.weights ?? {}) as Partial<Record<ThemeCode, number>>);
  }

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
          <CardTitle className="text-base">이번 주 6축은 어떻게 움직였나</CardTitle>
        </CardHeader>
        <CardContent>
          {dt !== 'WEEKEND' ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm">🔒 장중에 보지 않는 훈련입니다. 주말에 한 번에 보세요.</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                주말에는 6축 등락과 주간 브리핑이 열립니다. 학습 카드와 회고는 평일에도 그대로
                쓸 수 있습니다.{' '}
                <Link href="/learn#card-patience" className="underline">
                  왜 매일 보면 안 되는가
                </Link>
              </p>
            </div>
          ) : week ? (
            <MarketWeekCard
              fromDate={week.fromDate}
              toDate={week.toDate}
              tradingDays={week.tradingDays}
              moves={week.moves}
              weightedPct={week.weightedPct}
            />
          ) : (
            <p className="text-sm text-muted-foreground">아직 집계할 거래 구간이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">주말 회고</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm />
        </CardContent>
      </Card>
    </main>
  );
}

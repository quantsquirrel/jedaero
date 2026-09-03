import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketWeekCard } from '@/components/market-week-card';
import { SEED_AMOUNT } from '@/lib/constants';
import { currentDayType, currentRebalanceOpen } from '@/lib/day-context';
import { daysUntilRebalance, kstToday } from '@/lib/day-type';
import { won } from '@/lib/format';
import { computeMarketWeek } from '@/lib/market-week';
import { getSessionUser } from '@/lib/session';

// S3 홈 — 최상단은 "다음 편성까지". 전역 D-Day는 이 앱의 할 일이 아니므로 설정으로 옮긴다.
// ★ 수익률은 여기 두지 않는다 (SPEC §6). 평일 심사 메인이므로 시황(전선 등락)은 둔다.
export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  const open = await currentRebalanceOpen();
  const dday = daysUntilRebalance();
  const week = computeMarketWeek(kstToday());

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{user.nickname}님</p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight">
            {open ? '지금 편성할 수 있습니다' : `다음 편성까지 D-${dday}`}
          </h1>
        </div>
        <Badge variant="outline" className="shrink-0">
          {dt === 'WEEKEND' ? '주말·휴일' : '평일'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 할 수 있는 일</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          {open ? (
            <p>
              <b className="text-foreground">편성 조정 · 이번 주 변동 · 제대로 지수</b>가 열려
              있습니다. 마감은 일요일 21:00. 조정하지 않으면 기존 편성이 그대로 유지됩니다.
            </p>
          ) : (
            <p>
              전선이 어떻게 움직였는지 읽고, 편성 현황을 볼 수 있습니다.{' '}
              <b className="text-foreground">편성을 바꾸는 창은 주말에 한 번</b> 열립니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
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
              variant="terrain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">아직 집계할 거래 구간이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">모의 시드 {won(SEED_AMOUNT)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          전원 동일한 훈련용 기준 금액입니다. 결과를 가르는 것은 편성뿐입니다.{' '}
          <Link href="/learn#card-seed" className="underline">
            자세히 →
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/portfolio"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="font-semibold">포트폴리오</span>
          <span className="text-xs text-muted-foreground">6전선 편성</span>
        </Link>
        <Link
          href="/league"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="font-semibold">제대로 지수</span>
          <span className="text-xs text-muted-foreground">주말에 비교</span>
        </Link>
        <Link
          href="/learn"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="font-semibold">학습</span>
          <span className="text-xs text-muted-foreground">5단계 카드</span>
        </Link>
        <Link
          href="/groups"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="font-semibold">그룹</span>
          <span className="text-xs text-muted-foreground">초대코드</span>
        </Link>
      </div>
    </main>
  );
}

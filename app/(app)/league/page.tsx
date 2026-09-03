import Link from 'next/link';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { SEED_AMOUNT, type Weights } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { pct } from '@/lib/format';
import { annualizedVol, hhi, maxWeightOf } from '@/lib/insights';
import { cohortView, computeAndStoreWeeklyScore } from '@/lib/league';
import { computeCurve, maxDrawdown, type WeightHistoryItem } from '@/lib/portfolio/engine';
import { pricesUpTo } from '@/lib/portfolio/prices';
import { getSessionUser } from '@/lib/session';

// S7 리그 — 동기 코호트(전역 예정 월 자동 배정). 주간 시즌제, 누적 순위 없음 (C7)
// 지표는 예산 준수율. 수익률은 백분위로만, 변동성·최대낙폭·집중도와 함께 (SPEC §3-8)
// ★ 퀘스트·XP 폐지로 점수 축 하나가 비었다. 「제대로 지수」(40:30:30)로 재구성 예정 — HANDOFF ③
export default async function LeaguePage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();

  if (dt !== 'WEEKEND') {
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <h1 className="text-2xl font-bold">리그</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-1.5 py-5">
            <p className="text-lg font-semibold">🔒 리그는 주말에 열립니다</p>
            <p className="text-sm text-muted-foreground">
              장중에 보지 않는 훈련입니다. 순위 비교도 주말에 한 번에 보세요.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const mine = await computeAndStoreWeeklyScore(user);
  const cohort = await cohortView(user, mine);

  // 함께 표시할 위험 지표 — 전역(일시금) 곡선 기준
  const allocs = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom));
  let vol = 0;
  let mdd = 0;
  let concentration = { max: 0, hhi: 0 };
  if (allocs.length > 0) {
    const { dates, series } = pricesUpTo(kstToday());
    const history: WeightHistoryItem[] = allocs.map((a) => ({
      effectiveFrom: a.effectiveFrom,
      weights: a.weights as Record<string, number>,
      details: (a.details as Record<string, Record<string, number>> | null) ?? null,
    }));
    const { values } = computeCurve(dates, series, history, { [allocs[0].effectiveFrom]: SEED_AMOUNT });
    vol = annualizedVol(values);
    mdd = maxDrawdown(values);
    const w = allocs[allocs.length - 1].weights as Weights;
    concentration = { max: maxWeightOf(w), hhi: hhi(w) };
  }

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">리그</h1>
        <span className="text-xs text-muted-foreground">매주 월요일 리셋 · 누적 순위 없음</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">동기 코호트 — {cohort.cohortMonth} 전역 예정</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-xs text-muted-foreground">이번 주 집계 인원 {cohort.n}명 (자동 배정)</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border p-2.5">
              <p className="text-xs text-muted-foreground">예산 준수율</p>
              <p className="font-semibold tabular-nums">
                {mine.budgetAccuracy != null ? pct(mine.budgetAccuracy, 1).replace('+', '') : '봉투 미배정'}
              </p>
              {cohort.accuracyPercentile != null ? (
                <p className="text-xs text-muted-foreground">코호트 상위 {100 - cohort.accuracyPercentile}%</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-md border border-border p-2.5">
            <p className="text-xs text-muted-foreground">이번 주 수익률 위치 (전역 곡선 TWR 기준)</p>
            <p className="font-semibold">
              {cohort.twrPercentile != null ? `코호트 백분위 ${cohort.twrPercentile}` : '집계 대기'}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              수익률은 순위·금액을 표시하지 않습니다. 짧은 시즌의 수익률 1등은 대개 몰빵이고, 이
              서비스는 그 행동을 표창하지 않습니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-[11px] text-muted-foreground">연 변동성</p>
              <p className="font-mono text-sm tabular-nums">{Math.round(vol * 100)}%</p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-[11px] text-muted-foreground">최대낙폭</p>
              <p className="font-mono text-sm tabular-nums">{pct(mdd)}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-[11px] text-muted-foreground">최대 비중</p>
              <p className="font-mono text-sm tabular-nums">{concentration.max}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/groups"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="text-2xl">👥</span>
          <span className="font-semibold">그룹</span>
          <span className="text-xs text-muted-foreground">초대코드 · 최대 30명</span>
        </Link>
        <Link
          href="/insights"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="text-2xl">🔍</span>
          <span className="font-semibold">성향 분석</span>
          <span className="text-xs text-muted-foreground">코호트 분포 비교 (옵트인)</span>
        </Link>
      </div>
    </main>
  );
}

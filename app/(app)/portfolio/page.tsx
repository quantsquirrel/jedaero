import Link from 'next/link';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { DeadlineCountdown } from '@/components/deadline-countdown';
import { WeightEditor } from '@/components/weight-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { SEED_AMOUNT, type Weights } from '@/lib/constants';
import { currentDayType, currentRebalanceOpen, demoOverride } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { pct, won } from '@/lib/format';
import { computeCurve, type WeightHistoryItem } from '@/lib/portfolio/engine';
import { pricesUpTo } from '@/lib/portfolio/prices';
import { getSessionUser } from '@/lib/session';
import { addDays, mondayOfWeeksAgo, weekOf } from '@/lib/week';

// S4 포트폴리오 — 사용자가 조작하는 유일한 대상: 테마 6축 비중
// 평일: 수익률 마스킹 + 조정 잠금. 접속·기록은 언제나 가능 (C11: 접속 차단 없음)
export default async function PortfolioPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  const open = await currentRebalanceOpen();
  const demo = await demoOverride();

  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom), asc(allocations.decidedAt));

  if (rows.length === 0) {
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <h1 className="text-2xl font-bold">포트폴리오</h1>
        <p className="text-sm text-muted-foreground">
          아직 배분이 없습니다.{' '}
          <Link href="/onboarding" className="underline">
            온보딩에서 예시 포트폴리오를 골라
          </Link>{' '}
          시작해주세요.
        </p>
      </main>
    );
  }

  const latest = rows[rows.length - 1];
  const weights = latest.weights as Weights;
  const alreadyThisWeek = rows.some((r) => r.weekOf === weekOf(new Date()));

  // 수익률은 주말에만 계산해 내려보낸다. 평일에는 계산 자체를 하지 않는다 (서버 마스킹).
  let perf: { value: number; ret: number } | { pendingStart: string } | null = null;
  if (dt === 'WEEKEND') {
    const { dates, series } = pricesUpTo(kstToday());
    const history: WeightHistoryItem[] = rows.map((r) => ({
      effectiveFrom: r.effectiveFrom,
      weights: r.weights as Record<string, number>,
      details: (r.details as Record<string, Record<string, number>> | null) ?? null,
    }));
    const { values, invested } = computeCurve(dates, series, history, {
      [rows[0].effectiveFrom]: SEED_AMOUNT,
    });
    const value = values[values.length - 1] ?? 0;
    perf =
      invested > 0
        ? { value, ret: value / invested - 1 }
        : { pendingStart: rows[0].effectiveFrom };
  }

  // 이번 주 마감(일요일 21:00 KST)의 UTC instant
  const deadlineIso = `${addDays(mondayOfWeeksAgo(new Date(), 0), 6)}T12:00:00Z`;

  const disabledReason = !open
    ? '주말에만 조정할 수 있습니다. 평일에는 기록과 학습만 열려 있어요.'
    : alreadyThisWeek
      ? '이번 주는 이미 조정했습니다. 조정하지 않아도 기존 비중이 그대로 유지됩니다.'
      : undefined;

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">내 포트폴리오</h1>

      {dt === 'WEEKEND' && perf ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">평가액</CardTitle>
          </CardHeader>
          <CardContent>
            {'pendingStart' in perf ? (
              <p className="text-sm text-muted-foreground">
                첫 체결 대기 중 — {perf.pendingStart} 종가로 {won(SEED_AMOUNT)}이 배분됩니다.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tabular-nums">{won(perf.value)}</p>
                <p className="text-sm text-muted-foreground">
                  원금 {won(SEED_AMOUNT)} ·{' '}
                  <span className={perf.ret >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    누적 {pct(perf.ret, 2)}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-1.5 py-5">
            <p className="text-lg font-semibold">🔒 수익률은 주말에 공개됩니다</p>
            <p className="text-sm text-muted-foreground">
              장중에 보지 않는 훈련입니다. 주말에 한 번에 보세요.
            </p>
            <p className="text-xs text-muted-foreground">
              접속·지출 기록·학습은 평일에도 언제나 가능합니다.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">테마 6축 비중 (5%p 단위)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {open && !alreadyThisWeek ? (
            demo ? (
              <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="text-sm font-medium">마감: 매주 일요일 21:00 (KST)</p>
                <p className="text-sm font-medium text-emerald-300">
                  조정하지 않으면 기존 비중이 그대로 유지됩니다.
                </p>
              </div>
            ) : (
              <DeadlineCountdown deadlineIso={deadlineIso} />
            )
          ) : null}
          <WeightEditor initial={weights} disabled={!open || alreadyThisWeek} disabledReason={disabledReason} />
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        주 1회, 주말·공휴일에만 조정할 수 있고 일요일 21:00에 마감됩니다. 확정된 비중은 다음
        거래일 종가로 반영됩니다. 본 서비스의 시세는 교육용 모의 데이터입니다.
      </p>
    </main>
  );
}

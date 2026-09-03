import Link from 'next/link';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { DeadlineCountdown } from '@/components/deadline-countdown';
import { RevertButton } from '@/components/revert-button';
import { WeightEditor } from '@/components/weight-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { POINT_UNIT, RESERVE, SEED_AMOUNT, THEMES, type Weights } from '@/lib/constants';
import { currentDayType, currentRebalanceOpen, demoOverride } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { pct, won } from '@/lib/format';
import { computeCurve, type WeightHistoryItem } from '@/lib/portfolio/engine';
import { pricesUpTo } from '@/lib/portfolio/prices';
import type { Details } from '@/lib/portfolio/details';
import { reservePoints } from '@/lib/portfolio/weights';
import { computeMarketWeek } from '@/lib/market-week';
import { getSessionUser } from '@/lib/session';
import { addDays, mondayOfWeeksAgo, weekOf } from '@/lib/week';
import { cn } from '@/lib/utils';

// S4 포트폴리오 — 사용자가 조작하는 유일한 대상: 6전선 포인트 편성
// ★ 「매달 모았다면」 곡선은 가계부 제거와 함께 폐지됐다. 곡선은 전역(일시금) 하나뿐이다.
// 평일: 누적 수익률 공개, 이번 주 변동은 주말. 조정은 주말만. 갭은 항상 표시 (DESIGN-DECISIONS §5)
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
          아직 편성이 없습니다.{' '}
          <Link href="/home" className="underline">
            홈으로
          </Link>
        </p>
      </main>
    );
  }

  const latest = rows[rows.length - 1];
  const targetWeights = latest.weights as Weights;
  const alreadyThisWeek = rows.some((r) => r.weekOf === weekOf(new Date()));

  // 전역(일시금) 곡선 — 갭 계산에는 항상 필요. 수익률 수치는 주말에만 내려보낸다.
  const { dates, series } = pricesUpTo(kstToday());
  const history: WeightHistoryItem[] = rows.map((r) => ({
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Record<string, number>,
    details: (r.details as Record<string, Record<string, number>> | null) ?? null,
  }));
  const lumpCurve = computeCurve(dates, series, history, { [rows[0].effectiveFrom]: SEED_AMOUNT });
  const lumpFinal = lumpCurve.values[lumpCurve.values.length - 1] ?? 0;

  // 목표 vs 현재 비중 갭 — 시장 변동으로 흐트러진 거리. 항상 표시한다
  // ★ 정수로 반올림하지 않는다. 6전선으로 분산된 포트폴리오의 주간 표류는 보통 1%p 미만이라
  //   반올림하면 실제 드리프트가 전부 0%p로 사라지고 "목표와 일치합니다"라는 거짓말이 남는다.
  //   되돌리기 버튼도 그 순간 함께 사라져 리밸런싱 개념이 화면에서 증발한다.
  const themeTotal = Object.values(lumpCurve.finalThemeValues).reduce((a, b) => a + b, 0);
  const round1 = (x: number) => Math.round(x * 10) / 10;
  // 예비대도 한 줄로 넣는다. 빼면 미배치분만 갭 표에서 사라져 합이 맞지 않는 화면이 된다.
  const reserveTarget = reservePoints(targetWeights) * POINT_UNIT;
  const gapRows: { code: string; name: string; target: number }[] = [
    ...THEMES.map((t) => ({ code: t.code, name: t.name, target: targetWeights[t.code] ?? 0 })),
    { code: RESERVE.code, name: RESERVE.name, target: reserveTarget },
  ];
  const gaps = gapRows.map((row) => {
    const current =
      themeTotal > 0
        ? round1(((lumpCurve.finalThemeValues[row.code] ?? 0) / themeTotal) * 100)
        : row.target;
    return { ...row, current, gap: round1(current - row.target) };
  });
  const maxAbsGap = Math.max(...gaps.map((g) => Math.abs(g.gap)));

  const deadlineIso = `${addDays(mondayOfWeeksAgo(new Date(), 0), 6)}T12:00:00Z`;
  const disabledReason = !open
    ? '주말에만 조정할 수 있습니다. 평일에는 편성 현황과 학습이 열려 있어요.'
    : alreadyThisWeek
      ? '이번 주는 이미 조정했습니다. 조정하지 않아도 기존 편성이 그대로 유지됩니다.'
      : undefined;
  const week = computeMarketWeek(kstToday(), targetWeights);

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">내 포트폴리오</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dt === 'WEEKEND' ? '평가액' : '누적 수익률'}</CardTitle>
        </CardHeader>
        <CardContent>
          {lumpCurve.invested === 0 ? (
            <p className="text-sm text-muted-foreground">
              첫 체결 대기 중 — {rows[0].effectiveFrom} 종가로 {won(SEED_AMOUNT)}이 배분됩니다.
            </p>
          ) : dt === 'WEEKEND' ? (
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-bold tabular-nums">{won(lumpFinal)}</p>
              <p className="text-sm text-muted-foreground">
                원금 {won(SEED_AMOUNT)} ·{' '}
                <span className={lumpFinal >= SEED_AMOUNT ? 'text-emerald-400' : 'text-red-400'}>
                  누적 {pct(lumpFinal / SEED_AMOUNT - 1, 2)}
                </span>
              </p>
              {week ? (
                <p className="text-sm">
                  이번 주 내 편성 기준{' '}
                  <span className={week.weightedPct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {pct(week.weightedPct)}
                  </span>
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                일시금 곡선은 유입이 1회라 시간가중수익률(TWR)과 투입 대비 수익률이 같습니다.{' '}
                <Link href="/learn#card-twr" className="underline">
                  두 수익률이 왜 다른가 →
                </Link>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p
                className={`text-3xl font-bold tabular-nums ${lumpFinal >= SEED_AMOUNT ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {pct(lumpFinal / SEED_AMOUNT - 1, 2)}
              </p>
              <p className="text-sm text-muted-foreground">
                평가액 {won(lumpFinal)} · 원금 {won(SEED_AMOUNT)}
              </p>
              <p className="text-xs text-muted-foreground">
                시작 이후 전체입니다. 이번 주가 얼마나 흔들렸는지는 주말에 봅니다.{' '}
                <Link href="/learn#card-patience" className="underline">
                  매일 보는 숫자와 주 단위로 보는 숫자는 다르다 →
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">목표 vs 현재 비중</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {gaps.map((g) => (
            <div key={g.code} className="flex items-center justify-between gap-2 text-sm">
              <span className="w-24 shrink-0">{g.name}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                목표 {g.target}% → 현재 {g.current.toFixed(1)}%
              </span>
              <span
                className={cn(
                  'w-16 text-right font-mono text-xs tabular-nums',
                  g.gap === 0 ? 'text-muted-foreground' : g.gap > 0 ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {g.gap > 0 ? '+' : ''}
                {g.gap.toFixed(1)}%p
              </span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            시장이 움직이면 실제 비중은 목표에서 저절로 멀어집니다. 되돌리는 것이 리밸런싱입니다.{' '}
            <Link href="/learn#card-rebalance" className="underline">
              리밸런싱의 정의 →
            </Link>
          </p>
          {maxAbsGap > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                가장 많이 벌어진 전선이 <b className="text-foreground">{maxAbsGap.toFixed(1)}%p</b>{' '}
                떨어져 있습니다. 마지막 체결은 {latest.effectiveFrom}입니다.
              </p>
              <RevertButton target={targetWeights} disabled={!open || alreadyThisWeek} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              지금은 목표와 현재가 0.1%p 미만으로 일치합니다. 체결 직후이거나 시장이 거의 움직이지
              않은 구간입니다.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">전선 편성 (포인트 20개)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {open && !alreadyThisWeek ? (
            demo ? (
              <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2">
                <p className="text-sm font-medium">마감: 매주 일요일 21:00 (KST)</p>
                <p className="text-sm font-medium text-emerald-300">
                  조정하지 않으면 기존 편성이 그대로 유지됩니다.
                </p>
              </div>
            ) : (
              <DeadlineCountdown deadlineIso={deadlineIso} />
            )
          ) : null}
          <WeightEditor
            initial={targetWeights}
            initialDetails={(latest.details as Details | null) ?? null}
            disabled={!open || alreadyThisWeek}
            disabledReason={disabledReason}
          />
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        주 1회, 주말·공휴일에만 조정할 수 있고 일요일 21:00에 마감됩니다. 확정된 편성은 다음
        거래일 종가로 반영됩니다. 본 서비스의 시세는 교육용 모의 데이터입니다.
      </p>
    </main>
  );
}

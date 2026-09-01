import Link from 'next/link';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ComparisonChart } from '@/components/comparison-chart';
import { DeadlineCountdown } from '@/components/deadline-countdown';
import { RevertButton } from '@/components/revert-button';
import { WeightEditor } from '@/components/weight-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { allocations, expenses } from '@/db/schema';
import { SEED_AMOUNT, THEMES, type Rank, type Weights } from '@/lib/constants';
import { currentDayType, currentRebalanceOpen, demoOverride } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { pct, won } from '@/lib/format';
import { buildSavingsCashflows } from '@/lib/portfolio/accumulation';
import { computeCurve, type WeightHistoryItem } from '@/lib/portfolio/engine';
import { pricesUpTo } from '@/lib/portfolio/prices';
import { getSessionUser } from '@/lib/session';
import { addDays, mondayOfWeeksAgo, weekOf } from '@/lib/week';
import { cn } from '@/lib/utils';

// S4 포트폴리오 — 사용자가 조작하는 유일한 대상: 테마 6축 비중
// 평일: 수익률 마스킹 + 조정 잠금. 갭(비중 정보)은 항상 표시 (SPEC §3-6 g)
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
  // ★ 정수로 반올림하지 않는다. 6축으로 분산된 포트폴리오의 주간 표류는 보통 1%p 미만이라
  //   반올림하면 실제 드리프트가 전부 0%p로 사라지고 "목표와 일치합니다"라는 거짓말이 남는다.
  //   되돌리기 버튼도 그 순간 함께 사라져 리밸런싱 개념이 화면에서 증발한다.
  const themeTotal = Object.values(lumpCurve.finalThemeValues).reduce((a, b) => a + b, 0);
  const round1 = (x: number) => Math.round(x * 10) / 10;
  const gaps = THEMES.map((t) => {
    const target = targetWeights[t.code] ?? 0;
    const current =
      themeTotal > 0 ? round1(((lumpCurve.finalThemeValues[t.code] ?? 0) / themeTotal) * 100) : target;
    return { code: t.code, name: t.name, target, current, gap: round1(current - target) };
  });
  const maxAbsGap = Math.max(...gaps.map((g) => Math.abs(g.gap)));

  // 「매달 모았다면」 — 같은 비중·같은 가격, 현금흐름만 다르게. 주말에만 계산·표시
  let comparison: null | {
    chartDates: string[];
    lump: number[];
    save: number[];
    lumpReturn: number;
    saveInvested: number;
    saveFinal: number;
    saveReturn: number;
  } = null;
  if (dt === 'WEEKEND' && lumpCurve.invested > 0) {
    const expenseRows = await db
      .select({ occurredOn: expenses.occurredOn, amount: expenses.amount })
      .from(expenses)
      .where(eq(expenses.userId, user.id));
    const savingsFlows = buildSavingsCashflows(
      user.rank as Rank,
      expenseRows,
      dates,
      rows[0].effectiveFrom,
    );
    const saveCurve = computeCurve(dates, series, history, savingsFlows);
    const saveFinal = saveCurve.values[saveCurve.values.length - 1] ?? 0;
    const from = dates.findIndex((d) => d >= rows[0].effectiveFrom);
    const s = Math.max(0, from);
    comparison = {
      chartDates: dates.slice(s),
      lump: lumpCurve.values.slice(s).map(Math.round),
      save: saveCurve.values.slice(s).map(Math.round),
      lumpReturn: lumpFinal / lumpCurve.invested - 1,
      saveInvested: saveCurve.invested,
      saveFinal,
      saveReturn: saveCurve.invested > 0 ? saveFinal / saveCurve.invested - 1 : 0,
    };
  }

  const deadlineIso = `${addDays(mondayOfWeeksAgo(new Date(), 0), 6)}T12:00:00Z`;
  const disabledReason = !open
    ? '주말에만 조정할 수 있습니다. 평일에는 기록과 학습만 열려 있어요.'
    : alreadyThisWeek
      ? '이번 주는 이미 조정했습니다. 조정하지 않아도 기존 비중이 그대로 유지됩니다.'
      : undefined;

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">내 포트폴리오</h1>

      {dt === 'WEEKEND' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">평가액</CardTitle>
          </CardHeader>
          <CardContent>
            {lumpCurve.invested === 0 ? (
              <p className="text-sm text-muted-foreground">
                첫 체결 대기 중 — {rows[0].effectiveFrom} 종가로 {won(SEED_AMOUNT)}이 배분됩니다.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tabular-nums">{won(lumpFinal)}</p>
                <p className="text-sm text-muted-foreground">
                  원금 {won(SEED_AMOUNT)} ·{' '}
                  <span className={lumpFinal >= SEED_AMOUNT ? 'text-emerald-400' : 'text-red-400'}>
                    누적 {pct(lumpFinal / SEED_AMOUNT - 1, 2)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  일시금 곡선은 유입이 1회라 시간가중수익률(TWR)과 투입 대비 수익률이 같습니다.{' '}
                  <Link href="/learn#card-twr" className="underline">
                    두 수익률이 왜 다른가 →
                  </Link>
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
              접속·지출 기록·학습은 평일에도 언제나 가능합니다.{' '}
              <Link href="/learn#card-patience" className="underline">
                왜 매일 보면 안 되는가 →
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

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
                가장 많이 벌어진 축이 <b className="text-foreground">{maxAbsGap.toFixed(1)}%p</b>{' '}
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

      {comparison ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">매달 모았다면</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ComparisonChart dates={comparison.chartDates} lump={comparison.lump} savings={comparison.save} />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border border-border p-2.5">
                <p className="text-xs text-muted-foreground">전역 일시금 {won(SEED_AMOUNT)}</p>
                <p className="font-semibold tabular-nums">{won(lumpFinal)}</p>
                <p className={cn('text-xs', comparison.lumpReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  투입 대비 {pct(comparison.lumpReturn, 2)}
                </p>
              </div>
              <div className="rounded-md border border-border p-2.5">
                <p className="text-xs text-muted-foreground">매달 저축액 투입 {won(comparison.saveInvested)}</p>
                <p className="font-semibold tabular-nums">{won(comparison.saveFinal)}</p>
                <p className={cn('text-xs', comparison.saveReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  투입 대비 {pct(comparison.saveReturn, 2)}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              같은 배분, 같은 가격 — 현금흐름만 다릅니다. 하락 구간에서 두 곡선이 다르게 아픈
              이유가 이 훈련의 핵심입니다. 두 값은 같은 돈을 두 방식으로 본 것이라{' '}
              <b className="text-foreground">더하지 않습니다</b>.
            </p>
          </CardContent>
        </Card>
      ) : null}

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
          <WeightEditor initial={targetWeights} disabled={!open || alreadyThisWeek} disabledReason={disabledReason} />
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        주 1회, 주말·공휴일에만 조정할 수 있고 일요일 21:00에 마감됩니다. 확정된 비중은 다음
        거래일 종가로 반영됩니다. 본 서비스의 시세는 교육용 모의 데이터입니다.
      </p>
    </main>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { DeadlineCountdown } from '@/components/deadline-countdown';
import { DraftEditor } from '@/components/draft-editor';
import { PageHeader } from '@/components/page-header';
import { RevertButton } from '@/components/revert-button';
import { SourceChip } from '@/components/source-chip';
import { WeightEditor } from '@/components/weight-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DivergingBar } from '@/components/charts/diverging-bar';
import { ValueCurve } from '@/components/charts/value-curve';
import { db } from '@/db';
import { allocations, drafts } from '@/db/schema';
import { POINT_UNIT, RESERVE, SEED_AMOUNT, THEMES, type Weights } from '@/lib/constants';
import { currentDayType, currentRebalanceOpen, demoOverride } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { pct, won } from '@/lib/format';
import { computeCurve, type WeightHistoryItem } from '@/lib/portfolio/engine';
import { pricesUpTo } from '@/lib/portfolio/prices';
import type { Details } from '@/lib/portfolio/details';
import { emptyWeights, reservePoints } from '@/lib/portfolio/weights';
import { compareDraft } from '@/lib/drafts/compare';
import { computeMarketWeek } from '@/lib/market-week';
import { getSessionUser } from '@/lib/session';
import { addDays, mondayOfWeeksAgo, weekOf } from '@/lib/week';
import { cn } from '@/lib/utils';

// S4 포트폴리오 — 사용자가 조작하는 유일한 대상: 6전선 포인트 편성
// 주말: 편성기가 1번. 평일: 초안이 1번, 편성기는 잠긴 채 아래에.
export default async function PortfolioPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  const open = await currentRebalanceOpen();
  const demo = await demoOverride();
  const weekend = dt === 'WEEKEND';

  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom), asc(allocations.decidedAt));

  const thisWeek = weekOf(new Date());
  const [draftRow] = await db
    .select()
    .from(drafts)
    .where(and(eq(drafts.userId, user.id), eq(drafts.weekOf, thisWeek)))
    .limit(1);
  const draft = draftRow
    ? { weights: draftRow.weights as Weights, note: draftRow.note as string | null }
    : null;

  const alreadyThisWeek = rows.some((r) => r.weekOf === thisWeek);
  const deadlineIso = `${addDays(mondayOfWeeksAgo(new Date(), 0), 6)}T12:00:00Z`;
  const disabledReason = !open
    ? '주말에만 조정할 수 있습니다. 평일에는 편성 현황과 학습이 열려 있어요.'
    : alreadyThisWeek
      ? '이번 주는 이미 조정했습니다. 조정하지 않아도 기존 편성이 그대로 유지됩니다.'
      : undefined;

  if (rows.length === 0) {
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <PageHeader
          title="포트폴리오"
          description="포인트 20개를 여섯 전선에 놓습니다. 아직 편성이 없으면 여기서 시작합니다."
        />
        {weekend && open ? (
          demo ? (
            <KeepNotice />
          ) : (
            <DeadlineCountdown deadlineIso={deadlineIso} />
          )
        ) : null}
        {dt === 'WEEKDAY' && !alreadyThisWeek ? (
          <DraftEditor initial={draft?.weights ?? null} initialNote={draft?.note ?? ''} existed={Boolean(draft)} />
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">전선 편성 (포인트 20개)</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightEditor
              initial={emptyWeights()}
              initialDetails={null}
              disabled={!open || alreadyThisWeek}
              disabledReason={disabledReason}
              draft={open && !alreadyThisWeek ? draft : null}
            />
          </CardContent>
        </Card>
        <FinePrint />
      </main>
    );
  }

  const latest = rows[rows.length - 1];
  const targetWeights = latest.weights as Weights;

  const { dates, series } = pricesUpTo(kstToday());
  const history: WeightHistoryItem[] = rows.map((r) => ({
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Record<string, number>,
    details: (r.details as Record<string, Record<string, number>> | null) ?? null,
  }));
  const lumpCurve = computeCurve(dates, series, history, { [rows[0].effectiveFrom]: SEED_AMOUNT });
  const lumpFinal = lumpCurve.values[lumpCurve.values.length - 1] ?? 0;

  const themeTotal = Object.values(lumpCurve.finalThemeValues).reduce((a, b) => a + b, 0);
  const round1 = (x: number) => Math.round(x * 10) / 10;
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
  // 막대 스케일. 조정 «단위»인 5%p를 절반 폭의 기준으로 삼는다.
  // ★ 최대 편차로만 정규화하면 3%p 벌어진 것도 칸을 꽉 채워 사태처럼 보인다.
  //   눈금이 고정되어야 「지난주보다 벌어졌나」를 주 간에 견줄 수 있다 (§7 사실 + 선택지).
  const gapScale = Math.max(maxAbsGap, 5);
  const week = computeMarketWeek(kstToday(), targetWeights);
  const awaitingFirst = lumpCurve.invested === 0;

  const deadlineBlock =
    open && !alreadyThisWeek ? (
      demo ? (
        <KeepNotice />
      ) : (
        <DeadlineCountdown deadlineIso={deadlineIso} />
      )
    ) : null;

  // 곡선은 «일시금 하나»다. 두 곡선을 합산한 총자산 타일을 만들지 않는다 (CLAUDE.md)
  const curveBlock =
    lumpCurve.values.length >= 2 ? (
      <div className="mt-2 flex flex-col gap-1.5">
        <ValueCurve
          values={lumpCurve.values}
          baseline={SEED_AMOUNT}
          ariaLabel={`${lumpCurve.dates[0]}부터 ${lumpCurve.dates[lumpCurve.dates.length - 1]}까지 평가액 곡선. 원금 ${won(SEED_AMOUNT)}, 현재 ${won(lumpFinal)}`}
        />
        <p className="flex justify-between font-mono text-[11px] tabular-nums text-faint">
          <span>{lumpCurve.dates[0]}</span>
          <span>{lumpCurve.dates[lumpCurve.dates.length - 1]}</span>
        </p>
      </div>
    ) : null;

  const returnsCard = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{weekend ? '평가액' : '누적 수익률'}</CardTitle>
      </CardHeader>
      <CardContent>
        {awaitingFirst ? (
          <p className="text-sm text-muted-foreground">
            첫 체결 대기 중 — {rows[0].effectiveFrom} 종가로 {won(SEED_AMOUNT)}이 배분됩니다.
          </p>
        ) : weekend ? (
          <div className="flex flex-col gap-1">
            <p className="text-3xl font-bold tabular-nums">{won(lumpFinal)}</p>
            <p className="text-sm text-muted-foreground">
              원금 {won(SEED_AMOUNT)} ·{' '}
              <span className={lumpFinal >= SEED_AMOUNT ? 'text-up' : 'text-down'}>
                누적 {pct(lumpFinal / SEED_AMOUNT - 1, 2)}
              </span>
            </p>
            {curveBlock}
            {week ? (
              <p className="text-sm">
                이번 주 내 편성 기준{' '}
                <span className={week.weightedPct >= 0 ? 'text-up' : 'text-down'}>
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
              className={`text-3xl font-bold tabular-nums ${lumpFinal >= SEED_AMOUNT ? 'text-up' : 'text-down'}`}
            >
              {pct(lumpFinal / SEED_AMOUNT - 1, 2)}
            </p>
            <p className="text-sm text-muted-foreground">
              평가액 {won(lumpFinal)} · 원금 {won(SEED_AMOUNT)}
            </p>
            {curveBlock}
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
  );

  const gapCard = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">목표 vs 현재 비중</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {gaps.map((g) => (
          <div key={g.code} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">{g.name}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                목표 {g.target}% → 현재 {g.current.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DivergingBar value={g.gap} maxAbs={gapScale} />
              <span
                className={cn(
                  'w-16 shrink-0 text-right font-mono text-xs tabular-nums',
                  g.gap === 0 ? 'text-muted-foreground' : g.gap > 0 ? 'text-up' : 'text-down',
                )}
              >
                {g.gap > 0 ? '+' : g.gap < 0 ? '−' : ''}
                {Math.abs(g.gap).toFixed(1)}%p
              </span>
            </div>
          </div>
        ))}
        <p className="text-[11px] text-faint">
          가운데 선이 목표입니다. 오른쪽으로 자라면 목표보다 많이, 왼쪽이면 적게 담긴 것입니다.
        </p>
        <p className="text-xs text-muted-foreground">
          시장이 움직이면 실제 비중은 목표에서 저절로 멀어집니다. 되돌리는 것이 리밸런싱입니다.{' '}
          <Link href="/learn#card-rebalance" className="underline">
            리밸런싱의 정의 →
          </Link>
        </p>
        {maxAbsGap > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">
              가장 많이 벌어진 전선이 <b className="text-foreground">{maxAbsGap.toFixed(1)}%p</b> 떨어져
              있습니다. 마지막 체결은 {latest.effectiveFrom}입니다.
            </p>
            <RevertButton target={targetWeights} disabled={!open || alreadyThisWeek} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            지금은 목표와 현재가 0.1%p 미만으로 일치합니다. 체결 직후이거나 시장이 거의 움직이지 않은
            구간입니다.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const editorCard = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">전선 편성 (포인트 20개)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {weekend ? deadlineBlock : null}
        <WeightEditor
          initial={targetWeights}
          initialDetails={(latest.details as Details | null) ?? null}
          disabled={!open || alreadyThisWeek}
          disabledReason={disabledReason}
          draft={open && !alreadyThisWeek ? draft : null}
        />
      </CardContent>
    </Card>
  );

  const draftCompare =
    alreadyThisWeek && draft ? (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">초안과 확정</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <SourceChip kind="rule" label="규칙 기반 비교 · 생성형 AI 아님" />
          <p className="text-sm leading-relaxed">{compareDraft(draft.weights, targetWeights).sentence}</p>
          {draft.note ? (
            <p className="text-xs leading-relaxed text-muted-foreground">평일에 적은 한 줄 — “{draft.note}”</p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">
            화요일의 판단과 주말의 판단이 다른 것은 잘못이 아닙니다. 그 차이를 본인 기록으로 보는 것이
            이 훈련입니다.
          </p>
        </CardContent>
      </Card>
    ) : null;

  const draftEditor =
    dt === 'WEEKDAY' && !alreadyThisWeek ? (
      <DraftEditor
        initial={draft?.weights ?? null}
        initialNote={draft?.note ?? ''}
        existed={Boolean(draft)}
      />
    ) : null;

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <PageHeader
        title="포트폴리오"
        description={
          open
            ? '이번 주 편성을 확정하는 화면입니다. 확정하면 다음 거래일 종가로 반영됩니다.'
            : '편성 현황과 초안만 다룹니다. 바꾸는 창은 주말에 열립니다.'
        }
      />

      {weekend ? (
        <>
          {editorCard}
          {gapCard}
          {returnsCard}
          {draftCompare}
        </>
      ) : (
        <>
          {returnsCard}
          {draftEditor}
          {editorCard}
          {gapCard}
          {draftCompare}
        </>
      )}

      <FinePrint />
    </main>
  );
}

function KeepNotice() {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2">
      <p className="text-sm font-medium">마감: 매주 일요일 21:00 (KST)</p>
      <p className="text-sm font-medium text-up">
        조정하지 않으면 기존 편성이 그대로 유지됩니다.
      </p>
    </div>
  );
}

function FinePrint() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      주 1회, 주말·공휴일에만 조정할 수 있고 일요일 21:00에 마감됩니다. 확정된 편성은 다음 거래일
      종가로 반영됩니다. 본 서비스의 시세는 교육용 모의 데이터입니다.
    </p>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NarrativeButton, OptInGate, OptOutButton } from '@/components/insights-panel';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POINT_UNIT, RESERVE, THEMES, type Weights } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { buildFactSentences, COHORT_LABEL } from '@/lib/insights';
import { computeInsightStats } from '@/lib/insights-data';
import { getSessionUser } from '@/lib/session';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// S9 성향 분석 (AI-7) — 옵트인 + 상호주의 + k-익명성.
// 하단 네비 없음. 지수 화면에서만 들어온다.
export default async function InsightsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  if (dt !== 'WEEKEND') {
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <PageHeader
          title="성향 분석"
          description="남과 나를 나란히 두는 화면도 평가 주기에 맞춥니다."
        />
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-2 py-5">
            <p className="text-lg font-semibold">비교 분석은 주말에 열립니다</p>
            <p className="text-sm text-muted-foreground">
              지금은 학습과 편성을 볼 수 있습니다. 주말이 되면 지수 화면에서 다시 엽니다.
            </p>
            <Link href="/learn" className="text-sm underline">
              학습으로 →
            </Link>
            <Link href="/league" className="text-sm underline">
              지수로 →
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!user.analyticsOptIn) {
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <PageHeader
          title="성향 분석"
          description="동의한 사람만 비교를 봅니다. 거절하면 비교 화면도 없습니다."
        />
        <OptInGate />
        <Link href="/league" className="text-sm text-muted-foreground underline">
          지수로 돌아가기 →
        </Link>
      </main>
    );
  }

  const data = await computeInsightStats(user);
  const [latest] = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(desc(allocations.effectiveFrom))
    .limit(1);
  const myWeights = (latest?.weights ?? {}) as Weights;

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <PageHeader
        title="성향 분석"
        description="라벨을 붙이지 않습니다. 사실 서술과 질문으로 끝냅니다."
      />

      {!data ? (
        <p className="text-sm text-muted-foreground">아직 배분 이력이 없습니다.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            비교 집단: {COHORT_LABEL[data.stats.cohort]} {data.stats.cohortN}명 · 20명 미만이면 더 큰
            집단으로 합쳐 표시합니다
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">① 전선 편성</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {THEMES.map((t) => (
                <div key={t.code} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0">{t.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${myWeights[t.code] ?? 0}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono text-xs tabular-nums">
                    {(myWeights[t.code] ?? 0) / POINT_UNIT}
                    <span className="ml-1 text-muted-foreground">{myWeights[t.code] ?? 0}%</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0">{RESERVE.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full border border-dashed border-muted-foreground/60"
                    style={{ width: `${data.stats.myCash}%` }}
                  />
                </div>
                <span className="w-14 text-right font-mono text-xs tabular-nums">
                  {data.stats.myCash / POINT_UNIT}
                  <span className="ml-1 text-muted-foreground">{data.stats.myCash}%</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">② 집중도</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold tabular-nums">최대 {data.stats.myMaxTheme.weight}%</p>
                <p className="text-xs text-muted-foreground">
                  HHI {data.stats.myHhi.toFixed(2)} · 코호트 최대비중 중앙값{' '}
                  {Math.round(data.stats.cohortMaxWeightMedian)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">③ 회전율</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold tabular-nums">주당 {data.stats.myTurnover.toFixed(1)}%p</p>
                <p className="text-xs text-muted-foreground">
                  코호트 중앙값 {data.stats.cohortTurnoverMedian.toFixed(1)}%p
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">④ 예비대</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold tabular-nums">{data.stats.myCash / POINT_UNIT}포인트</p>
                <p className="text-xs text-muted-foreground">
                  코호트 중앙값 {Math.round(data.stats.cohortCashMedian)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⑤ 변동성</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold tabular-nums">연 {Math.round(data.stats.myVol * 100)}%</p>
                <p className="text-xs text-muted-foreground">전역 곡선 일간 수익률 기준</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">사실 서술</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                {buildFactSentences(
                  data.stats,
                  THEMES.find((t) => t.code === data.stats.myMaxTheme.code)?.name ?? '',
                ).map((s, i) => (
                  <p key={i} className="text-sm leading-relaxed">
                    {s}
                  </p>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                위 문장은 규칙 기반 계산 결과입니다 (AI 아님). 아래 버튼은 같은 숫자를 생성형 AI가
                서술합니다 — 조언이 감지되면 표시하지 않습니다.
              </p>
              <NarrativeButton />
            </CardContent>
          </Card>

          <OptOutButton />
          <Link href="/league" className="text-sm text-muted-foreground underline">
            지수로 돌아가기 →
          </Link>
        </>
      )}
    </main>
  );
}

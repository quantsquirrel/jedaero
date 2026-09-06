import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NarrativeButton, OptInGate, OptOutButton } from '@/components/insights-panel';
import { JobLinks } from '@/components/job-links';
import { PageHeader } from '@/components/page-header';
import { CompareMark } from '@/components/charts/compare-mark';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POINT_UNIT, RESERVE, THEMES, type Weights } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { buildFactSentences, COHORT_LABEL } from '@/lib/insights';
import { computeInsightStats, computeOwnProfile } from '@/lib/insights-data';
import { LEAD_BAND } from '@/lib/lead-band';
import { weekRangeLabel } from '@/lib/week';
import { getSessionUser } from '@/lib/session';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// S9 성향 분석 (AI-7) — 옵트인 + 상호주의 + k-익명성.
// ★ 이 화면의 첫 읽기는 «막대 행»이어야 한다. 제목·네비가 아니다.
//   막대를 h-2/chart-2로 두면 8px 어두운 조각이라 24px 표제를 이길 수 없었다.
//   h-3 + 사다리 최상단(chart-1) + 수치 본문 단으로 올려 데이터에 첫 자리를 준다.
// 하단 네비 없음. 지수 화면에서만 들어온다.
export default async function InsightsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  if (dt !== 'WEEKEND') {
    // 평일 — 코호트 «비교»는 닫혀 있지만 내 이력만으로 나오는 사실은 열려 있다.
    // 순서: 무엇이 있었나 → 지금 무엇이 열려 있나 → 다음에 무엇이 열리나.
    // ★ 코호트 중앙값·분포는 여기 올리지 않는다. 그것이 옵트인이 가리는 대상이다.
    const own = await computeOwnProfile(user.id);
    const maxThemeName = own
      ? (THEMES.find((t) => t.code === own.maxTheme.code)?.name ?? '')
      : '';
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <PageHeader
          title="성향 분석"
          description="평일에는 내 기록만 읽습니다. 남과 나란히 두는 비교는 주말에 엽니다."
        />

        {own ? (
          <>
            {/* ① 무엇이 있었나 — 이 화면의 작업 대상 */}
            <Card className={LEAD_BAND}>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between gap-3 text-base">
                  <span>내 전선 편성</span>
                  <span className="font-mono text-xs font-normal tabular-nums text-muted-foreground">
                    {weekRangeLabel(own.latestWeek)} 확정
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {THEMES.map((t) => (
                  <div key={t.code} className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0 truncate">{t.name}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[var(--chart-1)]"
                        style={{ width: `${own.weights[t.code] ?? 0}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">
                      {(own.weights[t.code] ?? 0) / POINT_UNIT}
                      <span className="ml-1 text-xs text-muted-foreground">{own.weights[t.code] ?? 0}%</span>
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 truncate">{RESERVE.name}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full border border-dashed border-muted-foreground/60"
                      style={{ width: `${own.cash}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">
                    {own.cash / POINT_UNIT}
                    <span className="ml-1 text-xs text-muted-foreground">{own.cash}%</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">내 기록이 말하는 것</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                  <FactRow
                    term="가장 많이 놓은 전선"
                    value={`${maxThemeName} ${own.maxTheme.weight}%`}
                  />
                  <FactRow term="집중도 (HHI)" value={own.hhi.toFixed(2)} />
                  <FactRow
                    term="주당 평균 변경폭"
                    value={own.turnover == null ? '집계 대기' : `${own.turnover.toFixed(1)}%p`}
                  />
                  <FactRow term="예비대" value={`${own.cash / POINT_UNIT}포인트 · ${own.cash}%`} />
                  <FactRow term="연 변동성" value={`${Math.round(own.vol * 100)}%`} />
                  <FactRow term="확정한 주" value={`${own.weeks}주`} />
                </dl>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  전부 내 편성 이력만으로 계산한 값입니다. 높고 낮음이 잘하고 못하고를 뜻하지
                  않습니다. 라벨을 붙이지 않습니다.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className={LEAD_BAND}>
            <CardContent className="flex flex-col gap-2 py-5">
              <p className="text-base font-semibold">아직 편성 기록이 없습니다</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                첫 편성을 확정하면 그때부터 이 화면이 내 기록을 읽습니다. 비어 있는 것은 잘못이
                아닙니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ② 지금 무엇이 열려 있나 */}
        <JobLinks
          items={[
            { href: '/learn', label: '학습 · 전선 등락', hint: '평일에 열려 있는 읽을거리' },
            { href: '/league', label: '제대로 지수', hint: '최근 확정 집계와 세 축' },
          ]}
        />

        {/* ③ 다음에 무엇이 열리나 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주말에 열리는 것</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              동의한 사람들의 분포 위에 내 값을 얹어 보는 코호트 비교가 주말에 열립니다. 동의하지
              않으면 비교 화면 자체가 열리지 않고, 그때도 위의 내 기록은 그대로 읽을 수 있습니다.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              비교 집단이 20명 미만이면 더 큰 집단으로 합쳐 표시합니다.
            </p>
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
        <Link href="/league" className="inline-flex min-h-11 items-center self-start text-sm text-muted-foreground underline">
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

          <Card className={LEAD_BAND}>
            <CardHeader>
              <CardTitle className="text-base">① 전선 편성</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {THEMES.map((t) => (
                <div key={t.code} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0">{t.name}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[var(--chart-1)]"
                      style={{ width: `${myWeights[t.code] ?? 0}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">
                    {(myWeights[t.code] ?? 0) / POINT_UNIT}
                    <span className="ml-1 text-xs text-muted-foreground">{myWeights[t.code] ?? 0}%</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0">{RESERVE.name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full border border-dashed border-muted-foreground/60"
                    style={{ width: `${data.stats.myCash}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">
                  {data.stats.myCash / POINT_UNIT}
                  <span className="ml-1 text-xs text-muted-foreground">{data.stats.myCash}%</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">② ~ ④ 나와 코호트</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CompareRow
                title="② 집중도"
                mineText={`최대 ${data.stats.myMaxTheme.weight}%`}
                mine={data.stats.myMaxTheme.weight}
                cohort={data.stats.cohortMaxWeightMedian}
                cohortText={`${Math.round(data.stats.cohortMaxWeightMedian)}%`}
                max={100}
                note={`HHI ${data.stats.myHhi.toFixed(2)}`}
              />
              <CompareRow
                title="③ 회전율"
                mineText={`주당 ${data.stats.myTurnover.toFixed(1)}%p`}
                mine={data.stats.myTurnover}
                cohort={data.stats.cohortTurnoverMedian}
                cohortText={`${data.stats.cohortTurnoverMedian.toFixed(1)}%p`}
                max={Math.max(data.stats.myTurnover, data.stats.cohortTurnoverMedian) * 1.25 || 1}
              />
              <CompareRow
                title="④ 예비대"
                mineText={`${data.stats.myCash / POINT_UNIT}포인트 (${data.stats.myCash}%)`}
                mine={data.stats.myCash}
                cohort={data.stats.cohortCashMedian}
                cohortText={`${Math.round(data.stats.cohortCashMedian)}%`}
                max={100}
              />
              <p className="text-xs leading-relaxed text-faint">
                가는 세로선이 코호트 중앙값입니다. 높고 낮음이 잘하고 못하고를 뜻하지 않습니다 —
                어디쯤 서 있는지만 보여줍니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">⑤ 변동성</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-semibold tabular-nums">연 {Math.round(data.stats.myVol * 100)}%</p>
              <p className="text-xs text-muted-foreground">
                전역 곡선 일간 수익률 기준 · 견줄 코호트 값이 없어 숫자로만 둡니다
              </p>
            </CardContent>
          </Card>

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
              <p className="text-xs text-muted-foreground">
                위 문장은 규칙 기반 계산 결과입니다 (AI 아님). 아래 버튼은 같은 숫자를 생성형 AI가
                서술합니다 — 조언이 감지되면 표시하지 않습니다.
              </p>
              <NarrativeButton />
            </CardContent>
          </Card>

          <OptOutButton />
          <Link href="/league" className="inline-flex min-h-11 items-center self-start text-sm text-muted-foreground underline">
            지수로 돌아가기 →
          </Link>
        </>
      )}
    </main>
  );
}

/** 한 축 위에 내 값과 코호트 중앙값을 나란히. 숫자는 «글자로도» 위에 적는다 —
 *  막대가 유일한 읽기 수단이 되면 안 된다 (DESIGN-RULES §9-1). */
function CompareRow({
  title,
  mineText,
  mine,
  cohort,
  cohortText,
  max,
  note,
}: {
  title: string;
  mineText: string;
  mine: number;
  cohort: number;
  cohortText: string;
  max: number;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm">{title}</span>
        <span className="font-mono text-sm font-semibold tabular-nums">{mineText}</span>
      </div>
      <CompareMark mine={mine} cohort={cohort} max={max} />
      <p className="font-mono text-xs tabular-nums text-muted-foreground">
        코호트 중앙값 {cohortText}
        {note ? <span className="text-faint"> · {note}</span> : null}
      </p>
    </div>
  );
}

/** 이름과 값 한 줄. 규칙선으로 묶어 한 덩어리로 읽게 한다. */
function FactRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-3">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="shrink-0 font-mono text-sm tabular-nums">{value}</dd>
    </div>
  );
}

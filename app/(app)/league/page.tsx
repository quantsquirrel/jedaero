import Link from 'next/link';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { JobLinks } from '@/components/job-links';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { SEED_AMOUNT, type Weights } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { pct } from '@/lib/format';
import { annualizedVol } from '@/lib/insights';
import { effectiveFronts, INDEX_LABELS } from '@/lib/jedaero-index';
import { board, BOARD_LABEL, computeAndStoreWeeklyScore, type BoardScope } from '@/lib/league';
import { computeCurve, maxDrawdown, type WeightHistoryItem } from '@/lib/portfolio/engine';
import { pricesUpTo } from '@/lib/portfolio/prices';
import { getSessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';

// S7 리그 — 「제대로 지수」로 겨룬다. 주간 시즌제, 누적 순위 없음 (C7)
const SCOPES: BoardScope[] = ['GROUP', 'BRANCH', 'RANK'];

export default async function LeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  if (dt !== 'WEEKEND') {
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <PageHeader
          title="제대로 지수"
          description="비교는 주말에 한 번에 봅니다. 평일에는 무엇을 재는지와 그룹만 준비합니다."
        />
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-3 py-5">
            <p className="text-lg font-semibold">비교는 주말에 한 번에 봅니다</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              짧은 구간의 점수 줄 세우기는 대개 운입니다. 세 축은 그대로 두고, 숫자는 주말에
              엽니다.
            </p>
            <ul className="flex flex-col gap-2">
              {INDEX_LABELS.map((row) => (
                <li key={row.key} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-right text-xs text-muted-foreground">
                    {row.max}점 · {row.hint}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <JobLinks
          items={[
            { href: '/groups', label: '그룹', hint: '주말 「우리 그룹」 비교의 자리. 초대코드' },
            { href: '/learn', label: '학습 · 전선 등락', hint: '평일에 열려 있는 읽을거리' },
          ]}
          footnote="성향 분석도 주말에 지수 화면에서 엽니다."
        />
      </main>
    );
  }

  const sp = await searchParams;
  const scope: BoardScope = SCOPES.includes(sp.scope as BoardScope)
    ? (sp.scope as BoardScope)
    : 'GROUP';

  const mine = await computeAndStoreWeeklyScore(user);
  const list = await board(user, scope);

  const allocs = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom));
  let vol = 0;
  let mdd = 0;
  let fronts = 0;
  if (allocs.length > 0) {
    const { dates, series } = pricesUpTo(kstToday());
    const history: WeightHistoryItem[] = allocs.map((a) => ({
      effectiveFrom: a.effectiveFrom,
      weights: a.weights as Record<string, number>,
      details: (a.details as Record<string, Record<string, number>> | null) ?? null,
    }));
    const { values } = computeCurve(dates, series, history, {
      [allocs[0].effectiveFrom]: SEED_AMOUNT,
    });
    vol = annualizedVol(values);
    mdd = maxDrawdown(values);
    fronts = effectiveFronts(allocs[allocs.length - 1].weights as Weights);
  }

  const parts = [mine.grown, mine.spread, mine.held];

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <PageHeader
        title="제대로 지수"
        description="등수는 없습니다. 매주 월요일 리셋 · 누적 순위 없음."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">내 점수</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {mine.hasHistory ? (
            <>
              <p className="text-4xl font-bold tabular-nums">
                {mine.total}
                <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
              </p>
              <div className="flex flex-col gap-2">
                {INDEX_LABELS.map((row, i) => (
                  <div key={row.key} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-xs">{row.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(parts[i] / row.max) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-xs tabular-nums">
                      {parts[i]}
                      <span className="text-muted-foreground">/{row.max}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {INDEX_LABELS.map((r) => `${r.label} = ${r.hint}`).join(' · ')}. 세 축 중 하나만
                밀어서는 만점이 나오지 않습니다. 짧은 시즌의 수익률 1등은 대개 몰빵이고, 이 서비스는
                그 행동을 표창하지 않습니다.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 편성 이력이 없어 집계할 것이 없습니다. 첫 편성을 확정하면 다음 주말부터 나옵니다.
            </p>
          )}
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
              <p className="text-[11px] text-muted-foreground">실질 전선 수</p>
              <p className="font-mono text-sm tabular-nums">{fronts.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">함께 보기</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-1.5">
            {SCOPES.map((s) => (
              <Link
                key={s}
                href={`/league?scope=${s}`}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs transition-colors',
                  s === scope
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40',
                )}
              >
                {BOARD_LABEL[s]}
              </Link>
            ))}
          </div>

          {list.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {scope === 'GROUP'
                ? '아직 속한 그룹이 없습니다. 아래 그룹에서 초대코드로 들어가거나 만들 수 있습니다.'
                : '아직 집계할 인원이 없습니다.'}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{list.n}명 · 가입순</p>
              <div className="flex flex-col gap-1">
                {list.entries.map((e, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm',
                      e.isMe && 'bg-primary/10',
                    )}
                  >
                    <span>
                      {e.nickname}
                      {e.isMe ? ' (나)' : ''}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {e.total != null ? `${e.total}점` : '집계 대기'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            등수를 매기지 않고 가입순으로 둡니다. 정렬 자체가 등수가 되기 때문입니다. 수익 금액은
            어디에도 표시하지 않습니다.
          </p>
        </CardContent>
      </Card>

      <JobLinks
        items={[
          {
            href: '/groups',
            label: '그룹',
            hint: '초대코드 · 최대 30명. 「우리 그룹」 탭의 자리',
            primary: scope === 'GROUP' && list.entries.length === 0,
          },
          {
            href: '/insights',
            label: '성향 분석',
            hint: '코호트 분포 비교 · 옵트인 후에만',
          },
        ]}
      />
    </main>
  );
}

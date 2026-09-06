import Link from 'next/link';
import { redirect } from 'next/navigation';
import { IndexGauge } from '@/components/index-gauge';
import { JobLinks } from '@/components/job-links';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { currentDayType } from '@/lib/day-context';
import { pct } from '@/lib/format';
import { INDEX_LABELS } from '@/lib/jedaero-index';
import { LEAD_BAND } from '@/lib/lead-band';
import {
  board,
  BOARD_LABEL,
  computeAndStoreWeeklyScore,
  lastSettledScore,
  ownRisk,
  type BoardScope,
} from '@/lib/league';
import { getSessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';
import { weekRangeLabel } from '@/lib/week';

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
    // 평일 — 「비교」는 닫혀 있지만 «이미 계산돼 있는 사실»은 열려 있다.
    // 순서: 무엇이 있었나 → 지금 무엇이 열려 있나 → 다음에 무엇이 열리나.
    // ★ 없는 숫자를 지어내지 않는다. 확정 집계가 없으면 「집계 대기」라고 적는다 (§7).
    const settled = await lastSettledScore(user.id);
    const risk = await ownRisk(user.id);
    return (
      <main className="flex flex-col gap-4 px-5 py-8">
        <PageHeader
          title="제대로 지수"
          description="확정된 주의 집계를 읽는 화면입니다. 남과 견주는 비교는 주말에 한 번 엽니다."
        />

        {/* ① 무엇이 있었나 — 이 화면의 작업 대상. 들린 표면 한 단으로 세운다 */}
        <Card className={LEAD_BAND}>
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between gap-3 text-base">
              <span>최근 확정 집계</span>
              {settled ? (
                <span className="font-mono text-xs font-normal tabular-nums text-muted-foreground">
                  {weekRangeLabel(settled.weekOf)}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {settled ? (
              <>
                <p className="text-3xl font-bold tabular-nums">
                  {Math.round(settled.total * 10) / 10}
                  <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
                </p>
                <IndexGauge parts={[settled.grown, settled.spread, settled.held]} />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {weekRangeLabel(settled.weekOf)} 주에 확정된 값입니다. 평일에는 다시 계산하지
                  않습니다. 매일 움직이는 숫자를 매일 보는 것이 이 서비스가 줄이려는 행동입니다.
                </p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                아직 확정된 주간 집계가 없어 집계 대기입니다. 첫 편성을 확정하면 그 주말부터
                세 축의 점수가 여기에 남습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 내 편성 이력만으로 나오는 값 — 코호트가 필요 없어 평일에도 성립한다 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">내 편성이 감당한 흔들림</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {risk.hasHistory ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/40 p-2">
                    <p className="text-xs text-muted-foreground">연 변동성</p>
                    <p className="font-mono text-sm tabular-nums">{Math.round(risk.vol * 100)}%</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <p className="text-xs text-muted-foreground">최대낙폭</p>
                    <p className="font-mono text-sm tabular-nums">{pct(risk.mdd)}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <p className="text-xs text-muted-foreground">실질 전선 수</p>
                    <p className="font-mono text-sm tabular-nums">{risk.fronts.toFixed(1)}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  내 편성 이력만으로 계산합니다. 남과 견주지 않으므로 요일과 무관하게 열려 있습니다.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                아직 편성 이력이 없어 집계 대기입니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ② 지금 무엇이 열려 있나 */}
        <JobLinks
          items={[
            { href: '/groups', label: '그룹', hint: '주말 「우리 그룹」 비교의 자리. 초대코드' },
            { href: '/learn', label: '학습 · 전선 등락', hint: '평일에 열려 있는 읽을거리' },
          ]}
        />

        {/* ③ 다음에 무엇이 열리나 — 잠근 사실이 아니라 «언제 열리는지»를 적는다 (§7) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주말에 열리는 것</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              같은 그룹 · 같은 군종 · 같은 계급의 점수를 나란히 놓는 비교가 주말에 열립니다. 짧은
              구간의 점수 줄 세우기는 대개 운이라, 세 축은 그대로 두고 숫자만 주 단위로 엽니다.
            </p>
            <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
              {INDEX_LABELS.map((row) => (
                <li key={row.key} className="flex items-baseline justify-between gap-3 px-3 py-3">
                  <span className="text-sm font-medium">{row.label}</span>
                  <span className="shrink-0 text-right text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">{row.max}점</span> · {row.hint}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-muted-foreground">
              성향 분석도 주말에 이 화면에서 엽니다. 등수 숫자와 수익 금액은 어느 요일에도 만들지
              않습니다.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const sp = await searchParams;
  const scope: BoardScope = SCOPES.includes(sp.scope as BoardScope)
    ? (sp.scope as BoardScope)
    : 'GROUP';

  const mine = await computeAndStoreWeeklyScore(user);
  const list = await board(user, scope);

  const { vol, mdd, fronts } = await ownRisk(user.id);

  const parts = [mine.grown, mine.spread, mine.held];

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <PageHeader
        title="제대로 지수"
        description="등수는 없습니다. 매주 월요일 리셋 · 누적 순위 없음."
      />

      <Card className={LEAD_BAND}>
        <CardHeader>
          <CardTitle className="text-base">내 점수</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {mine.hasHistory ? (
            <>
              <p className="text-3xl font-bold tabular-nums">
                {mine.total}
                <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
              </p>
              <IndexGauge parts={parts} />
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
              <p className="text-xs text-muted-foreground">연 변동성</p>
              <p className="font-mono text-sm tabular-nums">{Math.round(vol * 100)}%</p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">최대낙폭</p>
              <p className="font-mono text-sm tabular-nums">{pct(mdd)}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">실질 전선 수</p>
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
                aria-current={s === scope ? 'page' : undefined}
                className={cn(
                  // ★ 활성 탭은 «지금 어디를 보고 있나»이지 «지금 누를 것»이 아니다.
                  //   신호색을 여기 쓰면 화면의 amber가 둘이 된다 (DESIGN-RULES §0.3).
                  'flex min-h-11 items-center rounded-md border px-3 text-xs transition-colors',
                  s === scope
                    ? 'border-input bg-muted font-medium text-foreground'
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
                      'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                      // 「(나)」 라벨이 이미 누구인지 말한다. 색은 표면으로만 구분한다 —
                      // 신호색은 «할 일»에만 쓴다.
                      e.isMe && 'bg-muted',
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

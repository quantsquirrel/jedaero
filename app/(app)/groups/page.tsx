import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GroupForms } from '@/components/group-forms';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { myGroupBoards } from '@/lib/groups';
import { getSessionUser } from '@/lib/session';
import { LEAD_BAND } from '@/lib/lead-band';
import { cn } from '@/lib/utils';

// S10 그룹 — 초대코드, 정원 30명. 하단 네비 없음. 홈·지수에서 진입.
export default async function GroupsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const boards = await myGroupBoards(user.id);

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <PageHeader
        title="그룹"
        description="지수 「우리 그룹」 비교의 자리입니다. 수익 금액도 등수도 없습니다."
      />

      {/* 이 화면의 작업 대상. 만들거나 들어가는 것 말고 할 일이 없다 */}
      <Card className={LEAD_BAND}>
        <CardHeader>
          <CardTitle className="text-base">만들거나 들어가기</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForms />
        </CardContent>
      </Card>

      {boards.map((b) => (
        <Card key={b.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{b.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                초대코드 {b.inviteCode} · {b.members.length}/{b.memberLimit}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {b.members.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm',
                  m.isMe && 'bg-muted',
                )}
              >
                <span>
                  {m.nickname}
                  {m.isMe ? ' (나)' : ''}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {m.total != null ? `${m.total}점` : '집계 대기'}
                </span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              제대로 지수는 위험을 이긴 성과(40) · 분산의 힘(30) · 판단을 지킨 힘(30)을 합한
              점수입니다.
            </p>
          </CardContent>
        </Card>
      ))}

      {/* 빈 상태를 나무라지 않는다. 대신 «그룹이 무엇을 여는가»를 사실로 적는다 (§7) */}
      {boards.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">그룹이 여는 것</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              아직 참여한 그룹이 없습니다. 그룹에 들어가면 주말 지수 화면의 「우리 그룹」 탭에
              구성원의 제대로 지수가 가입순으로 나란히 섭니다.
            </p>
            <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
              <GroupFact term="정원" value="최대 30명" />
              <GroupFact term="들어가는 법" value="초대코드 한 번" />
              <GroupFact term="보이는 것" value="별명 · 제대로 지수" />
              <GroupFact term="보이지 않는 것" value="등수 · 수익 금액 · 부대" />
            </ul>
            <p className="text-xs leading-relaxed text-muted-foreground">
              그룹 없이도 나머지 화면은 전부 열려 있습니다. 안 만들어도 됩니다.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Link href="/league" className="inline-flex min-h-11 items-center self-start text-sm text-muted-foreground underline">
        지수로 돌아가기 →
      </Link>
    </main>
  );
}

/** 이름과 값 한 줄. 규칙선으로 묶어 한 덩어리로 읽게 한다. */
function GroupFact({ term, value }: { term: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 px-3 py-3">
      <span className="text-sm text-muted-foreground">{term}</span>
      <span className="shrink-0 text-right text-sm">{value}</span>
    </li>
  );
}

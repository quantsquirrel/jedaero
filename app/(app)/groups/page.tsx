import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GroupForms } from '@/components/group-forms';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { myGroupBoards } from '@/lib/groups';
import { getSessionUser } from '@/lib/session';
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

      <Card>
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
                  'flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm',
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

      {boards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 참여한 그룹이 없습니다. 만들거나 초대코드로 참여해보세요.
        </p>
      ) : null}

      <Link href="/league" className="text-sm text-muted-foreground underline">
        지수로 돌아가기 →
      </Link>
    </main>
  );
}

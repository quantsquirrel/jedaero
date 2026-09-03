import { redirect } from 'next/navigation';
import { GroupForms } from '@/components/group-forms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { myGroupBoards } from '@/lib/groups';
import { getSessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';

// S10 그룹 — 초대코드, 정원 30명. 지표는 제대로 지수 하나뿐이다.
// ★ 등수도 정렬도 만들지 않는다. 목록은 가입순.
// 그룹 안에서 수익률은 보이지 않는다 — "얼마 벌었다" 문화를 만들지 않기 위해서다.
export default async function GroupsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const boards = await myGroupBoards(user.id);

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">그룹</h1>

      <Card>
        <CardContent className="pt-4">
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
                  m.isMe && 'bg-primary/10',
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
              이 화면에는 수익 금액도 등수도 없습니다. 제대로 지수는 불린 만큼(40) · 나눠 담은
              만큼(30) · 버틴 만큼(30)을 합한 점수입니다.
            </p>
          </CardContent>
        </Card>
      ))}

      {boards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 참여한 그룹이 없습니다. 만들거나 초대코드로 참여해보세요.
        </p>
      ) : null}
    </main>
  );
}

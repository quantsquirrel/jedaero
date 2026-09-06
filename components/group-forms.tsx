'use client';
// 그룹 생성·참여 (SPEC §3-8) — 그룹명은 AI-5 필터 통과분만
import { useActionState, useState } from 'react';
import { createGroupAction, joinGroupAction, type GroupFormState } from '@/app/actions/groups';
import { checkGroupName } from '@/lib/filters/unit-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GroupForms() {
  const [createState, createAction, creating] = useActionState<GroupFormState, FormData>(
    createGroupAction,
    {},
  );
  const [joinState, joinAction, joining] = useActionState<GroupFormState, FormData>(
    joinGroupAction,
    {},
  );
  const [name, setName] = useState('');
  const [clientError, setClientError] = useState('');

  // ★ 차단 사유를 «누른 순간» 같은 자리에 적는다. 서버 왕복을 기다리면 아무 일도 안 일어난
  //   것처럼 보여 한 번 더 누르게 된다. 판정 함수는 서버 액션이 쓰는 것과 «같은» 것이라
  //   두 곳이 갈라지지 않는다 — 서버가 여전히 최종 권한이다 (방어는 이중으로).
  const blocked = (): string => {
    const check = checkGroupName(name);
    return check.blocked ? (check.reason ?? '사용할 수 없는 그룹명입니다.') : '';
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        action={createAction}
        onSubmit={(e) => {
          const reason = blocked();
          setClientError(reason);
          if (reason) e.preventDefault();
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="group-name">새 그룹 만들기</Label>
        <div className="flex gap-2">
          <Input
            id="group-name"
            name="name"
            maxLength={20}
            placeholder="예: 해뜰날 저축단"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={clientError ? true : undefined}
            aria-describedby="group-name-error"
          />
          <Button type="submit" disabled={creating}>
            만들기
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          부대를 식별할 수 있는 이름은 쓸 수 없습니다. 생활관 별명, 취미, 좋아하는 것으로
          지어주세요.
        </p>
        {clientError || createState.error ? (
          <p id="group-name-error" role="alert" className="text-sm text-destructive">
            {clientError || createState.error}
          </p>
        ) : null}
        {createState.ok ? <p className="text-sm text-up">그룹이 만들어졌습니다.</p> : null}
      </form>

      <form action={joinAction} className="flex flex-col gap-2">
        <Label htmlFor="group-code">초대코드로 참여</Label>
        <div className="flex gap-2">
          <Input id="group-code" name="code" maxLength={6} placeholder="6자리 코드" required />
          <Button type="submit" variant="secondary" disabled={joining}>
            참여
          </Button>
        </div>
        {joinState.error ? <p role="alert" className="text-sm text-destructive">{joinState.error}</p> : null}
        {joinState.ok ? <p className="text-sm text-up">참여했습니다.</p> : null}
      </form>
    </div>
  );
}

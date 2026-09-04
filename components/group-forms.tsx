'use client';
// 그룹 생성·참여 (SPEC §3-8) — 그룹명은 AI-5 필터 통과분만
import { useActionState } from 'react';
import { createGroupAction, joinGroupAction, type GroupFormState } from '@/app/actions/groups';
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

  return (
    <div className="flex flex-col gap-4">
      <form action={createAction} className="flex flex-col gap-2">
        <Label htmlFor="group-name">새 그룹 만들기</Label>
        <div className="flex gap-2">
          <Input id="group-name" name="name" maxLength={20} placeholder="예: 해뜰날 저축단" required />
          <Button type="submit" disabled={creating}>
            만들기
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          부대를 식별할 수 있는 이름은 쓸 수 없습니다. 생활관 별명, 취미, 좋아하는 것으로
          지어주세요.
        </p>
        {createState.error ? <p className="text-sm text-destructive">{createState.error}</p> : null}
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
        {joinState.error ? <p className="text-sm text-destructive">{joinState.error}</p> : null}
        {joinState.ok ? <p className="text-sm text-up">참여했습니다.</p> : null}
      </form>
    </div>
  );
}

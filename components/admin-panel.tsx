'use client';
// 관리자 로그인·킬스위치 토글 (S11)
import { useActionState, useTransition } from 'react';
import { adminLogin, setAiEnabled, type AdminLoginState } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(adminLogin, {});
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="admin-pw">관리자 비밀번호</Label>
      <div className="flex gap-2">
        <Input id="admin-pw" name="password" type="password" required />
        <Button type="submit" disabled={pending}>
          입장
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function KillSwitch({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <div>
        <p className="font-semibold">AI 킬스위치</p>
        <p className="text-sm text-muted-foreground">
          현재: {enabled ? 'AI 사용 중' : '중지됨 — 룰 기반 폴백 동작'}
        </p>
      </div>
      <Button
        type="button"
        variant={enabled ? 'destructive' : 'default'}
        disabled={pending}
        onClick={() => startTransition(() => setAiEnabled(!enabled).then(() => {}))}
      >
        {enabled ? 'AI 중지' : 'AI 재개'}
      </Button>
    </div>
  );
}

'use client';
// 「목표대로 되돌리기」 — 리밸런싱의 실행 (SPEC §3-6 g)
// 목표 비중을 그대로 재확정해 다음 거래일 종가로 되돌린다. 주 1회 규칙에 그대로 편입된다.
import { useState, useTransition } from 'react';
import { saveAllocation } from '@/app/actions/allocation';
import { Button } from '@/components/ui/button';
import type { Weights } from '@/lib/constants';

export function RevertButton({ target, disabled }: { target: Weights; disabled: boolean }) {
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const res = await saveAllocation(target);
      if ('error' in res) setMsg({ error: res.error });
      else setMsg({ ok: `되돌리기 확정 — ${res.effectiveFrom} 종가로 목표 비중에 맞춰집니다.` });
    });

  return (
    <div className="flex flex-col gap-1.5">
      <Button type="button" variant="outline" disabled={disabled || pending} onClick={run}>
        {pending ? '확정 중…' : '목표대로 되돌리기'}
      </Button>
      {msg.error ? <p className="text-xs text-destructive">{msg.error}</p> : null}
      {msg.ok ? <p className="text-xs text-up">{msg.ok}</p> : null}
    </div>
  );
}

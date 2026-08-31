'use client';
// 데모 요일 전환 토글 — 심사자가 평일에 접속해도 주말 기능을 볼 수 있게 한다 (SPEC §7)
import { useTransition } from 'react';
import { setDemoDay } from '@/app/actions/demo';
import { cn } from '@/lib/utils';

export function DemoToggle({ mode }: { mode: 'WEEKDAY' | 'WEEKEND' }) {
  const [pending, startTransition] = useTransition();
  const btn = (target: 'WEEKDAY' | 'WEEKEND', label: string) => (
    <button
      type="button"
      disabled={pending || mode === target}
      onClick={() => startTransition(() => setDemoDay(target))}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
        mode === target ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2">
      <span className="text-xs font-medium text-amber-300">데모 · 요일 전환</span>
      <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
        {btn('WEEKDAY', '평일 모드')}
        {btn('WEEKEND', '주말 모드')}
      </div>
    </div>
  );
}

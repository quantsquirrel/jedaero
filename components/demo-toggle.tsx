'use client';
// 데모 요일 전환 토글 — 심사자가 평일에 접속해도 주말 기능을 볼 수 있게 한다 (SPEC §7)
// 토글만 있고 무엇이 열리는지 안 적으면, 심사 5일(전부 평일)에 제품의 절반이 안 보인다.
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setDemoDay } from '@/app/actions/demo';
import { cn } from '@/lib/utils';

export function DemoToggle({ mode }: { mode: 'WEEKDAY' | 'WEEKEND' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shownMode, setShownMode] = useState(mode);
  const [error, setError] = useState('');
  useEffect(() => setShownMode(mode), [mode]);
  const weekday = shownMode === 'WEEKDAY';

  const switchTo = (target: 'WEEKDAY' | 'WEEKEND') => {
    setError('');
    startTransition(async () => {
      const result = await setDemoDay(target);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShownMode(result.mode);
      router.refresh();
    });
  };

  const btn = (target: 'WEEKDAY' | 'WEEKEND', label: string) => (
    <button
      type="button"
      disabled={pending || shownMode === target}
      onClick={() => switchTo(target)}
      aria-pressed={shownMode === target}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
        shownMode === target
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-col gap-1.5 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-amber-300">
          {weekday ? '데모 · 지금은 평일 화면' : '데모 · 지금은 주말 화면'}
        </span>
        <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
          {btn('WEEKDAY', '평일')}
          {btn('WEEKEND', '주말')}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-amber-200/80">
        {weekday
          ? '주말로 바꾸면 편성 조정 · 이번 주 변동 · 제대로 지수가 열립니다.'
          : '평일로 바꾸면 전선 등락과 오늘의 지형 요약이 열리고, 편성 조정은 잠깁니다.'}
      </p>
      <p aria-live="polite" className="sr-only">
        {pending ? '화면을 전환하는 중입니다.' : error || `${weekday ? '평일' : '주말'} 화면입니다.`}
      </p>
      {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}

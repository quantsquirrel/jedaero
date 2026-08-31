'use client';
// 6축 비중 조정기 — 사용자가 조작하는 유일한 대상 (SPEC §3-6)
// 슬라이더 금지. 5%p 단위 +/- 버튼. 하나를 움직이면 나머지가 비례 조정되어 합은 항상 100.
import { useState, useTransition } from 'react';
import { saveAllocation } from '@/app/actions/allocation';
import { Button } from '@/components/ui/button';
import { THEMES, type ThemeCode, type Weights } from '@/lib/constants';
import { adjustWeight } from '@/lib/portfolio/weights';
import { cn } from '@/lib/utils';

export function WeightEditor({
  initial,
  disabled,
  disabledReason,
}: {
  initial: Weights;
  disabled: boolean;
  disabledReason?: string;
}) {
  const [weights, setWeights] = useState<Weights>(initial);
  const [result, setResult] = useState<{ ok?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const dirty = THEMES.some((t) => weights[t.code] !== initial[t.code]);
  const locked = disabled || pending;

  const bump = (code: ThemeCode, delta: 5 | -5) => {
    setResult({});
    setWeights((w) => adjustWeight(w, code, delta));
  };

  const submit = () =>
    startTransition(async () => {
      const res = await saveAllocation(weights);
      if ('error' in res) setResult({ error: res.error });
      else setResult({ ok: `확정됐습니다. ${res.effectiveFrom} 종가로 반영됩니다 (예약 체결).` });
    });

  return (
    <div className="flex flex-col gap-3">
      {THEMES.map((t) => (
        <div key={t.code} className="flex items-center justify-between gap-3">
          <span className="text-sm">{t.name}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`${t.name} 5%p 줄이기`}
              disabled={locked || weights[t.code] <= 0}
              onClick={() => bump(t.code, -5)}
            >
              −
            </Button>
            <span className="w-12 text-center font-mono text-base tabular-nums">{weights[t.code]}%</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`${t.name} 5%p 늘리기`}
              disabled={locked || weights[t.code] >= 100}
              onClick={() => bump(t.code, 5)}
            >
              +
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-border pt-2 text-sm text-muted-foreground">
        <span>합계</span>
        <span className="font-mono tabular-nums">
          {THEMES.reduce((s, t) => s + weights[t.code], 0)}%
        </span>
      </div>

      {disabled && disabledReason ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{disabledReason}</p>
      ) : null}
      {result.error ? <p className="text-sm text-destructive">{result.error}</p> : null}
      {result.ok ? <p className="text-sm text-emerald-400">{result.ok}</p> : null}

      <Button
        type="button"
        className={cn('h-11', !dirty && 'opacity-60')}
        disabled={locked || !dirty}
        onClick={submit}
      >
        {pending ? '저장 중…' : '이번 주 비중 확정'}
      </Button>
      <p className="text-xs text-muted-foreground">
        확정하면 이번 주에는 다시 바꿀 수 없고, 다음 거래일 종가로 반영됩니다. 결정과 체결 사이의
        시차는 예약주문의 본질입니다.
      </p>
    </div>
  );
}

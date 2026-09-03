'use client';
// 전선 편성기 — 사용자가 조작하는 유일한 대상 (DESIGN-DECISIONS §3)
// 슬라이더 금지. 포인트 20개를 +/- 버튼으로 배치한다. % 는 작은 글씨로 병기.
// ★ 자동 재조정 없음. 한 전선을 올려도 다른 전선은 그대로다. 포인트는 원래 유한하다.
// ★ 예비대(미배치분)를 항상 표시한다. "0%"가 아니라 "예비대 7포인트"라고 적혀야
//   방치가 아니라 선택이 된다 (과소투자를 조용히 훈련시키지 않기 위한 장치).
import { useState, useTransition } from 'react';
import { saveAllocation } from '@/app/actions/allocation';
import { Button } from '@/components/ui/button';
import { POINT_UNIT, RESERVE, THEMES, TOTAL_POINTS, type ThemeCode, type Weights } from '@/lib/constants';
import { adjustPoints, pointsOf, reservePoints } from '@/lib/portfolio/weights';
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
  const reserve = reservePoints(weights);

  const bump = (code: ThemeCode, delta: 1 | -1) => {
    setResult({});
    setWeights((w) => adjustPoints(w, code, delta));
  };

  const submit = () =>
    startTransition(async () => {
      const res = await saveAllocation(weights);
      if ('error' in res) setResult({ error: res.error });
      else setResult({ ok: `확정됐습니다. ${res.effectiveFrom} 종가로 반영됩니다 (예약 체결).` });
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        포인트 <span className="font-mono tabular-nums">{TOTAL_POINTS}</span>개를 여섯 전선에
        나눠 놓습니다. 1포인트 = {POINT_UNIT}%.
      </p>

      {THEMES.map((t) => {
        const pt = pointsOf(weights, t.code);
        return (
          <div key={t.code} className="flex items-center justify-between gap-3">
            <span className="text-sm">{t.name}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`${t.name} 1포인트 빼기`}
                disabled={locked || pt <= 0}
                onClick={() => bump(t.code, -1)}
              >
                −
              </Button>
              <span className="w-16 text-center font-mono text-base tabular-nums">
                {pt}
                <span className="ml-1 text-xs text-muted-foreground">
                  {weights[t.code] ?? 0}%
                </span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`${t.name} 1포인트 놓기`}
                disabled={locked || reserve <= 0}
                onClick={() => bump(t.code, 1)}
              >
                +
              </Button>
            </div>
          </div>
        );
      })}

      {/* 예비대 — 축이 아니라 잔여지만, 하나의 축처럼 보여야 한다 */}
      <div className="rounded-md border border-dashed border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{RESERVE.name}</span>
          <span className="font-mono text-base tabular-nums">
            {reserve}
            <span className="ml-1 text-xs text-muted-foreground">{reserve * POINT_UNIT}%</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{RESERVE.note}</p>
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
        {pending ? '저장 중…' : '이번 주 편성 확정'}
      </Button>
      <p className="text-xs text-muted-foreground">
        확정하면 이번 주에는 다시 바꿀 수 없고, 다음 거래일 종가로 반영됩니다. 결정과 체결 사이의
        시차는 예약주문의 본질입니다.
      </p>
    </div>
  );
}

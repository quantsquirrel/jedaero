'use client';
// 예산 봉투 배정 — 월 1회 확정 후 잠금 (SPEC §3-2 B)
import { useActionState } from 'react';
import { saveBudget, type BudgetState } from '@/app/actions/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { won } from '@/lib/format';

export function BudgetForm({
  yearMonth,
  categories,
  salary,
  initial,
}: {
  yearMonth: string;
  categories: readonly string[];
  salary: number;
  initial?: Record<string, number>;
}) {
  const [state, formAction, pending] = useActionState<BudgetState, FormData>(saveBudget, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="yearMonth" value={yearMonth} />
      <p className="text-sm text-muted-foreground">
        {yearMonth} · 월 봉급 <b className="text-foreground">{won(salary)}</b>{' '}
        <span className="text-xs">(규칙 기반 · AI 아님)</span>
      </p>
      {categories.map((cat) => (
        <div key={cat} className="flex items-center justify-between gap-3">
          <Label htmlFor={`cat-${cat}`} className="shrink-0">
            {cat}
          </Label>
          <Input
            id={`cat-${cat}`}
            name={`cat:${cat}`}
            type="number"
            min={0}
            step={1000}
            defaultValue={initial?.[cat] ?? ''}
            placeholder="0"
            className="w-36 text-right"
          />
        </div>
      ))}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-400">저장됐습니다.</p> : null}
      <div className="flex gap-2">
        <Button type="submit" name="lock" value="false" variant="outline" disabled={pending} className="flex-1">
          임시 저장
        </Button>
        <Button type="submit" name="lock" value="true" disabled={pending} className="flex-1">
          확정하고 잠그기
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        확정하면 이 달에는 다시 바꿀 수 없습니다. 봉투는 월초에 정하고, 그 달에 바꾸지 않는
        훈련입니다.
      </p>
    </form>
  );
}

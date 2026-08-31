'use client';
import { useActionState, useEffect, useRef } from 'react';
import { addExpense, type AddExpenseState } from '@/app/actions/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ExpenseForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState<AddExpenseState, FormData>(addExpense, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occurredOn">날짜</Label>
          <Input id="occurredOn" name="occurredOn" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">금액 (원)</Label>
          <Input id="amount" name="amount" type="number" min={1} step={1} placeholder="4500" required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">메모</Label>
        <Input id="memo" name="memo" maxLength={60} placeholder="예: PX 과자" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-11">
        {pending ? '기록 중… (AI 분류 제안 생성)' : '지출 기록'}
      </Button>
    </form>
  );
}

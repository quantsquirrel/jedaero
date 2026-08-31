'use client';
// 주말 한 줄 회고 (REVIEW_1) — 입력은 LLM 파이프라인과 동일한 필터를 거친다
import { useActionState } from 'react';
import { submitReview, type ReviewState } from '@/app/actions/learn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ReviewForm() {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="review-text">이번 주 한 줄 회고</Label>
      <div className="flex gap-2">
        <Input id="review-text" name="text" maxLength={200} placeholder="예: 하락장에도 비중을 지켰다" required />
        <Button type="submit" disabled={pending}>
          남기기
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-emerald-400">기록됐습니다 — 회고 퀘스트 완료. (내용은 저장되지 않습니다)</p>
      ) : null}
    </form>
  );
}

'use client';
// 주말 한 줄 회고 (REVIEW_1) + AI-3 되묻기
// 입력은 LLM 파이프라인과 동일한 필터를 거친다. 회고 내용은 저장하지 않는다.
import { useActionState } from 'react';
import { submitReview, type ReviewState } from '@/app/actions/learn';
import { AiNotice } from '@/components/ai-notice';
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
          {pending ? '읽는 중…' : '남기기'}
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-emerald-400">남겼습니다. 내용은 저장되지 않습니다.</p>
      ) : null}

      {state.reflection ? (
        <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3">
          {state.source === 'ai' ? (
            <AiNotice />
          ) : (
            <span className="inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              규칙 기반 되묻기 · 생성형 AI 아님
            </span>
          )}
          {state.notice ? <p className="text-xs text-muted-foreground">{state.notice}</p> : null}
          <p className="text-sm leading-relaxed">{state.reflection.acknowledgement}</p>
          <p className="text-sm font-medium leading-relaxed">{state.reflection.question}</p>
          <p className="text-xs text-muted-foreground">
            답을 적어 보내는 칸은 없습니다. 답은 다음 주 결정으로 하시면 됩니다.
          </p>
        </div>
      ) : null}
    </form>
  );
}

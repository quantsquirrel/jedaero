'use client';
// 주말 한 줄 회고 (REVIEW_1) + AI-3 되묻기
// 입력은 LLM 파이프라인과 동일한 필터를 거친다. 회고 내용은 저장하지 않는다.
import { useActionState } from 'react';
import { submitReview, type ReviewState } from '@/app/actions/learn';
import { AiNotice } from '@/components/ai-notice';
import { SourceChip } from '@/components/source-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type CoachContext = {
  allocation: string;
  duration: string;
  weeklyMove: string;
  defaultReview?: string;
};

export function ReviewForm({ coachContext }: { coachContext?: CoachContext } = {}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  return (
    <form action={formAction} className="flex flex-col gap-2">
      {coachContext ? (
        <div className="mb-2">
          <p className="text-xs font-semibold text-muted-foreground">분석 입력</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-muted/40 p-2">
              <dt className="text-muted-foreground">편성(목표 비중)</dt>
              <dd className="mt-1 font-medium leading-relaxed">{coachContext.allocation}</dd>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <dt className="text-muted-foreground">유지 기간</dt>
              <dd className="mt-1 font-medium leading-relaxed">{coachContext.duration}</dd>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <dt className="text-muted-foreground">이번 주 변동</dt>
              <dd className="mt-1 font-medium leading-relaxed">{coachContext.weeklyMove}</dd>
            </div>
          </dl>
        </div>
      ) : null}
      <Label htmlFor="review-text">사용자 회고</Label>
      <div className="flex gap-2">
        <Input
          id="review-text"
          name="text"
          maxLength={200}
          placeholder="예: 하락장에도 비중을 지켰다"
          defaultValue={coachContext?.defaultReview}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? '읽는 중…' : coachContext ? 'AI 코치' : '남기기'}
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-up">분석했습니다. 입력 내용은 저장되지 않습니다.</p>
      ) : null}

      {state.reflection ? (
        <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3">
          {state.source === 'ai' ? (
            <AiNotice />
          ) : (
            <SourceChip kind="rule" label="규칙 기반 되묻기 · 생성형 AI 아님" />
          )}
          {state.notice ? <p className="text-xs text-muted-foreground">{state.notice}</p> : null}
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {state.source === 'ai' ? 'AI가 발견한 행동 패턴' : '규칙이 확인한 행동 사실'}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{state.reflection.acknowledgement}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">다음 판단을 위한 질문</p>
            <p className="mt-1 text-sm font-medium leading-relaxed">{state.reflection.question}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            답을 적어 보내는 칸은 없습니다. 답은 다음 주 결정으로 하시면 됩니다.
          </p>
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground">
        추천과 최종 결정을 하지 않습니다. 회고 원문은 응답 생성 뒤 저장하지 않고 폐기합니다.
      </p>
    </form>
  );
}

'use client';
// 주말 한 줄 회고 (REVIEW_1) + AI-3 되묻기
// 입력은 LLM 파이프라인과 동일한 필터를 거친다. 필터를 통과한 한 줄은 이번 주 행으로 남는다.
import { useActionState } from 'react';
import { submitReview, type ReviewState } from '@/app/actions/learn';
import { AiNotice } from '@/components/ai-notice';
import { SourceChip } from '@/components/source-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ★ 이 세 값은 「분석 입력」이라는 라벨을 달고 화면에 선다. 그러므로 «실제로 모델에 들어가는 것»과
//   같아야 한다. lib/ai/reflect.ts 의 입력은 회고 원문 + 이 셋(조정 여부·바꾼폭 / 유지 주수 / 예비대 몫)이다.
//   편성 비중과 이번 주 손익은 모델에 «들어가지 않는다» — 여기에 적으면 화면이 거짓을 말하고,
//   평일에는 주말에만 열기로 한 내 손익을 이 자리에서 새어 보이게 한다.
export type CoachContext = {
  /** 이번 주 조정 여부와 바꾼폭 (%p) */
  turnover: string;
  /** 마지막 조정 이후 지난 주수 */
  duration: string;
  /** 어느 전선에도 놓지 않은 몫 (%) */
  reserve: string;
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
              <dt className="text-muted-foreground">이번 주 조정</dt>
              <dd className="mt-1 font-medium leading-relaxed">{coachContext.turnover}</dd>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <dt className="text-muted-foreground">유지 기간</dt>
              <dd className="mt-1 font-medium leading-relaxed">{coachContext.duration}</dd>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <dt className="text-muted-foreground">예비대 몫</dt>
              <dd className="mt-1 font-medium leading-relaxed">{coachContext.reserve}</dd>
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
        {/* ★ 신호색을 쓰지 않는다. 같은 화면(/home)에 「오늘 할 수 있는 일」의 그날의 행동이
            이미 amber로 서 있고, 한 줄 회고는 «안 적어도 되는» 선택이다 (§7 빈 상태 규범).
            둘 다 amber면 화면에 「지금 누를 것」이 둘이 되어 어느 쪽도 가리키지 못한다. */}
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? '읽는 중…' : coachContext ? 'AI 코치' : '남기기'}
        </Button>
      </div>
      {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-up">남겼습니다. 전역 때 그 주 편성과 함께 다시 보입니다.</p>
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
        추천과 최종 결정을 하지 않습니다. 한 줄은 본인 복기용으로만 남습니다.
      </p>
    </form>
  );
}

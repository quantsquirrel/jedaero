'use client';
// AI-8 호출 버튼. 배지 없이 AI 응답을 띄우지 않는다 (C9).
import { useState, useTransition } from 'react';
import { generatePrinciplesAction, type PrinciplesResult } from '@/app/actions/principles';
import { AiNotice } from '@/components/ai-notice';
import { SourceChip } from '@/components/source-chip';

export function PrinciplesAi() {
  const [result, setResult] = useState<PrinciplesResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {result === null ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => setResult(await generatePrinciplesAction()))}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-input text-sm font-semibold transition-colors hover:border-muted-foreground/40 disabled:opacity-60"
        >
          {pending ? '읽는 중…' : '왜 다른지 보기'}
        </button>
      ) : 'error' in result ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {result.error}
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3.5">
          {result.source === 'ai' ? <AiNotice /> : <SourceChip kind="rule" />}
          {/* ★ 폴백 안내는 그것이 가리키는 문장«앞»에 온다 — 뒤에 두면 아래를 가리키는 말이
              아무것도 없는 곳을 가리킨다 (market-week-card·review-form 과 같은 순서). */}
          {result.notice ? <p className="text-xs text-muted-foreground">{result.notice}</p> : null}
          <p className="text-sm leading-relaxed">{result.narrative.text}</p>
          <p className="text-sm font-semibold leading-relaxed">{result.narrative.question}</p>
        </div>
      )}
    </div>
  );
}

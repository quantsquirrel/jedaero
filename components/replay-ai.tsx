'use client';
// AI-9 호출 버튼. 배지 없이 AI 응답을 띄우지 않는다 (C9).
import { useState, useTransition } from 'react';
import { generateReplayAction, type ReplayResult } from '@/app/actions/replay';
import { AiNotice } from '@/components/ai-notice';
import { SourceChip } from '@/components/source-chip';
import { FIXED_COPY } from '@/lib/principles/copy';

export function ReplayAi() {
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{FIXED_COPY.replayAiTitle}</h2>
      {result === null ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => setResult(await generateReplayAction()))}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-input text-sm font-semibold transition-colors hover:border-muted-foreground/40 disabled:opacity-60"
        >
          {pending ? '읽는 중…' : '그때를 되짚기'}
        </button>
      ) : 'error' in result ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
          {result.error}
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3.5">
          {result.source === 'ai' ? <AiNotice /> : <SourceChip kind="rule" />}
          {result.notice ? <p className="text-xs text-muted-foreground">{result.notice}</p> : null}
          <p className="text-sm leading-relaxed">{result.narrative.text}</p>
          <p className="text-sm font-semibold leading-relaxed">{result.narrative.question}</p>
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.replayAiNoAnswer}</p>
    </div>
  );
}

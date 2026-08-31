'use client';
// AI-7 옵트인 동의·AI 서술 생성 버튼
import { useState, useTransition } from 'react';
import { generateNarrativeAction, setAnalyticsOptIn } from '@/app/actions/insights';
import { AiNotice } from '@/components/ai-notice';
import { Button } from '@/components/ui/button';

export function OptInGate() {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <h2 className="text-lg font-semibold">집단 성향 분석 동의</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        동의하면 내 배분 데이터가 <b className="text-foreground">익명 집계</b>에 포함되고, 그
        대가로 동기들의 분포와 비교한 분석을 볼 수 있습니다. 내 데이터를 주지 않으면 남의
        데이터로 만든 분석도 보지 않습니다 — 강제도 아니고 공짜도 아닙니다.
      </p>
      <ul className="list-disc pl-5 text-xs leading-relaxed text-muted-foreground">
        <li>집계에는 배분 비중만 쓰입니다. 지출 내역·닉네임은 포함되지 않습니다.</li>
        <li>코호트 인원이 20명 미만이면 더 큰 집단으로 합쳐 표시합니다 (k-익명성).</li>
        <li>언제든 철회할 수 있습니다.</li>
      </ul>
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          className="flex-1"
          onClick={() => startTransition(() => setAnalyticsOptIn(true).then(() => {}))}
        >
          동의하고 분석 보기
        </Button>
        <Button type="button" variant="outline" disabled={pending} className="flex-1" onClick={() => history.back()}>
          다음에
        </Button>
      </div>
    </div>
  );
}

export function OptOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setAnalyticsOptIn(false).then(() => {}))}
      className="text-xs text-muted-foreground underline"
    >
      동의 철회 (비교 화면도 함께 사라집니다)
    </button>
  );
}

export function NarrativeButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ text?: string; error?: string }>({});

  const run = () =>
    startTransition(async () => {
      const res = await generateNarrativeAction();
      if ('text' in res) setResult({ text: res.text });
      else setResult({ error: res.error });
    });

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={run}>
        {pending ? '생성 중…' : 'AI 사실 서술 생성'}
      </Button>
      {result.text ? (
        <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3">
          <AiNotice />
          <p className="text-sm leading-relaxed">{result.text}</p>
        </div>
      ) : null}
      {result.error ? <p className="text-sm text-destructive">{result.error}</p> : null}
    </div>
  );
}

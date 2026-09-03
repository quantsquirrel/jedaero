'use client';
// AI-4 주간 브리핑 카드.
// 위쪽 등락표는 규칙 기반(시드 가격 계산)이고, 아래쪽 브리핑만 생성형 AI다 — 화면에서 구분 표기한다 (C9).
import { useState, useTransition } from 'react';
import { generateBriefingAction } from '@/app/actions/briefing';
import { AiNotice } from '@/components/ai-notice';
import { Button } from '@/components/ui/button';
import type { Briefing } from '@/lib/ai/briefing';
import { pct } from '@/lib/format';
import type { ThemeMove } from '@/lib/market-week';
import { cn } from '@/lib/utils';

export function MarketWeekCard({
  fromDate,
  toDate,
  tradingDays,
  moves,
  weightedPct,
  variant = 'full',
}: {
  fromDate: string;
  toDate: string;
  tradingDays: number;
  moves: ThemeMove[];
  weightedPct: number;
  /** terrain: 시황만 (평일). full: 내 비중 가중 + AI 브리핑 (주말) */
  variant?: 'terrain' | 'full';
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ briefing?: Briefing; source?: 'ai' | 'rule'; notice?: string; error?: string }>({});

  const run = () =>
    startTransition(async () => {
      const res = await generateBriefingAction();
      if ('error' in res) setResult({ error: res.error });
      else setResult({ briefing: res.briefing, source: res.source, notice: res.notice });
    });

  const maxAbs = Math.max(...moves.map((m) => Math.abs(m.changePct)), 0.0001);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">
          {fromDate} ~ {toDate} · 영업일 {tradingDays}일{' '}
          <span className="text-[11px]">(규칙 기반 계산 · AI 아님)</span>
        </p>
        {variant === 'full' ? (
          <p className="text-sm">
            내 비중으로 가중하면{' '}
            <b className={cn(weightedPct >= 0 ? 'text-emerald-400' : 'text-red-400')}>{pct(weightedPct)}</b>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">전선이 얼마나 움직였는지만 봅니다. 내 손익은 주말에.</p>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {moves.map((m) => {
          const up = m.changePct >= 0;
          const width = (Math.abs(m.changePct) / maxAbs) * 50;
          return (
            <li key={m.code} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 truncate">{m.name}</span>
              {variant === 'full' ? (
                <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {m.myWeight}%
                </span>
              ) : null}
              <span className="relative h-3 flex-1 overflow-hidden rounded-sm bg-muted/40">
                <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <span
                  className={cn('absolute inset-y-0 rounded-sm', up ? 'bg-emerald-500/70' : 'bg-red-500/70')}
                  style={up ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }}
                />
              </span>
              <span
                className={cn(
                  'w-16 shrink-0 text-right font-mono text-xs tabular-nums',
                  up ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {pct(m.changePct)}
              </span>
            </li>
          );
        })}
      </ul>

      {variant === 'full' ? (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={run}>
            {pending ? '생성 중…' : 'AI 주간 브리핑 받기'}
          </Button>

          {result.error ? <p className="text-sm text-destructive">{result.error}</p> : null}

          {result.briefing ? (
            <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3">
              {result.source === 'ai' ? (
                <AiNotice />
              ) : (
                <span className="inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  규칙 기반 요약 · 생성형 AI 아님
                </span>
              )}
              {result.notice ? <p className="text-xs text-muted-foreground">{result.notice}</p> : null}
              <p className="text-sm leading-relaxed">{result.briefing.summary}</p>
              <div className="flex flex-col gap-1 border-t border-border pt-2">
                <p className="text-xs text-muted-foreground">스스로 던져볼 질문</p>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
                  {result.briefing.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        전망도 추천도 하지 않습니다. 지나간 구간에 무엇이 얼마나 움직였는지만 보여주고, 판단은
        여러분이 합니다. 가격은 교육용 합성 데이터입니다.
      </p>
    </div>
  );
}

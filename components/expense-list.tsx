'use client';
// 지출 목록 + AI-1 제안 확인·확정 (P0-5)
// 확정 주체는 항상 사용자다 (C8). 신뢰도 < 0.7이면 분류하지 않고 묻는다.
import { useState, useTransition } from 'react';
import { confirmExpenseTier } from '@/app/actions/expense';
import { AiNotice } from '@/components/ai-notice';
import { Button } from '@/components/ui/button';
import { CONFIDENCE_THRESHOLD } from '@/lib/constants';
import { TIER_LABEL, won } from '@/lib/format';
import { cn } from '@/lib/utils';

export type ExpenseItem = {
  id: string;
  occurredOn: string;
  amount: number;
  memo: string | null;
  tier: string;
  aiSuggestedTier: string | null;
  aiConfidence: number | null;
  confirmedByUser: boolean;
};

const TIER_BADGE: Record<string, string> = {
  A: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  B: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  C: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  UNCLASSIFIED: 'border-border bg-muted text-muted-foreground',
};

const FILTERS = ['ALL', 'A', 'B', 'C', 'UNCLASSIFIED'] as const;

function orderedTiers(suggested: string | null): ('A' | 'B' | 'C')[] {
  const all: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
  if (!suggested || !all.includes(suggested as 'A')) return all;
  return [suggested as 'A' | 'B' | 'C', ...all.filter((t) => t !== suggested)];
}

export function ExpenseList({ items }: { items: ExpenseItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [pending, startTransition] = useTransition();

  const visible = items.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNCLASSIFIED') return !e.confirmedByUser;
    return e.confirmedByUser && e.tier === filter;
  });

  const confirm = (id: string, tier: 'A' | 'B' | 'C') =>
    startTransition(async () => {
      await confirmExpenseTier(id, tier);
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs',
              filter === f ? 'border-primary bg-primary/15 text-foreground' : 'border-border text-muted-foreground',
            )}
          >
            {f === 'ALL' ? '전체' : TIER_LABEL[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">기록이 없습니다.</p>
      ) : null}

      {visible.map((e) => {
        const unconfirmed = !e.confirmedByUser;
        const lowConfidence =
          e.aiSuggestedTier != null && (e.aiConfidence ?? 0) < CONFIDENCE_THRESHOLD;
        return (
          <div key={e.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.memo}</p>
                <p className="text-xs text-muted-foreground">{e.occurredOn}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-sm tabular-nums">{won(e.amount)}</span>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px]',
                    TIER_BADGE[unconfirmed ? 'UNCLASSIFIED' : e.tier],
                  )}
                >
                  {unconfirmed ? '미분류' : TIER_LABEL[e.tier]}
                </span>
              </div>
            </div>

            {unconfirmed ? (
              <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-2.5">
                <AiNotice />
                {e.aiSuggestedTier == null ? (
                  <p className="text-sm text-muted-foreground">
                    AI 제안을 만들지 못했습니다. 직접 선택해주세요.
                  </p>
                ) : lowConfidence ? (
                  <p className="text-sm">
                    판단하기 어렵습니다. 어느 쪽에 가까운가요?{' '}
                    <span className="text-muted-foreground">
                      (신뢰도 {Math.round((e.aiConfidence ?? 0) * 100)}%)
                    </span>
                  </p>
                ) : (
                  <p className="text-sm">
                    제안: <b>{TIER_LABEL[e.aiSuggestedTier]}</b>{' '}
                    <span className="text-muted-foreground">
                      (신뢰도 {Math.round((e.aiConfidence ?? 0) * 100)}%)
                    </span>
                  </p>
                )}
                <div className="flex gap-1.5">
                  {orderedTiers(e.aiSuggestedTier).map((t, i) => (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={i === 0 && e.aiSuggestedTier ? 'default' : 'outline'}
                      disabled={pending}
                      onClick={() => confirm(e.id, t)}
                      className="flex-1"
                    >
                      {TIER_LABEL[t]}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

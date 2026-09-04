'use client';
// 학습 카드 아코디언 — 끝까지 읽으면 LEARN_1 완료
import { useState, useTransition } from 'react';
import { completeLearnCard } from '@/app/actions/learn';
import { Button } from '@/components/ui/button';
import type { LearnCard } from '@/lib/learn-cards';
import { cn } from '@/lib/utils';

export function LearnCardsView({ cards, initialOpen }: { cards: LearnCard[]; initialOpen?: string }) {
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const finish = (id: string) =>
    startTransition(async () => {
      await completeLearnCard();
      setDone((s) => new Set(s).add(id));
    });

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((c) => {
        const isOpen = open === c.id;
        return (
          <div key={c.id} id={`card-${c.id}`} className="rounded-xl border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 p-3.5 text-left"
              onClick={() => setOpen(isOpen ? null : c.id)}
            >
              <div>
                <p className="text-xs text-muted-foreground">
                  {c.step}단계 · {c.feature}
                </p>
                <p className="font-semibold">{c.title}</p>
              </div>
              <span className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-180')}>⌄</span>
            </button>
            {isOpen ? (
              <div className="flex flex-col gap-2.5 border-t border-border p-3.5">
                {c.body.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {para}
                  </p>
                ))}
                {done.has(c.id) ? (
                  <p className="text-sm text-emerald-400">읽음으로 표시했습니다.</p>
                ) : (
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => finish(c.id)}>
                    끝까지 읽었어요
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

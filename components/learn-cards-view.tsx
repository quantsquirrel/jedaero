'use client';
// 학습 카드 아코디언 — 끝까지 읽으면 LEARN_1 완료
// 기능 화면에서 /learn#card-patience 로 들어오면 해당 카드를 연다. 닫힌 채로 스크롤만 되면 읽히지 않는다.
import { useEffect, useState, useTransition } from 'react';
import { completeLearnCard } from '@/app/actions/learn';
import { Button } from '@/components/ui/button';
import type { LearnCard } from '@/lib/learn-cards';
import { cn } from '@/lib/utils';

function cardIdFromHash(hash: string): string | null {
  const raw = hash.replace(/^#/, '');
  const id = raw.startsWith('card-') ? raw.slice('card-'.length) : null;
  return id || null;
}

export function LearnCardsView({ cards, initialOpen }: { cards: readonly LearnCard[]; initialOpen?: string }) {
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const apply = () => {
      const id = cardIdFromHash(window.location.hash);
      if (id && cards.some((c) => c.id === id)) setOpen(id);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [cards]);

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
          <div key={c.id} id={`card-${c.id}`} className="scroll-mt-40 rounded-xl border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 p-3.5 text-left"
              onClick={() => setOpen(isOpen ? null : c.id)}
              aria-expanded={isOpen}
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
                  <p className="text-sm text-up">읽음으로 표시했습니다.</p>
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

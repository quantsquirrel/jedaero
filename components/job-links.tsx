import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type JobLinkItem = {
  href: string;
  label: string;
  hint?: string;
  primary?: boolean;
};

/** 문단이 아니라 실제 다음 화면으로 보내는 할 일 목록. */
export function JobLinks({ items, footnote }: { items: JobLinkItem[]; footnote?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => {
        const className = cn(
          'flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-colors',
          it.primary
            ? 'border-amber-400/40 bg-amber-400/5 hover:border-amber-400/70'
            : 'border-border hover:border-muted-foreground/40',
        );
        const body = (
          <>
            <span className="min-w-0">
              <span className="block font-semibold">{it.label}</span>
              {it.hint ? (
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{it.hint}</span>
              ) : null}
            </span>
            <span className="shrink-0 text-sm text-muted-foreground" aria-hidden>
              →
            </span>
          </>
        );
        // 같은 페이지 해시(#market)는 Next Link가 스크롤을 안 하는 경우가 있어 일반 앵커를 쓴다.
        if (it.href.startsWith('#')) {
          return (
            <a key={`${it.href}:${it.label}`} href={it.href} className={className}>
              {body}
            </a>
          );
        }
        return (
          <Link key={`${it.href}:${it.label}`} href={it.href} className={className}>
            {body}
          </Link>
        );
      })}
      {footnote ? <p className="pt-0.5 text-xs leading-relaxed text-muted-foreground">{footnote}</p> : null}
    </div>
  );
}

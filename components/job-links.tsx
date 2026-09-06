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
    // data-region — 스카우트가 지정한 참조 착지 선택자. 눈이 대응을 여기서 확인한다.
    <div data-region="job-links" className="flex flex-col gap-2">
      {items.map((it) => {
        // ★ 「지금 할 수 있는 하나」는 색만이 아니라 «크기»로도 달라야 한다.
        //   같은 높이 네 줄에 색만 다르면 목록이 네 번 같은 무게로 읽힌다.
        const className = cn(
          'flex items-center justify-between gap-3 rounded-xl border px-4 transition-colors',
          it.primary
            ? 'border-primary/40 bg-primary/5 py-4 hover:border-primary/70'
            : 'border-border py-3 hover:border-muted-foreground/40',
        );
        const body = (
          <>
            <span className="min-w-0">
              <span className={cn('block font-semibold', it.primary && 'text-base')}>{it.label}</span>
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

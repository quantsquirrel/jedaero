import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** 앱 화면 공통 헤더. 제목 아래 한 줄로 이 화면의 역할을 고정한다. */
export function PageHeader({
  kicker,
  title,
  description,
  badge,
  titleClassName,
}: {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  titleClassName?: string;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {kicker ? <p className="text-sm text-muted-foreground">{kicker}</p> : null}
        <h1
          className={cn(
            'font-bold tracking-tight',
            kicker ? 'mt-0.5 text-3xl' : 'text-2xl',
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description ? (
          <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </header>
  );
}

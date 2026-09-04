'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Home, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/portfolio', label: '포트폴리오', icon: PieChart },
  { href: '/league', label: '지수', icon: BarChart3 },
  { href: '/learn', label: '학습', icon: BookOpen },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 화면"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur"
    >
      <div className="flex justify-around">
        {ITEMS.map((it) => {
          const active =
            it.href === '/league'
              ? pathname.startsWith('/league') ||
                pathname.startsWith('/groups') ||
                pathname.startsWith('/insights')
              : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium',
                active ? 'text-amber-400' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/home', label: '홈' },
  { href: '/portfolio', label: '포트폴리오' },
  { href: '/expenses', label: '가계부' },
  { href: '/league', label: '리그' },
  { href: '/learn', label: '학습' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur">
      <div className="flex justify-around">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex-1 py-3 text-center text-sm font-medium',
              pathname.startsWith(it.href) ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

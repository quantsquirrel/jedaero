import Link from 'next/link';

const STEPS = [
  { label: '시장 읽기', href: '/home#market' },
  { label: 'AI 코치', href: '/home#ai-coach' },
  { label: '주말 편성', href: '/portfolio' },
  { label: '제대로 지수', href: '/league' },
  { label: '도상훈련', href: '/learn#drill' },
] as const;

export function DemoGuide() {
  return (
    <details className="border-b border-border bg-background/95 px-4 py-2" open>
      <summary className="cursor-pointer text-xs font-semibold">3분 심사용 동선</summary>
      <ol className="mt-2 grid grid-cols-5 gap-1" aria-label="3분 심사용 데모 순서">
        {STEPS.map((step, i) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex min-h-12 flex-col rounded-md border border-border px-1.5 py-1.5 text-[10px] leading-tight text-muted-foreground hover:border-amber-400/50 hover:text-foreground"
            >
              <span className="font-mono text-amber-400">{i + 1}</span>
              <span>{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
        1~2는 평일, 3~4는 위 토글을 주말로. 5 도상훈련은 요일과 무관합니다.
      </p>
    </details>
  );
}

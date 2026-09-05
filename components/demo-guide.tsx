import Link from 'next/link';

const STEPS = [
  { label: '시장 읽기', href: '/home#market' },
  { label: 'AI 코치', href: '/home#ai-coach' },
  { label: '주말 편성', href: '/portfolio' },
  { label: '제대로 지수', href: '/league' },
  { label: '도상훈련', href: '/learn#drill' },
  { label: '나의 투자 원칙', href: '/principles' },
] as const;

export function DemoGuide() {
  return (
    // ★ 기본은 «접힘». 펼친 채로 두면 토글과 합쳐 238px — 390px 화면의 3분의 1을 상시 차지하고,
    //   본문 앵커(scroll-mt-40 = 160px)보다 커져서 카드 제목이 헤더 뒤로 들어간다.
    <details className="border-b border-border bg-background px-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-xs font-semibold">
        3분 심사용 동선
        <span className="ml-2 font-normal text-muted-foreground">6단계 · 펼치기</span>
      </summary>
      <ol className="mt-2 grid grid-cols-3 gap-1" aria-label="3분 심사용 데모 순서">
        {STEPS.map((step, i) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex min-h-12 flex-col rounded-md border border-border px-1.5 py-1.5 text-[10px] leading-tight text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              <span className="font-mono text-primary">{i + 1}</span>
              <span>{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-1.5 pb-3 text-[10px] leading-relaxed text-muted-foreground">
        1~2는 평일, 3~4는 위 토글을 주말로. 5·6은 요일과 무관합니다. 6은 전역 후에도 남는 기록입니다.
      </p>
    </details>
  );
}

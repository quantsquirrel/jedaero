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
    // ★ 기본은 «접힘». 펼친 채로 두면 요일 배너와 합쳐 390px 화면의 절반을 차지하고,
    //   펼친 채로 두면 평일 첫 화면에서 요일 배너와 본문 사이를 갈라놓는다.
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
              className="flex min-h-12 flex-col rounded-md border border-border px-2 py-2 text-xs leading-tight text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
            >
              <span className="font-mono text-faint">{i + 1}</span>
              <span>{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        1~2는 평일, 3~4는 위 토글을 주말로. 5·6은 요일과 무관합니다. 6은 전역 후에도 남는 기록입니다.
      </p>
      <Link
        href="/onboarding"
        className="mb-2 inline-flex h-11 items-center text-xs text-muted-foreground underline"
      >
        시작하기(온보딩) 화면도 볼 수 있습니다
      </Link>
    </details>
  );
}

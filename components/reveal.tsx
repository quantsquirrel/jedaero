'use client';
// 스크롤 진입 시 1회 등장. prefers-reduced-motion이면 즉시 표시하고 애니메이션하지 않는다.
//
// ★ 서버가 내보내는 HTML은 «보이는» 상태여야 한다.
//   예전 구현은 opacity-0으로 SSR돼서, JS가 안 돌면(하이드레이션 실패·스크립트 차단·확장 간섭)
//   랜딩 전체와 진입 버튼 두 개가 통째로 사라졌다. 배포 URL 미접근이 곧 결격인 대회라
//   「JS가 돌아야 보인다」를 기본값으로 둘 수 없다.
//
//   그래서 숨기는 일은 클라이언트가 «페인트 전»에만 한다 (useLayoutEffect).
//   - JS 없음      → 계속 보인다
//   - 첫 화면 안   → 그대로 보인다 (숨겼다 켜지 않으므로 깜빡임이 없다)
//   - 첫 화면 아래 → 페인트 전에 숨기고, 스크롤로 들어올 때 페이드인
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// 서버 렌더에서 useLayoutEffect는 경고를 낸다. 서버에서는 실행되지 않으므로 useEffect로 바꿔 둔다.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // null = 아직 판단 전(= 보이는 상태). true/false = 클라이언트가 정한 표시 여부.
  const [shown, setShown] = useState<boolean | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }
    // 이미 화면 안이면 숨기지 않는다. 숨겼다 켜면 첫 페인트가 한 번 깜빡인다.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setShown(true);
      return;
    }
    setShown(false);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      // ★ 양수 마진 — 뷰포트에 «닿기 전»에 페이드를 시작한다.
      //   음수(-12%)로 늦게 걸면 빠르게 스크롤할 때 빈 화면이 한 박자 스친다.
      { rootMargin: '0px 0px 15% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        shown === false ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100',
        className,
      )}
    >
      {children}
    </div>
  );
}

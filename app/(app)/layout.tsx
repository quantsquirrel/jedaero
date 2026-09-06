import { BottomNav } from '@/components/bottom-nav';
import { DemoToggle } from '@/components/demo-toggle';
import { DemoGuide } from '@/components/demo-guide';
import { DesktopSurround } from '@/components/desktop-surround';
import { isDemoSession, currentDayType } from '@/lib/day-context';

// 앱 영역 공통 레이아웃 — 데모 세션이면 화면 최상단에 요일 상태 배너 (SPEC §7)
// 앱 화면은 모바일 폭으로 가둔다. 랜딩(app/page.tsx)은 전폭이므로 여기서만 제한한다.
// ★ max-w-md를 데스크톱 2단으로 «바꾸지 않는다» (docs/DESIGN-RULES.md §8).
//   대신 §12-4가 처방한 대로 좌우가 «버려진 검정»이 아니라 설계된 표면으로 읽히게 한다.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = await isDemoSession();
  const mode = await currentDayType();
  return (
    <>
      <DesktopSurround />
      {/* 기둥은 주변부보다 «한 단 밝다». 밝기가 곧 「여기가 읽는 자리」다. */}
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background md:ring-1 md:ring-border">
        {demo ? (
          <>
            <DemoToggle mode={mode} />
            <DemoGuide />
          </>
        ) : null}
        <div className="flex-1 pb-28">{children}</div>
        <BottomNav />
      </div>
    </>
  );
}

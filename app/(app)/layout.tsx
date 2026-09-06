import { BottomNav } from '@/components/bottom-nav';
import { DemoToggle } from '@/components/demo-toggle';
import { DemoGuide } from '@/components/demo-guide';
import { currentDayType, isDemoSession } from '@/lib/day-context';

// 앱 영역 공통 레이아웃 — 데모 세션이면 화면 최상단에 요일 전환 토글 고정 (SPEC §7)
// 앱 화면은 모바일 폭으로 가둔다. 랜딩(app/page.tsx)은 전폭이므로 여기서만 제한한다.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = await isDemoSession();
  const mode = await currentDayType();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-border/40">
      {/* ★ sticky 래퍼에 배경을 반드시 칠한다. 없으면 DemoToggle(bg-primary/10)과
          DemoGuide(bg-background/95)가 반투명이라 본문이 그대로 비쳐 글자가 겹쳐 읽힌다 —
          데모 세션 내내, 모든 앱 화면에서. */}
      {demo ? (
        <div className="sticky top-0 z-50 bg-background">
          <DemoToggle mode={mode} />
          <DemoGuide />
        </div>
      ) : null}
      <div className="flex-1 pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}

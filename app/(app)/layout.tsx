import { BottomNav } from '@/components/bottom-nav';
import { DemoToggle } from '@/components/demo-toggle';
import { currentDayType, isDemoSession } from '@/lib/day-context';

// 앱 영역 공통 레이아웃 — 데모 세션이면 화면 최상단에 요일 전환 토글 고정 (SPEC §7)
// 앱 화면은 모바일 폭으로 가둔다. 랜딩(app/page.tsx)은 전폭이므로 여기서만 제한한다.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = await isDemoSession();
  const mode = await currentDayType();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col border-x border-border/40">
      {demo ? (
        <div className="sticky top-0 z-50">
          <DemoToggle mode={mode} />
        </div>
      ) : null}
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}

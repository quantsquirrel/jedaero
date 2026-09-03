import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { kstToday } from '@/lib/day-type';
import { templateStats } from '@/lib/portfolio/templates';
import { getSessionUser } from '@/lib/session';

// S2 온보딩 — 계급·군종·복무기간·거리 입력 → 시드 지급 → 예시 포트폴리오 선택
export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (user) redirect('/home');

  const stats = templateStats(kstToday());
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-8">
      <div>
        <h1 className="text-2xl font-bold">시작하기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          1분이면 끝납니다. 회원가입은 없습니다.
        </p>
      </div>
      <OnboardingForm stats={stats} />
    </main>
  );
}

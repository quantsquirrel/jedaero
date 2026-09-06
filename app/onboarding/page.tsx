import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding-form';
import { kstToday } from '@/lib/day-type';
import { operationStats } from '@/lib/portfolio/operations';
import { getSessionUser } from '@/lib/session';

// S2 온보딩 — 계급·군종·복무기간·거리 입력 → 시드 지급 → 예시 포트폴리오 선택
// ★ 데모 세션은 보내지 않는다. /demo 뒤에 「시작하기」가 홈으로만 빨려가면
//   심사자가 온보딩 폼을 영영 못 본다. 제출하면 새 훈련이 시작되고 체험 편성은 닫힌다.
export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (user && !user.isDemo) redirect('/home');
  const demoPreview = user?.isDemo === true;

  const stats = operationStats(kstToday());
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-8">
      <div>
        <h1 className="text-2xl font-bold">시작하기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          1분이면 끝납니다. 회원가입은 없습니다.
        </p>
      </div>
      {demoPreview ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-3 text-sm leading-relaxed text-muted-foreground">
          체험 세션입니다. 이 화면은 시작하기 흐름입니다. 제출하면 새 훈련이 시작되고 체험
          편성은 닫힙니다.{' '}
          <Link href="/home" className="inline-flex h-11 items-center font-medium text-foreground underline">
            체험으로 돌아가기
          </Link>
        </p>
      ) : null}
      <OnboardingForm stats={stats} />
    </main>
  );
}

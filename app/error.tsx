'use client';
// 라우트 세그먼트 오류 경계 — 서버 컴포넌트·데이터 로딩이 실패했을 때 심사자가 보는 화면.
// ★ 스택트레이스·에러 메시지 원문을 화면에 내지 않는다 (CLAUDE.md «에러 페이지에 스택트레이스 노출 금지»).
//   digest 는 Next가 만든 짧은 식별자라 원문을 담지 않는다. 문의 시 참조용으로만 띄운다.
// 빈 화면으로 끝내지 않는다 — 무엇이 막혔고 다음에 무엇을 누를지 한 화면에 적는다.
import Link from 'next/link';
import { useEffect } from 'react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 서버 로그로만 남긴다. 클라이언트 콘솔에는 메시지 원문이 이미 없다(프로덕션에서 Next가 가린다).
    console.error('[route-error]', error.digest ?? 'no-digest');
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12 text-foreground">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          화면을 불러오지 못했습니다
        </p>
        <h1 className="text-2xl font-bold tracking-tight">잠시 연결이 끊겼습니다</h1>
        <p className="break-keep text-sm leading-relaxed text-muted-foreground">
          데이터 저장소와의 연결이 잠깐 흔들렸을 수 있습니다. 이 서비스는 교육용 모의 훈련이라
          실제 거래·주문·결제가 일어나지 않으며, 지금 오류로 잃는 것은 없습니다.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          다시 시도
        </button>
        <Link
          href="/demo?new=1"
          className="flex h-12 items-center justify-center rounded-xl border border-input text-sm font-semibold text-foreground transition-colors hover:border-muted-foreground/60 hover:bg-card"
        >
          데모로 다시 들어가기
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-xl text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          처음 화면으로
        </Link>
      </div>

      <p className="text-[11px] leading-relaxed text-faint/70">
        같은 화면이 계속 나오면 잠시 뒤 다시 열어 주세요.
        {error.digest ? (
          <>
            {' '}
            참조 코드 <span className="font-mono">{error.digest}</span>
          </>
        ) : null}
      </p>
    </main>
  );
}

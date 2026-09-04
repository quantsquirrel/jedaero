import Link from 'next/link';

// /demo 진입이 실패했을 때 오는 안내 화면 (app/demo/route.ts 의 catch 경로).
// route handler 는 error.tsx 경계 밖이라, 여기가 없으면 심사자는 Next 기본 500 을 본다.
// 이 페이지는 DB·세션을 건드리지 않는다 — 저장소가 죽어 있어도 반드시 열려야 한다.
export const dynamic = 'force-static';

export default function DemoUnavailablePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12 text-foreground">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          데모 진입 실패
        </p>
        <h1 className="text-2xl font-bold tracking-tight">체험 세션을 만들지 못했습니다</h1>
        <p className="break-keep text-sm leading-relaxed text-muted-foreground">
          데모는 들어올 때마다 12주치 편성 이력을 새로 만듭니다. 그 저장이 잠시 실패했습니다.
          대개 몇 초 뒤 다시 누르면 들어가집니다.
        </p>
        <p className="break-keep text-sm leading-relaxed text-muted-foreground">
          이 서비스는 교육용 모의 훈련이며 실제 거래·주문·결제가 일어나지 않습니다.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/demo"
          className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          데모 다시 시도
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-xl border border-input text-sm font-semibold text-foreground transition-colors hover:border-muted-foreground/60 hover:bg-card"
        >
          처음 화면으로
        </Link>
      </div>
      <p className="text-[11px] leading-relaxed text-faint/70">
        같은 화면이 반복되면 잠시 뒤 다시 열어 주세요. 서비스 설명은 처음 화면에서 가입 없이 읽을 수
        있습니다.
      </p>
    </main>
  );
}

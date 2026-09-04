import Link from 'next/link';

// 404 — 없는 주소를 열었을 때. Vercel·Next 기본 404 대신 다음 클릭을 안내한다.
// 심사자가 주소를 잘못 치거나 옛 링크(/expenses, /budget 등)를 열어도 여기서 돌아온다.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12 text-zinc-100">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/80">404</p>
        <h1 className="text-2xl font-bold tracking-tight">이 주소에는 화면이 없습니다</h1>
        <p className="break-keep text-sm leading-relaxed text-zinc-400">
          제대로는 홈 · 포트폴리오 · 지수 · 학습이 하단 메뉴입니다. 그룹은 홈과 지수에서 엽니다.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/demo"
          className="flex h-12 items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
        >
          3분 심사 데모 시작
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
        >
          처음 화면으로
        </Link>
      </div>
    </main>
  );
}

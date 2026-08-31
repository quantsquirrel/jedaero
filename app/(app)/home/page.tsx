import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEED_AMOUNT } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { won } from '@/lib/format';
import { getSessionUser } from '@/lib/session';

// S3 홈 — 전역 D-Day, 오늘 할 일. ★ 수익률은 여기 두지 않는다 (SPEC §6)
export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const dt = await currentDayType();
  const today = kstToday();
  const dday = Math.ceil(
    (new Date(`${user.dischargeAt}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) /
      86_400_000,
  );

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{user.nickname}님</p>
          <h1 className="text-3xl font-bold tracking-tight">전역 D-{Math.max(0, dday)}</h1>
        </div>
        <Badge variant="outline">{dt === 'WEEKEND' ? '주말·휴일' : '평일'}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">모의 시드 {won(SEED_AMOUNT)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          장병내일준비적금 18개월 만기 수령액 기준, 전원 동일 금액입니다.{' '}
          <span className="text-xs">(규칙 기반 산정 · AI 아님)</span> 실제 거래는 일어나지 않습니다.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 할 수 있는 일</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          {dt === 'WEEKEND' ? (
            <p>
              주말입니다. <b className="text-foreground">수익률 확인과 비중 조정</b>이 열려
              있습니다. 마감은 일요일 21:00.
            </p>
          ) : (
            <p>
              평일입니다. 지출 기록과 학습은 언제나 가능합니다.{' '}
              <b className="text-foreground">수익률은 주말에 한 번에</b> 확인합니다.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/portfolio"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="text-2xl">📊</span>
          <span className="font-semibold">포트폴리오</span>
          <span className="text-xs text-muted-foreground">테마 6축 비중</span>
        </Link>
        <Link
          href="/expenses"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="text-2xl">🧾</span>
          <span className="font-semibold">가계부</span>
          <span className="text-xs text-muted-foreground">지출 기록·AI 분류</span>
        </Link>
      </div>
    </main>
  );
}

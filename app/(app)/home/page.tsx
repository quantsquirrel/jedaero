import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEED_AMOUNT } from '@/lib/constants';
import { currentDayType } from '@/lib/day-context';
import { kstToday } from '@/lib/day-type';
import { won } from '@/lib/format';
import { grantHoldIfEligible, totalXpAndBadges, weeklyQuests } from '@/lib/quests';
import { getSessionUser } from '@/lib/session';
import { cn } from '@/lib/utils';

const BADGE_LABEL: Record<string, string> = { REFLECT: '🪞 돌아봄', PATIENT: '🧘 진득함' };

// S3 홈 — 전역 D-Day, 이번 주 퀘스트, XP·배지. ★ 수익률은 여기 두지 않는다 (SPEC §6)
export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  // 지난주에 비중을 바꾸지 않았다면 HOLD 퀘스트를 lazy 지급 (크론 없음)
  await grantHoldIfEligible(user.id);

  const dt = await currentDayType();
  const today = kstToday();
  const dday = Math.ceil(
    (new Date(`${user.dischargeAt}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) /
      86_400_000,
  );
  const quests = await weeklyQuests(user.id);
  const { xp, badges } = await totalXpAndBadges(user.id);

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{user.nickname}님</p>
          <h1 className="text-3xl font-bold tracking-tight">전역 D-{Math.max(0, dday)}</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline">{dt === 'WEEKEND' ? '주말·휴일' : '평일'}</Badge>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{xp} XP</span>
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="flex gap-1.5">
          {badges.map((b) => (
            <Badge key={b} variant="outline">
              {BADGE_LABEL[b] ?? b}
            </Badge>
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">모의 시드 {won(SEED_AMOUNT)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          장병내일준비적금 18개월 만기 수령액 기준, 전원 동일 금액입니다.{' '}
          <span className="text-xs">(규칙 기반 산정 · AI 아님)</span>{' '}
          <Link href="/learn#card-seed" className="underline">
            만기액은 어떻게 나오나 →
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">이번 주 퀘스트</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {quests.map((q) => (
            <div key={q.code} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className={cn('font-medium', q.completed && 'text-emerald-400')}>
                  {q.completed ? '✓ ' : ''}
                  {q.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{q.description}</p>
              </div>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {q.progress}/{q.target} · {q.xp}XP
              </span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            보상은 경험치와 배지까지입니다. 「그대로 두기」는 아무것도 하지 않은 한 주에 대한
            보상입니다 — 장기투자에서는 그것이 정답인 주가 많습니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 할 수 있는 일</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {dt === 'WEEKEND' ? (
            <p>
              주말입니다. <b className="text-foreground">수익률 확인·비중 조정·리그·성향 분석</b>이
              열려 있습니다. 마감은 일요일 21:00.
            </p>
          ) : (
            <p>
              평일입니다. 지출 기록·학습·퀘스트는 언제나 가능합니다.{' '}
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
        <Link
          href="/budget"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="text-2xl">✉️</span>
          <span className="font-semibold">예산 봉투</span>
          <span className="text-xs text-muted-foreground">월초 배정·잠금</span>
        </Link>
        <Link
          href="/league"
          className="flex flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:border-muted-foreground/40"
        >
          <span className="text-2xl">🏅</span>
          <span className="font-semibold">리그</span>
          <span className="text-xs text-muted-foreground">동기 코호트·그룹</span>
        </Link>
      </div>
    </main>
  );
}

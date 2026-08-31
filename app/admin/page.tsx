import { desc, gt, sql } from 'drizzle-orm';
import { AdminLoginForm, KillSwitch } from '@/components/admin-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { aiCalls } from '@/db/schema';
import { isAdminAuthed } from '@/lib/admin';
import { isAiEnabled } from '@/lib/ai/guard';

export const dynamic = 'force-dynamic';

// S11 관리자 — 킬스위치, AI 호출 로그, rate limit 현황. ADMIN_PASSWORD 단순 비교
export default async function AdminPage() {
  const authed = await isAdminAuthed();

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 py-10">
        <h1 className="text-2xl font-bold">관리자</h1>
        <AdminLoginForm />
      </main>
    );
  }

  const enabled = await isAiEnabled();
  const recentCalls = await db.select().from(aiCalls).orderBy(desc(aiCalls.createdAt)).limit(50);
  const rateRows = await db
    .select({
      userId: aiCalls.userId,
      calls: sql<number>`count(*)`,
      blocked: sql<number>`count(*) filter (where ${aiCalls.blocked})`,
    })
    .from(aiCalls)
    .where(gt(aiCalls.createdAt, sql`now() - interval '1 hour'`))
    .groupBy(aiCalls.userId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 py-10">
      <h1 className="text-2xl font-bold">관리자</h1>

      <KillSwitch enabled={enabled} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate limit 현황 (최근 1시간, 상위 10)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-xs">
          {rateRows.length === 0 ? <p className="text-muted-foreground">호출 없음</p> : null}
          {rateRows.map((r) => (
            <div key={r.userId} className="flex justify-between font-mono tabular-nums">
              <span>{r.userId.slice(0, 8)}…</span>
              <span>
                {r.calls}회 (차단 {r.blocked})
              </span>
            </div>
          ))}
          <p className="pt-1 text-muted-foreground">한도: 분당 5회 · 일 50회. 초과 시 429</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI 호출 로그 (최근 50)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-xs">
          {recentCalls.map((c) => (
            <div key={c.id} className="flex justify-between font-mono tabular-nums">
              <span>
                {c.kind} {c.blocked ? '· 차단' : ''}
              </span>
              <span className="text-muted-foreground">
                {c.createdAt.toISOString().slice(5, 16).replace('T', ' ')}
              </span>
            </div>
          ))}
          {recentCalls.length === 0 ? <p className="text-muted-foreground">기록 없음</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}

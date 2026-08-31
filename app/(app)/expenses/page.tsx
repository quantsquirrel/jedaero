import { redirect } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { ExpenseForm } from '@/components/expense-form';
import { ExpenseList, type ExpenseItem } from '@/components/expense-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { exemptionClaims, expenses } from '@/db/schema';
import { isAiEnabled } from '@/lib/ai/guard';
import { TRANSPORT_CAP, type HomeDistance } from '@/lib/constants';
import { kstToday } from '@/lib/day-type';
import { won } from '@/lib/format';
import { getSessionUser } from '@/lib/session';

// S5 가계부 — 지출 기록·AI 분류 제안·사용자 확정·면제 내역. 평일에도 언제나 동작한다.
export default async function ExpensesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, user.id))
    .orderBy(desc(expenses.occurredOn))
    .limit(60);

  const items: ExpenseItem[] = rows.map((r) => ({
    id: r.id,
    occurredOn: r.occurredOn,
    amount: r.amount,
    memo: r.memo,
    tier: r.tier,
    aiSuggestedTier: r.aiSuggestedTier,
    aiConfidence: r.aiConfidence,
    confirmedByUser: r.confirmedByUser,
  }));

  const aiEnabled = await isAiEnabled();

  const today = kstToday();
  const quarter = `${today.slice(0, 4)}-${Math.ceil(Number(today.slice(5, 7)) / 3)}`;
  const claims = await db
    .select()
    .from(exemptionClaims)
    .where(and(eq(exemptionClaims.userId, user.id), eq(exemptionClaims.yearQuarter, quarter)))
    .orderBy(desc(exemptionClaims.capApplied))
    .limit(20);
  const cap = TRANSPORT_CAP[user.homeDistance as HomeDistance] ?? TRANSPORT_CAP.MID;

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">가계부</h1>

      {!aiEnabled ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          AI 기능이 일시 중지되어 분류 제안이 규칙 기반으로 동작합니다 (생성형 AI 아님).
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">지출 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm today={today} />
        </CardContent>
      </Card>

      <ExpenseList items={items} aiEnabled={aiEnabled} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">A계층 면제 내역 ({quarter}분기)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="text-xs text-muted-foreground">
            휴가·외박 교통비는 거리 구간 기준 왕복 {won(cap)}까지 자동으로 면제 인정됩니다. 출신
            지역이 순위를 가르지 않게 하는 장치입니다.
          </p>
          {claims.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              이번 분기 면제 내역이 없습니다. 교통비 지출을 A로 확정하면 자동 기록됩니다.
            </p>
          ) : (
            claims.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs">{c.reason ?? c.type}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {won(c.amount)} 중 {won(c.capApplied)} 면제
                  {c.amount > c.capApplied ? ' · 초과분은 B로' : ''}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        분류 축은 &ldquo;필수 vs 사치&rdquo;가 아니라 &ldquo;통제 가능 vs 불가&rdquo;입니다. A
        구조적(교통·의료), B 계획(통신·생필품), C 재량(간식·배달). AI 제안이 확신이 없으면
        분류하지 않고 여러분에게 묻습니다.
      </p>
    </main>
  );
}

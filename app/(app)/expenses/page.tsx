import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { ExpenseForm } from '@/components/expense-form';
import { ExpenseList, type ExpenseItem } from '@/components/expense-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { kstToday } from '@/lib/day-type';
import { getSessionUser } from '@/lib/session';

// S5 가계부 — 지출 기록·AI 분류 제안·사용자 확정. 평일에도 언제나 동작한다.
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

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">가계부</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">지출 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm today={kstToday()} />
        </CardContent>
      </Card>

      <ExpenseList items={items} />

      <p className="text-xs leading-relaxed text-muted-foreground">
        분류 축은 &ldquo;필수 vs 사치&rdquo;가 아니라 &ldquo;통제 가능 vs 불가&rdquo;입니다. A
        구조적(교통·의료), B 계획(통신·생필품), C 재량(간식·배달). AI 제안이 확신이 없으면
        분류하지 않고 여러분에게 묻습니다.
      </p>
    </main>
  );
}

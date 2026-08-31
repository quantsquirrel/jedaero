import { redirect } from 'next/navigation';
import { LearnCardsView } from '@/components/learn-cards-view';
import { ReviewForm } from '@/components/review-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LEARN_CARDS } from '@/lib/learn-cards';
import { getSessionUser } from '@/lib/session';

// S8 학습·회고 — 5단계 학습 카드는 기능과 1:1 페어링, 각 기능 화면에서 이리로 진입한다
export default async function LearnPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  return (
    <main className="flex flex-col gap-4 px-5 py-8">
      <h1 className="text-2xl font-bold">학습</h1>
      <p className="text-sm text-muted-foreground">
        다섯 카드는 각각 이 서비스의 한 기능과 짝을 이룹니다. 기능을 쓰다 궁금해진 순간이 가장
        좋은 읽을 때입니다.
      </p>
      <LearnCardsView cards={[...LEARN_CARDS]} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">주말 회고</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm />
        </CardContent>
      </Card>
    </main>
  );
}

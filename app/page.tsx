import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// S1 랜딩 — 서비스 소개 + [데모 체험하기]
export default function LandingPage() {
  return (
    <main className="flex flex-col gap-6 px-5 py-10">
      <div className="flex flex-col items-start gap-3">
        <Badge variant="outline">교육용 모의 서비스 · 실제 거래 없음</Badge>
        <h1 className="text-4xl font-bold tracking-tight">제대로</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          전역할 때 실제로 받게 될 <span className="font-semibold text-foreground">2,020만원</span>을,
          복무 중에 미리 굴려보는 모의투자 훈련.
        </p>
      </div>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">결정은 미리 하고, 중간에 바꾸지 않는다</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          포트폴리오는 주말에 정하고 주중에 바꾸지 않습니다. 예산 봉투는 월초에 정하고 그 달에
          바꾸지 않습니다. 장중에 시세를 볼 수 없는 복무 환경은 약점이 아니라, 장기투자 훈련에 가장
          좋은 조건입니다.
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주말에만 조정</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            비중 조정은 주 1회, 일요일 21:00 마감. 평일에는 수익률을 가리고 기다립니다. 장중에 보지
            않는 훈련입니다. 주말에 한 번에 보세요.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">모의 시드 2,020만원</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            장병내일준비적금 18개월 만기 수령액과 같은 금액으로, 전원이 같은 조건에서 시작합니다.
            수량과 주문이 아니라 테마 6축의 비중만 다룹니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI는 보조까지만</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            지출 분류를 제안하고, 배분에 대해 사실만 서술합니다. 확정은 언제나 본인이 합니다. 보상은
            경험치와 배지까지 — 현금성 보상은 없습니다.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Link href="/demo" className={cn(buttonVariants({ size: 'lg' }), 'h-12 text-base')}>
          데모 체험하기
        </Link>
        <Link
          href="/onboarding"
          className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'h-12 text-base')}
        >
          시작하기
        </Link>
      </div>

      <p className="pt-4 text-xs leading-relaxed text-muted-foreground">
        본 서비스의 시세는 교육용 모의 데이터입니다. 실제 금융거래·주문·결제가 일어나지 않으며,
        투자 판단을 확정하지 않습니다. 2026 금융 AI Challenge 출품작.
      </p>
    </main>
  );
}

'use client';
// 온보딩 (S2) — 빈 화면에서 시작하지 않는다. 예시 포트폴리오 4종 중 하나를 고르고 시작한다.
// "추천"이 아니라 "예시"다 (C10). FOCUS는 의도적으로 위험한 예시 — 고르는 순간 MDD를 크게 표시.
import { useActionState, useState } from 'react';
import { completeOnboarding, type OnboardingState } from '@/app/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SALARY_2026, SEED_AMOUNT, THEMES, type Rank } from '@/lib/constants';
import { pct, won } from '@/lib/format';
import type { TemplateStat } from '@/lib/portfolio/templates';
import { cn } from '@/lib/utils';

const RANKS: { value: Rank; label: string }[] = [
  { value: 'PRIVATE', label: '이병' },
  { value: 'PFC', label: '일병' },
  { value: 'CORPORAL', label: '상병' },
  { value: 'SERGEANT', label: '병장' },
];
const BRANCHES = [
  { value: 'ARMY', label: '육군' },
  { value: 'NAVY', label: '해군' },
  { value: 'AIRFORCE', label: '공군' },
  { value: 'MARINE', label: '해병대' },
];
const DISTANCES = [
  { value: 'NEAR', label: '가까움 (수도권·인접)' },
  { value: 'MID', label: '중간' },
  { value: 'FAR', label: '멂 (타 지역)' },
  { value: 'ISLAND', label: '도서 지역' },
];

export function OnboardingForm({ stats }: { stats: TemplateStat[] }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );
  const [rank, setRank] = useState<Rank>('CORPORAL');
  const [templateId, setTemplateId] = useState<string>('GLOBAL');

  const selectClass =
    'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">기본 정보</h2>
        <p className="text-xs text-muted-foreground">
          실명·주소를 입력하지 마세요. 별명, 계급, 날짜, 거리 구간만 저장합니다.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nickname">별명 (실명 금지)</Label>
          <Input id="nickname" name="nickname" maxLength={12} placeholder="예: 해뜰날" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rank">계급</Label>
            <select
              id="rank"
              name="rank"
              className={selectClass}
              value={rank}
              onChange={(e) => setRank(e.target.value as Rank)}
            >
              {RANKS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch">군종</Label>
            <select id="branch" name="branch" className={selectClass} defaultValue="ARMY">
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          월 봉급 <b>{won(SALARY_2026[rank])}</b>{' '}
          <span className="text-xs text-muted-foreground">· 규칙 기반 자동 계산 (AI 아님)</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="enlistedAt">입대일</Label>
            <Input id="enlistedAt" name="enlistedAt" type="date" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dischargeAt">전역 예정일</Label>
            <Input id="dischargeAt" name="dischargeAt" type="date" required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="homeDistance">집까지 거리 (교통비 면제 상한 산정용)</Label>
          <select id="homeDistance" name="homeDistance" className={selectClass} defaultValue="MID">
            {DISTANCES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">시작 배분 고르기</h2>
        <p className="text-sm text-muted-foreground">
          모의 시드 <b className="text-foreground">{won(SEED_AMOUNT)}</b>으로 시작합니다. 아래는
          추천이 아니라 <b className="text-foreground">예시</b>입니다 — 고른 뒤 언제든 주말에 조정할
          수 있습니다. 수치는 최근 1년 모의 시세 기준입니다.
        </p>
        <input type="hidden" name="templateId" value={templateId} />
        <div className="flex flex-col gap-2.5">
          {stats.map((t) => {
            const selected = templateId === t.id;
            const risky = t.id === 'FOCUS';
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-colors',
                  selected ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.name}</span>
                  <span className="font-mono text-sm tabular-nums">누적 {pct(t.cumulativeReturn)}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                <p className={cn('text-xs', risky && 'text-base font-bold text-red-400')}>
                  최대낙폭(MDD) {pct(t.mdd)}
                  {risky ? ' — 빠질 때는 이만큼 빠졌습니다' : ''}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {THEMES.filter((th) => t.weights[th.code] > 0)
                    .map((th) => `${th.name} ${t.weights[th.code]}%`)
                    .join(' · ')}
                </p>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason">이 배분을 고른 이유 한 줄 (선택)</Label>
          <Input id="reason" name="reason" maxLength={60} placeholder="예: 미국 지수가 꾸준해 보여서" />
        </div>
      </section>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? '시작 준비 중…' : `${won(SEED_AMOUNT)} 받고 시작하기`}
      </Button>
    </form>
  );
}

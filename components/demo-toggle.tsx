'use client';
// 요일 상태 배너 — 심사자가 평일에 접속해도 주말 기능을 볼 수 있게 한다 (SPEC §7)
// docs/DESIGN-DECISIONS.md §0: 「요일 토글은 편의 기능이 아니라 결격 방지 장치다.」
//
// ★ 두 단(tier)으로 선다. `/demo`가 항상 `/home`으로 보내므로 «도착 화면은 /home 하나»다.
//   거기서는 화면에서 가장 큰 객체로 서서 심사자가 놓칠 수 없게 하고,
//   나머지 화면에서는 «참조 한 줄»로 물러난다 — 매 화면 두 번째 제목이 되면
//   그 화면의 주제(데이터·점수·편성)가 항상 두 번째로 읽힌다.
//   두 단 모두 같은 컨트롤·같은 44px·같은 aria-pressed를 갖는다. 지우지 않는다.
//
// ★ 선택은 «표면 한 단»으로 말한다. 신호색(amber)은 화면의 행동 하나에 남긴다
//   — 활성 알약을 amber로 칠하면 「지금 상태」가 「지금 누를 것」과 같은 색이 되고,
//   docs/DESIGN-RULES.md §1이 「현재 위치에 amber를 쓰지 말라」고 적은 실패가 그대로 일어난다.
// ★ 닫힌 쪽도 살아 있는 컨트롤이다. 대비만 내리고 크기·여백은 그대로 둔다 —
//   기하가 흔들리면 「고장」으로 읽힌다.
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { setDemoDay } from '@/app/actions/demo';
import { cn } from '@/lib/utils';

const OPENS = {
  WEEKEND: '편성 조정 · 이번 주 변동 · 제대로 지수 비교',
  WEEKDAY: '전선 등락 · 오늘의 지형 요약 · 명령하달 초안',
} as const;

export function DemoToggle({ mode }: { mode: 'WEEKDAY' | 'WEEKEND' }) {
  const router = useRouter();
  const pathname = usePathname();
  // 도착 화면(/home)에서만 전체 단. 나머지는 축약 단.
  const full = pathname === '/home';
  const [pending, startTransition] = useTransition();
  const [shownMode, setShownMode] = useState(mode);
  const [error, setError] = useState('');
  useEffect(() => setShownMode(mode), [mode]);
  const other = shownMode === 'WEEKDAY' ? 'WEEKEND' : 'WEEKDAY';

  // ★ 누른 «순간» 상태가 바뀐다. 서버 왕복이 끝날 때까지 아무 반응이 없으면
  //   심사자는 눌리지 않은 줄 알고 한 번 더 누른다 — 결격 방지 장치에서 가장 나쁜 실패다.
  // ★ 실패해도 선택 상태를 되돌리지 않는다. 사실 문구만 같은 자리에 붙인다.
  const switchTo = (target: 'WEEKDAY' | 'WEEKEND') => {
    setError('');
    setShownMode(target);
    startTransition(async () => {
      const result = await setDemoDay(target);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShownMode(result.mode);
      router.refresh();
    });
  };

  const btn = (target: 'WEEKDAY' | 'WEEKEND', label: string) => {
    const on = shownMode === target;
    return (
      <button
        type="button"
        // 안정적인 의미 로케이터 — 심사 동선의 결격 방지 장치라 프로브가 이 값을 짚는다
        data-day={target}
        disabled={pending}
        onClick={() => switchTo(target)}
        aria-pressed={on}
        // ★ 44px 하한. SPEC §7이 「토글 없이 주말 기능을 못 보면 결격에 준한다」고 쓴,
        //   심사 동선에서 가장 많이 눌리는 컨트롤이다. 축약 단에서도 깎지 않는다.
        className={cn(
          'min-h-11 rounded-md text-sm transition-colors',
          'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          full ? 'flex-1 px-4' : 'min-w-11 px-3',
          on
            ? // 들린 표면 한 단 — 색이 아니라 밝기가 「여기 있다」를 말한다
              'bg-secondary font-semibold text-foreground ring-1 ring-border'
            : // 닫힌 쪽 — 만질 수 있으므로 경계는 또렷하게, 글자만 물러난다 (§1)
              'border border-input font-medium text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
      </button>
    );
  };

  // 상태 한 줄 — 눈으로도 스크린리더로도 «같은 순간»에 도달한다.
  // 비어 있어도 자리를 지켜 화면이 튀지 않는다.
  const status = (
    <p
      aria-live="polite"
      role={error ? 'alert' : undefined}
      className={cn(
        full ? 'min-h-5 text-sm' : 'min-h-4 text-xs',
        error ? 'text-destructive' : 'text-faint',
      )}
    >
      {error || (pending ? '화면을 다시 그리는 중입니다.' : '')}
    </p>
  );

  const controls = (
    <div data-region="day-mode" className="flex gap-2" role="group" aria-label="요일 전환">
      {btn('WEEKDAY', '평일')}
      {btn('WEEKEND', '주말')}
    </div>
  );

  // ── 축약 단 — /home 이외의 모든 화면.
  // 제목이 아니라 «참조 한 줄»이다. 같은 문장·같은 h2·같은 컨트롤을 유지하되
  // 활자 단을 본문(text-sm)으로 내려 그 화면의 주제와 경쟁하지 않게 한다.
  if (!full) {
    return (
      <section
        data-region="day-state"
        aria-label="데모 요일 상태"
        className="flex flex-col gap-1 border-b border-border bg-card px-5 py-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 text-sm font-semibold break-keep text-muted-foreground">
            지금은 {shownMode === 'WEEKDAY' ? '평일' : '주말'} 화면입니다
          </h2>
          {controls}
        </div>
        {status}
      </section>
    );
  }

  // ── 전체 단 — /home. `/demo`가 항상 여기로 보내므로 심사자는 반드시 이 화면을 지난다.
  return (
    <section
      data-region="day-state"
      aria-label="데모 요일 상태"
      className="flex flex-col gap-2.5 border-b border-border bg-card px-5 py-4"
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">데모</p>
        <h2 className="text-2xl font-bold tracking-tight break-keep">
          지금은 {shownMode === 'WEEKDAY' ? '평일' : '주말'} 화면입니다
        </h2>
      </div>

      {controls}

      {/* ★ 조사를 프로그램으로 붙이지 않는다. 「비교이(가) 열립니다」 같은 문장이 나온다.
          ★ 한국어 본문에 사이 띄운 em-dash를 쓰지 않는다. 목록은 쌍점 뒤에 그대로 둔다. */}
      <div className="flex flex-col gap-1 text-sm leading-relaxed text-muted-foreground break-keep">
        <p>
          <b className="font-semibold text-foreground">
            {other === 'WEEKEND' ? '주말' : '평일'}로 바꾸면
          </b>{' '}
          이 화면이 그 자리에서 다시 그려집니다.
        </p>
        <p>
          그때 열리는 것: <span className="text-foreground">{OPENS[other]}</span>
        </p>
      </div>

      {status}
    </section>
  );
}

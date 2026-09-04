'use client';
// 도상훈련 3장 — 학습 옆. 1차 UI에 「백테스트」라는 말을 쓰지 않는다.
// 다섯 작전 순위를 표로 만들지 않는다. 비교는 연합작전 한 장만 나란히.
import { useMemo, useState } from 'react';
import { BASELINE_OPERATION } from '@/lib/constants';
import { DRILL_SCENARIOS, type DrillScenarioId } from '@/lib/drill/scenarios';
import type { DrillResult } from '@/lib/drill/run';
import { won, pct } from '@/lib/format';
import { cn } from '@/lib/utils';

export type DrillDeckItem = {
  id: DrillScenarioId;
  mine: DrillResult;
  alliance: DrillResult;
};

function Sparkline({
  values,
  overlay,
  troughIndex,
}: {
  values: number[];
  overlay?: number[];
  troughIndex: number;
}) {
  const w = 320;
  const h = 88;
  const pad = 6;
  const all = overlay ? values.concat(overlay) : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const toPt = (arr: number[], i: number) => {
    const x = pad + (i / Math.max(arr.length - 1, 1)) * (w - pad * 2);
    const y = pad + (1 - (arr[i] - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const line = (arr: number[]) => arr.map((_, i) => toPt(arr, i)).join(' ');
  const [tx, ty] = toPt(values, Math.min(troughIndex, values.length - 1)).split(',').map(Number);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[88px] w-full" role="img" aria-label="구간 평가액 곡선">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} className="stroke-zinc-800" strokeWidth="1" />
      {overlay ? (
        <polyline
          fill="none"
          points={line(overlay)}
          className="stroke-zinc-600"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      <polyline
        fill="none"
        points={line(values)}
        className="stroke-amber-400/80"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={tx} cy={ty} r="3.5" className="fill-amber-400" />
    </svg>
  );
}

export function DrillDeck({ items, hasAllocation }: { items: DrillDeckItem[]; hasAllocation: boolean }) {
  const [active, setActive] = useState<DrillScenarioId>('crash-recover');
  const [compare, setCompare] = useState(false);
  const current = items.find((it) => it.id === active) ?? items[0];
  const scenario = DRILL_SCENARIOS.find((s) => s.id === current.id)!;
  const troughIndex = current.mine.troughTradingDays - 1;
  const allianceName = BASELINE_OPERATION.name;

  const endRet = useMemo(() => {
    const start = current.mine.values[0] || 1;
    return current.mine.endValue / start - 1;
  }, [current]);

  return (
    <section id="drill" className="scroll-mt-40">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <div className="flex flex-col gap-3 px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">도상훈련</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight">지금 편성이면, 그 지형은</h2>
            </div>
            <span className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400">
              교육용 과거 지형
            </span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            예측이 아닙니다. 지금 포인트를 과거 한 해에 그대로 넣어 본 결과입니다.
          </p>
          {!hasAllocation ? (
            <p className="text-xs leading-relaxed text-zinc-500">
              아직 편성이 없어 전액 예비대로 둡니다. 포트폴리오에서 포인트를 놓으면 이 숫자가 바뀝니다.
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-1 px-3">
          {DRILL_SCENARIOS.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  'rounded-xl px-2 py-2.5 text-center text-[12px] font-semibold leading-snug break-keep transition-colors',
                  on
                    ? 'bg-amber-400 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200',
                )}
              >
                {s.title}
              </button>
            );
          })}
        </div>

        <div className="mt-5 px-5">
          <p className="text-[11px] tabular-nums text-zinc-500">
            {scenario.fromDate} ~ {scenario.toDate}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{scenario.lesson}</p>
        </div>

        <div className="mt-5 px-5">
          <p className="text-xs text-zinc-500">구간 끝 평가액</p>
          <p className="mt-1 font-mono text-[2rem] font-bold leading-none tracking-tight text-amber-400 tabular-nums">
            {won(current.mine.endValue)}
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums text-zinc-500">{pct(endRet)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 px-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-3">
            <p className="text-[11px] text-zinc-500">가장 쪼그라든 금액</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums tracking-tight">
              {won(current.mine.troughValue)}
            </p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-zinc-500">{pct(current.mine.mdd)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-3">
            <p className="text-[11px] text-zinc-500">저점까지</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums tracking-tight">
              {current.mine.troughTradingDays}
              <span className="ml-0.5 text-sm font-medium text-zinc-500">영업일</span>
            </p>
          </div>
        </div>

        <div className="mt-4 px-5">
          <Sparkline
            values={current.mine.values}
            overlay={compare ? current.alliance.values : undefined}
            troughIndex={Math.max(0, troughIndex)}
          />
        </div>

        <div className="px-5">
          <button
            type="button"
            onClick={() => setCompare((v) => !v)}
            className={cn(
              'mt-1 w-full rounded-xl border py-2.5 text-sm font-medium transition-colors',
              compare
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                : 'border-zinc-800 text-zinc-300 hover:border-zinc-600',
            )}
          >
            {compare ? `${allianceName}과 겹쳐 보는 중` : `${allianceName}과 나란히 보기`}
          </button>
        </div>

        {compare ? (
          <div className="mt-3 grid grid-cols-2 gap-3 px-5 text-sm">
            <div>
              <p className="text-[11px] text-amber-400/80">내 편성</p>
              <p className="mt-0.5 font-mono tabular-nums">{won(current.mine.endValue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">{allianceName}</p>
              <p className="mt-0.5 font-mono tabular-nums text-zinc-400">{won(current.alliance.endValue)}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-2 border-t border-zinc-800 px-5 py-4">
          <p className="text-[13px] leading-relaxed text-zinc-500">{scenario.caption}</p>
          {scenario.caption !== scenario.sharedCaption ? (
            <p className="text-[13px] leading-relaxed text-zinc-600">{scenario.sharedCaption}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

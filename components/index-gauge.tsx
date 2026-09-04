import { INDEX_LABELS } from '@/lib/jedaero-index';
import { cn } from '@/lib/utils';

// 제대로 지수 삼축 게이지 — 칸의 «폭»이 곧 배점(40·30·30)이다.
// ★ 세 축을 같은 폭 막대 세 개로 그리면 「성과 40점 상한」이 눈에 보이지 않는다.
//   폭을 배점에 비례시켜야 한 축만 밀어서는 만점이 안 나온다는 사실이 그림으로 읽힌다.
// parts 는 INDEX_LABELS 순서 — [위험을 이긴 성과, 분산의 힘, 판단을 지킨 힘]
export function IndexGauge({ parts, className }: { parts: number[]; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex h-3 gap-1" aria-hidden>
        {INDEX_LABELS.map((row, i) => (
          <div
            key={row.key}
            className="relative overflow-hidden rounded-sm bg-muted"
            style={{ flexGrow: row.max }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-sm"
              style={{
                width: `${Math.min((parts[i] ?? 0) / row.max, 1) * 100}%`,
                background: `var(--chart-${i + 1})`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {INDEX_LABELS.map((row, i) => (
          <div key={row.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-[3px]"
                style={{ background: `var(--chart-${i + 1})` }}
                aria-hidden
              />
              <span className="text-sm">{row.label}</span>
              <span className="text-xs text-faint">{row.hint}</span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums">
              {parts[i] ?? 0}
              <span className="text-faint">/{row.max}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="font-mono text-[11px] tabular-nums text-faint">
        칸의 폭이 곧 배점입니다 — {INDEX_LABELS.map((row) => row.max).join(' · ')}
      </p>
    </div>
  );
}

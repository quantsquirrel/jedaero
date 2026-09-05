import { POINT_UNIT, TOTAL_POINTS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// 포인트 트레이 — 편성기 맨 위. 20칸 중 배치분은 채워진 칸, 예비대는 점선 빈 칸이다.
// ★ 포인트는 원래 유한하다. 유한한 것은 낱개로 보여야 «남은 것»이 선택으로 읽힌다.
//   막대 하나로 비율만 그리면 예비대가 화면에서 사라지고 방치가 된다 (DESIGN-DECISIONS §3).
export function PointTray({ placed, className }: { placed: number; className?: string }) {
  const reserve = TOTAL_POINTS - placed;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1" aria-hidden>
        {Array.from({ length: TOTAL_POINTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-6 rounded-sm',
              i < placed ? 'bg-[var(--chart-1)]' : 'border border-dashed border-input',
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-faint">
        <span>
          배치 {placed} · 예비대 {reserve}
        </span>
        <span>{placed * POINT_UNIT}% 배치됨</span>
      </div>
    </div>
  );
}

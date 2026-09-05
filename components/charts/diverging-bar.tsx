import { cn } from '@/lib/utils';

// 0을 가운데 두고 «어느 쪽으로 얼마나» 를 그린다 — 등락, 목표 대비 편차.
// ★ 색에 투명도를 걸지 않는다. bg-up/70 으로 흐리면 2형 색각 분리가 ΔE 5.7까지
//   떨어져 하한(6.0) 아래가 된다. 원색이면 7.3으로 하한을 넘긴다 (DESIGN-RULES §1).
// ★ 그래서 부호 표기가 «필수»다. 이 부품은 막대만 그리고, 부호 붙은 숫자는
//   부르는 쪽이 반드시 옆에 적는다 — 색만으로 전달하지 않는다 (§9).

export function DivergingBar({
  value,
  maxAbs,
  className,
}: {
  /** 부호 있는 값. 양수면 오른쪽, 음수면 왼쪽으로 자란다 */
  value: number;
  /** 좌우 절반을 꽉 채우는 기준 크기 */
  maxAbs: number;
  className?: string;
}) {
  const up = value >= 0;
  const width = (Math.min(Math.abs(value) / (maxAbs || 1), 1) * 100) / 2;
  return (
    <span
      className={cn('relative h-3 flex-1 overflow-hidden rounded-sm bg-muted/40', className)}
      aria-hidden
    >
      {/* 0축 — 실선 헤어라인. 점선은 「임계선」으로 읽힌다 */}
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
      {/* 데이터 끝만 둥글고 0축 쪽은 각지게. 축과 막대 사이에 2px 틈을 둔다 */}
      <span
        className={cn('absolute inset-y-0', up ? 'rounded-r-sm bg-up' : 'rounded-l-sm bg-down')}
        style={
          up
            ? { left: 'calc(50% + 2px)', width: `${width}%` }
            : { right: 'calc(50% + 2px)', width: `${width}%` }
        }
      />
    </span>
  );
}

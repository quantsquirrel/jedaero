import { cn } from '@/lib/utils';

// 나 vs 코호트 중앙값을 «같은 축»에 나란히 둔다.
// ★ 숫자 둘을 문장으로 늘어놓으면 읽는 사람이 머릿속에서 빼야 한다.
//   같은 축 위에 놓으면 차이가 그림으로 먼저 온다.
// ★ 중앙값은 등수가 아니다. 잘함/못함으로 칠하지 않는다 — 위치만 보여준다 (C3 게임화 금지).
// ★ 값은 위쪽에 «글자로도» 있어야 한다. 이 막대가 유일한 읽기 수단이면 안 된다.

export function CompareMark({
  mine,
  cohort,
  max,
  cohortLabel = '코호트 중앙값',
  className,
}: {
  mine: number;
  /** 비교 집단 중앙값. 없으면 내 표시만 그린다 */
  cohort: number | null;
  /** 축의 오른쪽 끝 */
  max: number;
  cohortLabel?: string;
  className?: string;
}) {
  const domain = Math.max(max, mine, cohort ?? 0) || 1;
  const at = (v: number) => `${Math.min(Math.max(v / domain, 0), 1) * 100}%`;

  return (
    <span
      className={cn('relative block h-3 w-full rounded-sm bg-muted/40', className)}
      role="img"
      aria-label={
        cohort === null
          ? `내 값 ${mine}`
          : `내 값 ${mine}, ${cohortLabel} ${cohort}`
      }
    >
      {/* 내 값 — 축 왼쪽부터 자란 막대 */}
      <span
        className="absolute inset-y-0 left-0 rounded-sm bg-[var(--chart-1)]"
        style={{ width: at(mine) }}
      />
      {/* 중앙값 — 기준 눈금 하나.
          ★ 막대 «안»에만 그으면 막대가 끊어진 것처럼 보인다. 위아래로 넘치게 빼야
            「가로지르는 기준선」으로 읽힌다. 2px 표면 링으로 막대와 분리한다 (§9-1). */}
      {cohort === null ? null : (
        <span
          className="absolute -inset-y-[5px] w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: at(cohort), boxShadow: '0 0 0 2px var(--card)' }}
        />
      )}
    </span>
  );
}

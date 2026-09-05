import { cn } from '@/lib/utils';

// 시간에 따른 평가액 한 줄. 능선 문법 그대로다 — 캔들·격자를 쓰지 않는다.
// ★ 축은 하나. 두 번째 y축을 만들지 않는다 (DESIGN-RULES §9-1).
// ★ 기준선(원금)을 «반드시» 스케일 안에 넣는다. 그래야 선이 기준 위인지 아래인지가
//   그림만으로 읽힌다. 기준선을 뺀 채 min~max로 늘리면 손실 구간도 우상향으로 보인다.
// ★ 호버 툴팁이 없다. 이 앱은 손가락으로 쓴다 — 대신 끝점을 직접 라벨하고,
//   같은 카드 안에 숫자가 «글자로도» 있어야 한다 (§9-1).

const W = 320;
const H = 104;
const PAD_X = 4;
const PAD_T = 12; // 끝점 라벨이 잘리지 않게 위를 더 띄운다
const PAD_B = 14; // 기준선 라벨이 들어갈 자리

export function ValueCurve({
  values,
  baseline,
  baselineLabel = '원금',
  ariaLabel,
  className,
}: {
  /** 일별 평가액. 원 단위 정수 */
  values: number[];
  /** 기준선 금액 (원금). 스케일에 항상 포함된다 */
  baseline: number;
  baselineLabel?: string;
  ariaLabel: string;
  className?: string;
}) {
  if (values.length < 2) return null;

  const lo = Math.min(...values, baseline);
  const hi = Math.max(...values, baseline);
  const span = hi - lo || 1;

  const x = (i: number) => PAD_X + (i / (values.length - 1)) * (W - PAD_X * 2);
  const y = (v: number) => PAD_T + (1 - (v - lo) / span) * (H - PAD_T - PAD_B);

  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} ${x(values.length - 1).toFixed(1)},${(H - PAD_B).toFixed(1)} ${x(0).toFixed(1)},${(H - PAD_B).toFixed(1)}`;

  const endX = x(values.length - 1);
  const endY = y(values[values.length - 1]);
  const baseY = y(baseline);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn('block h-[104px] w-full overflow-visible', className)}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id="curve-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.20" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 기준선 — 실선 헤어라인. 점선은 「예측」으로 읽힌다 */}
      <line x1={PAD_X} y1={baseY} x2={W - PAD_X} y2={baseY} className="stroke-border" strokeWidth="1" />
      <text x={PAD_X} y={baseY + 10} className="fill-faint" fontSize="9">
        {baselineLabel}
      </text>

      <polygon points={area} fill="url(#curve-fade)" />
      <polyline
        points={line}
        fill="none"
        className="stroke-[var(--chart-1)]"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 끝점 — 겹치는 마커에는 2px 표면 링을 둘러 선과 분리한다.
          ★ 여기에 숫자를 «다시» 적지 않는다. 끝점 값은 이 카드 맨 위 큰 수치가 이미 말했고,
            선 위에 겹쳐 쓰면 둘 다 안 읽힌다 (DESIGN-RULES §9-1 선택적 직접 라벨). */}
      <circle cx={endX} cy={endY} r="4" className="fill-[var(--chart-1)] stroke-card" strokeWidth="2" />
    </svg>
  );
}

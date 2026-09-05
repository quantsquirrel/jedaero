import { manWon } from '@/lib/format';
import type { AttributionCurves } from '@/lib/principles/facts';

// 「내 조정이 움직인 금액」은 두 선 «사이»다. 끝점 차이 하나로는 안 보인다.
// ★ 계열이 둘이므로 범례가 반드시 있다 (DESIGN-RULES §9-1).
// ★ 어느 쪽이 높은지로 우열을 칠하지 않는다. 합성 시세에서 방향은 우연이고,
//   우리 데이터가 「조정이 좋았다」를 뒷받침하지 못한다 (facts.ts 문안 11과 같은 근거).
//   그래서 두 선 다 up/down 색을 쓰지 않는다 — 채운 면적은 «크기»만 뜻한다.

const W = 320;
const H = 116;
const PAD_X = 4;
const PAD_T = 10;
const PAD_B = 8;

export function AttributionCurves({ data }: { data: AttributionCurves }) {
  const { dates, mine, held, diff } = data;
  const all = mine.concat(held);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;

  const x = (i: number) => PAD_X + (i / (mine.length - 1)) * (W - PAD_X * 2);
  const y = (v: number) => PAD_T + (1 - (v - lo) / span) * (H - PAD_T - PAD_B);
  const pts = (a: number[]) => a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  // 두 선 사이 — 앞은 내 곡선, 뒤는 반사실을 거꾸로 이어 닫는다
  const between = `${pts(mine)} ${held
    .map((v, i) => `${x(held.length - 1 - i).toFixed(1)},${y(held[held.length - 1 - i]).toFixed(1)}`)
    .join(' ')}`;

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-[116px] w-full"
        role="img"
        aria-label={`내 편성 곡선과, 첫 편성을 끝까지 유지했을 때의 곡선. 끝점 차이 ${manWon(diff)}`}
      >
        <polygon points={between} className="fill-[var(--chart-3)]" fillOpacity="0.22" />
        <polyline
          points={pts(held)}
          fill="none"
          className="stroke-faint"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={pts(mine)}
          fill="none"
          className="stroke-[var(--chart-1)]"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 shrink-0 rounded-full bg-[var(--chart-1)]" aria-hidden />
          <span className="text-[11px] text-muted-foreground">바꿔 온 편성</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 shrink-0 rounded-full bg-faint" aria-hidden />
          <span className="text-[11px] text-muted-foreground">첫 편성 그대로</span>
        </li>
      </ul>

      <figcaption className="flex justify-between font-mono text-[11px] tabular-nums text-faint">
        <span>{dates[0]}</span>
        <span>{dates[dates.length - 1]}</span>
      </figcaption>
    </figure>
  );
}

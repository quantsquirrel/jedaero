'use client';
// 「매달 모았다면」 두 곡선 비교 (SPEC §3-6 e)
// 같은 비중·같은 가격, 현금흐름만 다른 두 대안. ★ 두 값을 더해 표시하지 않는다.
// 색은 다크 서피스에서 검증된 카테고리 2색 (CVD ΔE 26.8, 대비 3:1 이상 PASS).
import { useMemo, useRef, useState } from 'react';

const COLOR_LUMP = '#3987e5'; // 전역(일시금)
const COLOR_SAVE = '#d95926'; // 매달 모았다면

const W = 360;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 22, left: 44 };

function fmtShort(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만`;
  return n.toLocaleString('ko-KR');
}

export function ComparisonChart({
  dates,
  lump,
  savings,
}: {
  dates: string[];
  lump: number[];
  savings: number[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { toX, toY, lumpPath, savePath, ticks } = useMemo(() => {
    const max = Math.max(...lump, ...savings, 1) * 1.05;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const toX = (i: number) => PAD.left + (dates.length <= 1 ? 0 : (i / (dates.length - 1)) * innerW);
    const toY = (v: number) => PAD.top + innerH - (v / max) * innerH;
    const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join('');
    const ticks = [0.25, 0.5, 0.75, 1].map((f) => ({ y: toY(max * f), label: fmtShort(max * f) }));
    return { toX, toY, lumpPath: path(lump), savePath: path(savings), ticks };
  }, [dates.length, lump, savings]);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const innerW = W - PAD.left - PAD.right;
    const i = Math.round(((x - PAD.left) / innerW) * (dates.length - 1));
    setHover(Math.min(dates.length - 1, Math.max(0, i)));
  };

  return (
    <figure className="flex flex-col gap-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label="일시금 곡선과 매달 모았다면 곡선 비교"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t.label}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="currentColor" strokeOpacity={0.12} />
            <text x={PAD.left - 6} y={t.y + 3} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.55}>
              {t.label}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 6} fontSize={9} fill="currentColor" fillOpacity={0.55}>
          {dates[0]}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.55}>
          {dates[dates.length - 1]}
        </text>

        <path d={lumpPath} fill="none" stroke={COLOR_LUMP} strokeWidth={2} strokeLinejoin="round" />
        <path d={savePath} fill="none" stroke={COLOR_SAVE} strokeWidth={2} strokeLinejoin="round" />

        {hover != null ? (
          <g>
            <line x1={toX(hover)} x2={toX(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="currentColor" strokeOpacity={0.35} />
            <circle cx={toX(hover)} cy={toY(lump[hover])} r={4} fill={COLOR_LUMP} stroke="var(--background)" strokeWidth={2} />
            <circle cx={toX(hover)} cy={toY(savings[hover])} r={4} fill={COLOR_SAVE} stroke="var(--background)" strokeWidth={2} />
          </g>
        ) : null}
      </svg>

      {hover != null ? (
        <p className="text-xs tabular-nums text-muted-foreground">
          {dates[hover]} · <span style={{ color: COLOR_LUMP }}>■</span> 일시금{' '}
          {Math.round(lump[hover]).toLocaleString('ko-KR')}원 · <span style={{ color: COLOR_SAVE }}>■</span>{' '}
          매달 모았다면 {Math.round(savings[hover]).toLocaleString('ko-KR')}원
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">곡선을 짚으면 날짜별 두 값이 표시됩니다.</p>
      )}

      <figcaption className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: COLOR_LUMP }} />
          전역 일시금
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: COLOR_SAVE }} />
          매달 모았다면
        </span>
      </figcaption>
    </figure>
  );
}

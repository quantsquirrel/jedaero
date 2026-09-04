import type { ThemeCode } from '@/lib/constants';
import { cn } from '@/lib/utils';

// 전선 지형 — 산·해·평원 톤의 추상 실루엣. 로고·국기·캔들 금지.
// zinc 위 amber 한 점. 장식이 아니라 지형 은유를 시각으로 옮긴다.

const PATH: Record<ThemeCode, string> = {
  KR_STOCK: 'M2 22 L8 14 L12 17 L18 8 L24 13 L30 6 L36 12 L42 9 L46 22 Z',
  US_STOCK: 'M2 22 L6 18 C10 10 14 10 18 16 C22 8 28 7 32 14 L38 11 L46 22 Z',
  INTL_STOCK: 'M2 16 C8 14 10 8 16 10 C22 12 24 6 30 8 C36 10 40 14 46 12 L46 22 L2 22 Z',
  BOND: 'M2 18 L46 18 L46 22 L2 22 Z',
  GOLD_COMM: 'M4 20 L14 8 L24 14 L34 6 L44 16 L44 22 L4 22 Z',
  REIT_INFRA: 'M6 22 L6 12 L12 12 L12 8 L20 8 L20 12 L28 12 L28 6 L36 6 L36 14 L42 14 L42 22 Z',
};

const DOT: Record<ThemeCode, { cx: number; cy: number }> = {
  KR_STOCK: { cx: 30, cy: 6 },
  US_STOCK: { cx: 28, cy: 8 },
  INTL_STOCK: { cx: 24, cy: 7 },
  BOND: { cx: 24, cy: 14 },
  GOLD_COMM: { cx: 34, cy: 6 },
  REIT_INFRA: { cx: 28, cy: 6 },
};

export function FrontTerrain({ code, className }: { code: ThemeCode; className?: string }) {
  const d = PATH[code];
  const dot = DOT[code];
  return (
    <svg
      viewBox="0 0 48 24"
      className={cn('h-6 w-12 shrink-0 text-faint/70', className)}
      aria-hidden
    >
      <path d={d} fill="currentColor" fillOpacity="0.35" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx={dot.cx} cy={dot.cy} r="1.8" className="fill-primary" />
    </svg>
  );
}

import { cn } from '@/lib/utils';

// 능선 — 이 서비스의 시각 문법. 장식이 아니라 「전선(자산군)을 지형으로 본다」는 은유를
// 화면 구조로 옮긴 것이다. 능선 위 점 하나가 신호색이 놓이는 자리다.
// ★ 캔들·로고·국기를 쓰지 않는다 (DESIGN-DECISIONS §14).

/** 히어로 아래 3겹 실루엣. 뒤로 갈수록 밝아져 깊이를 만든다. */
export function HeroRidges({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1280 220"
      preserveAspectRatio="none"
      className={cn('block w-full', className)}
      aria-hidden
    >
      {/* 먼 능선이 밝고 가까운 능선이 어둡다 — 그래야 깊이가 생긴다. 그리는 순서도 먼 것부터 */}
      <path
        d="M0 176 L120 148 L210 162 L320 116 L410 138 L520 96 L610 128 L730 104 L840 146 L960 112 L1070 150 L1180 128 L1280 158 L1280 220 L0 220 Z"
        className="fill-secondary"
      />
      <path
        d="M0 176 L120 148 L210 162 L320 116 L410 138 L520 96 L610 128 L730 104 L840 146 L960 112 L1070 150 L1180 128 L1280 158"
        fill="none"
        strokeWidth="1.2"
        className="stroke-muted-foreground/25"
      />
      <path
        d="M0 196 L140 176 L260 190 L380 156 L500 180 L620 148 L740 178 L880 152 L1010 184 L1140 162 L1280 190 L1280 220 L0 220 Z"
        className="fill-card"
      />
      <path
        d="M0 196 L140 176 L260 190 L380 156 L500 180 L620 148 L740 178 L880 152 L1010 184 L1140 162 L1280 190"
        fill="none"
        strokeWidth="1.3"
        className="stroke-border"
      />
      {/* 신호색 한 점 — 가까운 능선의 마루에 놓는다 */}
      <circle cx="620" cy="148" r="5" className="fill-primary" />
      <circle cx="620" cy="148" r="13" fill="none" strokeWidth="1.2" className="stroke-primary/35" />
    </svg>
  );
}

/** 섹션 사이 얇은 능선. 가로줄 하나를 쓰는 자리에 대신 놓는다. */
export function RidgeRule({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 26" preserveAspectRatio="none" className={cn('block h-6 w-full', className)} aria-hidden>
      <path
        d="M0 24 L120 16 L200 20 L300 8 L390 14 L480 4 L560 12 L680 9 L790 18 L900 11 L1024 20"
        fill="none"
        strokeWidth="1.4"
        strokeLinejoin="round"
        className="stroke-border"
      />
      <circle cx="480" cy="4" r="3.4" className="fill-primary" />
    </svg>
  );
}

// 데스크톱 주변부 — 448px 기둥 좌우가 「버려진 검정」이 아니라 «설계된 야간 지형»으로 읽히게 한다.
// docs/DESIGN-RULES.md §12-4가 직접 처방한 항목이다. 2단 재구성이 아니라 배경 처리다 (§8).
//
// ★ 능선은 차트 사다리에서만 그린다 — 신호색(--primary)을 배경에 깔면 화면의 amber가 하나 더 는다.
// ★ 모바일에서는 아예 렌더하지 않는다(hidden md:block). 390px에는 남는 폭이 없다.
// ★ 0.10/0.07/0.05에서는 1280px 화면의 좌우 능선이 «기둥 다음으로 큰 덩어리»로 읽혔다.
//   주변부가 두 번째로 강한 것이 되면 그것은 배경이 아니라 경쟁자다.
//   0.045/0.03/0.02 — 바탕에 결이 있다는 것만 남기고 실루엣은 거의 지운다.
// ★ 정지 화면이다. 이 실행의 motionDecision은 none이고 여기에 시간 기반 장면을 넣지 않는다.
export function DesktopSurround() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden md:block">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* 먼 능선부터 그린다. 순서가 뒤집히면 가까운 층이 덮인다 (DESIGN-RULES §11) */}
        <path
          d="M0 640 L150 566 L300 604 L430 512 L560 588 L700 530 L840 596 L980 524 L1120 592 L1280 546 L1440 606 L1440 900 L0 900 Z"
          fill="var(--chart-5)"
          opacity="0.045"
        />
        <path
          d="M0 730 L170 676 L330 716 L470 648 L620 706 L760 662 L900 718 L1050 660 L1200 712 L1330 674 L1440 708 L1440 900 L0 900 Z"
          fill="var(--chart-5)"
          opacity="0.03"
        />
        <path
          d="M0 812 L200 772 L380 806 L540 762 L700 800 L880 764 L1040 804 L1220 770 L1440 802 L1440 900 L0 900 Z"
          fill="var(--chart-5)"
          opacity="0.02"
        />
      </svg>
    </div>
  );
}

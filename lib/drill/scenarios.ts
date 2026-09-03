// 도상훈련 3장 — 구간은 전략적으로 고정 (2026-09-04 잠금).
// 고점→저점만 자르면 종심 방어가 세 판을 이긴다. 같은 12개월, 다른 교훈.

export type DrillScenarioId = 'crash-recover' | 'both-down' | 'still-red';

export type DrillScenario = {
  id: DrillScenarioId;
  title: string;
  fromDate: string;
  toDate: string;
  lesson: string;
  /** 카드 전용 캡션. 2008은 고정 문장이 필수. */
  caption: string;
  sharedCaption: string;
};

export const DRILL_SHARED_CAPTION =
  '같은 12개월입니다. 다른 지형입니다. 한 장의 순위가 예시 작전의 추천이 되지 않습니다.';

export const DRILL_SCENARIOS: readonly DrillScenario[] = [
  {
    id: 'crash-recover',
    title: '급락 후 회복',
    fromDate: '2020-02-03',
    toDate: '2021-01-29',
    lesson: '깊은 낙폭 뒤에 주식이 돌아온다. 끝 금액과 가장 쪼그라든 금액이 갈린다.',
    caption: DRILL_SHARED_CAPTION,
    sharedCaption: DRILL_SHARED_CAPTION,
  },
  {
    id: 'both-down',
    title: '같이 내린 해',
    fromDate: '2022-01-03',
    toDate: '2022-12-29',
    lesson: '주식과 채권이 같이 내렸다. 나눠 담아도 줄이지 못하는 해가 있다.',
    caption: DRILL_SHARED_CAPTION,
    sharedCaption: DRILL_SHARED_CAPTION,
  },
  {
    id: 'still-red',
    title: '1년 후에도 빨간',
    fromDate: '2008-09-01',
    toDate: '2009-08-31',
    lesson: '한 해가 지나도 주식이 회복하지 못한 구간이 있다.',
    caption:
      '이 구간의 끝은 역사의 끝이 아닙니다. 이후 수년이 더 걸렸습니다. 한 해의 승자가 전략의 정답이 아닙니다.',
    sharedCaption: DRILL_SHARED_CAPTION,
  },
] as const;

// 위클리 퀘스트 5종 (docs/SEED.md §4)
// HOLD는 "아무것도 하지 않은 것"에 대한 보상이다. 빼면 가만히 있기가 미참여로 취급된다.
export const QUESTS = [
  { code: 'RECORD_3', title: '지출 3건 기록', description: '이번 주에 쓴 돈 3건을 기록해 보세요', xp: 30, badge: null },
  { code: 'CONFIRM_AI', title: '분류 5건 확인', description: 'AI가 제안한 분류 5건을 확인하고 확정하세요', xp: 20, badge: null },
  { code: 'LEARN_1', title: '학습 카드 1개', description: '학습 카드 하나를 끝까지 읽으세요', xp: 20, badge: null },
  { code: 'REVIEW_1', title: '주말 회고', description: '이번 주를 한 줄로 돌아보세요', xp: 30, badge: 'REFLECT' },
  { code: 'HOLD', title: '그대로 두기', description: '이번 주 비중을 바꾸지 않았습니다', xp: 20, badge: 'PATIENT' },
] as const;

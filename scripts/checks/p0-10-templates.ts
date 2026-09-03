// P0-10: 예시 작전 5종 — 배분이 포인트 규칙을 지키는가
// 합계 100은 조건이 아니다. 「정찰 침투」는 의도적으로 20포인트를 다 쓰지 않는다 (예비대 시연).
import { OPERATIONS, POINT_UNIT, TOTAL_POINTS } from '../../lib/constants';
import { isValidWeights, reservePoints } from '../../lib/portfolio/weights';

if (OPERATIONS.length !== 5) {
  console.log(`예시 작전 ${OPERATIONS.length}종 (기대 5종)`);
  process.exit(1);
}
for (const op of OPERATIONS) {
  if (!isValidWeights(op.weights)) {
    console.log(`${op.id} 배분이 포인트 규칙 위반 (${POINT_UNIT}%p 단위 · 합 ${TOTAL_POINTS}포인트 이하)`);
    process.exit(1);
  }
  // 균형 규칙: 장점과 단점의 개수가 같아야 한다. 한쪽만 길면 그게 곧 추천 신호가 된다
  if (op.pros.length !== op.cons.length) {
    console.log(`${op.id} 장단점 개수 불균형 (+${op.pros.length} / −${op.cons.length})`);
    process.exit(1);
  }
}
const reserved = OPERATIONS.filter((op) => reservePoints(op.weights) > 0);
if (reserved.length === 0) {
  console.log('예비대를 남기는 예시가 하나도 없음 — 예비대 개념이 예시에서 사라졌다');
  process.exit(1);
}
console.log(
  OPERATIONS.map((op) => `${op.name} ${TOTAL_POINTS - reservePoints(op.weights)}p`).join(' · ') +
    ` (예비대를 남기는 예시: ${reserved.map((o) => o.name).join('·')})`,
);

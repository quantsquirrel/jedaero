// P0-10: 예시 포트폴리오 4종 각각 비중 합계 = 100
import { PORTFOLIO_TEMPLATES } from '../../lib/constants';

if (PORTFOLIO_TEMPLATES.length !== 4) {
  console.log(`예시 ${PORTFOLIO_TEMPLATES.length}종 (기대 4종)`);
  process.exit(1);
}
for (const t of PORTFOLIO_TEMPLATES) {
  const sum = Object.values(t.weights).reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    console.log(`${t.id} 비중 합계 ${sum} (기대 100)`);
    process.exit(1);
  }
}
console.log('GLOBAL·DOMESTIC·SAFE·FOCUS 비중 합계 각 100');

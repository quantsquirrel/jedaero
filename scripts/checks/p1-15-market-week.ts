// P1-15: AI-4 주간 시황 — 규칙 기반 6전선 등락 계산이 성립하는가
// LLM은 이 숫자를 받기만 한다. 숫자가 틀리면 브리핑도 틀린다.
import { THEMES, type ThemeCode } from '../../lib/constants';
import { computeMarketWeek } from '../../lib/market-week';

const todayStr = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
// 합 90 — 나머지 10%는 예비대다. 예비대는 전선이 아니므로 moves에 나타나지 않는다.
const weights: Partial<Record<ThemeCode, number>> = {
  KR_STOCK: 15, US_STOCK: 40, INTL_STOCK: 15, BOND: 10, GOLD_COMM: 10, REIT_INFRA: 0,
};

const week = computeMarketWeek(todayStr, weights);
if (!week) {
  console.log(`${todayStr} 기준 거래 구간 없음 — 가격 시드를 확인할 것`);
  process.exit(1);
}
if (week.moves.length !== THEMES.length) {
  console.log(`전선 ${week.moves.length}개 (기대 ${THEMES.length}개)`);
  process.exit(1);
}
// 등락률 내림차순 정렬 + best/worst 일치
for (let i = 1; i < week.moves.length; i++) {
  if (week.moves[i - 1].changePct < week.moves[i].changePct) {
    console.log('등락률 내림차순 정렬이 깨짐');
    process.exit(1);
  }
}
if (week.best.code !== week.moves[0].code || week.worst.code !== week.moves[week.moves.length - 1].code) {
  console.log('best/worst가 정렬 결과와 불일치');
  process.exit(1);
}
// 가중합 = Σ(등락률 × 비중)
const expected = week.moves.reduce((s, m) => s + m.changePct * (m.myWeight / 100), 0);
if (Math.abs(expected - week.weightedPct) > 1e-9) {
  console.log(`가중합 불일치: ${week.weightedPct} vs ${expected}`);
  process.exit(1);
}
// 포인트를 놓지 않은 전선은 기여도도 0이어야 한다 (REIT_INFRA)
const empty = week.moves.find((m) => m.code === 'REIT_INFRA')!;
if (empty.contributionPct !== 0) {
  console.log(`비중 0인 전선의 기여도가 0이 아님: ${empty.contributionPct}`);
  process.exit(1);
}
// 전 전선이 완전히 같은 값이면 시황 카드가 무의미하다
if (week.moves.every((m) => m.changePct === week.moves[0].changePct)) {
  console.log('6전선 등락이 전부 동일 — 시드 분산을 확인할 것');
  process.exit(1);
}
const f = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
console.log(
  `${week.fromDate}~${week.toDate} 영업일 ${week.tradingDays}일 · ` +
    `최고 ${week.best.name} ${f(week.best.changePct)} / 최저 ${week.worst.name} ${f(week.worst.changePct)} / ` +
    `비중가중 ${f(week.weightedPct)}`,
);

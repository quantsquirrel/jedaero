// P1-01: 같은 비중·같은 가격에 현금흐름만 다르게 → 최종 평가액이 서로 다름. 두 값 출력
import { PRICE_DATES, PRICE_SERIES } from '../../db/seed/prices';
import { PORTFOLIO_TEMPLATES, SEED_AMOUNT } from '../../lib/constants';

async function main() {
  let m: typeof import('../../lib/portfolio/engine');
  try {
    m = await import('../../lib/portfolio/engine');
  } catch {
    console.log('lib/portfolio/engine.ts 미구현 (3단계)');
    process.exit(1);
  }
  const history = [{ effectiveFrom: PRICE_DATES[0], weights: PORTFOLIO_TEMPLATES[0].weights }];

  // 전역(일시금): 첫 거래일에 전액
  const lump: Record<string, number> = { [PRICE_DATES[0]]: SEED_AMOUNT };
  // 적립: 매월 첫 거래일에 45만원
  const monthly: Record<string, number> = {};
  let prevMonth = '';
  for (const d of PRICE_DATES) {
    const ym = d.slice(0, 7);
    if (ym !== prevMonth) {
      monthly[d] = 450_000;
      prevMonth = ym;
    }
  }

  const a = m.computeCurve(PRICE_DATES, PRICE_SERIES, history, lump);
  const b = m.computeCurve(PRICE_DATES, PRICE_SERIES, history, monthly);
  const fa = a.values[a.values.length - 1];
  const fb = b.values[b.values.length - 1];
  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa === fb) {
    console.log(`두 곡선이 같음: ${fa} vs ${fb}`);
    process.exit(1);
  }
  console.log(`일시금 ₩${Math.round(fa).toLocaleString('ko-KR')} vs 적립 ₩${Math.round(fb).toLocaleString('ko-KR')} — 서로 다름`);
}
main();

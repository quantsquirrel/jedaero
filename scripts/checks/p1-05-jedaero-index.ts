// P1-05: 제대로 지수 — 세 축이 각자 상한을 지키고, 한 축만 밀어서는 만점이 안 나오는가
// (구 P1-05 「예산 준수율」은 가계부 제거와 함께 폐지됐다)
import { INDEX_MAX, effectiveFronts, jedaeroIndex } from '../../lib/jedaero-index';
import type { Weights } from '../../lib/constants';

const w = (o: Partial<Weights>): Weights =>
  ({ KR_STOCK: 0, US_STOCK: 0, INTL_STOCK: 0, BOND: 0, GOLD_COMM: 0, REIT_INFRA: 0, ...o }) as Weights;

function fail(msg: string): never {
  console.log(msg);
  process.exit(1);
}

// 유효 전선 수: 한 곳 몰빵 = 1.0, 전부 예비대 = 1.0, 4곳 균등 = 4.0
const solo = effectiveFronts(w({ US_STOCK: 100 }));
const allReserve = effectiveFronts(w({}));
const four = effectiveFronts(w({ KR_STOCK: 25, US_STOCK: 25, BOND: 25, GOLD_COMM: 25 }));
if (Math.abs(solo - 1) > 1e-9) fail(`몰빵 유효 전선 수 ${solo} (기대 1.0)`);
if (Math.abs(allReserve - 1) > 1e-9) fail(`전부 예비대 유효 전선 수 ${allReserve} (기대 1.0 — 무한대가 되면 안 된다)`);
if (Math.abs(four - 4) > 1e-9) fail(`4곳 균등 유효 전선 수 ${four} (기대 4.0)`);

// 한 축만 밀어서는 그 축의 상한을 넘지 못한다
const onlyGrown = jedaeroIndex({ annualReturn: 0.9, annualVol: 0.1, weights: w({ US_STOCK: 100 }), turnoverPct: 99 });
if (onlyGrown.total > INDEX_MAX.grown + 1e-9) fail(`몰빵+고수익이 ${onlyGrown.total}점 (상한 ${INDEX_MAX.grown})`);

// 각 축은 상한을 넘지 않는다
const maxed = jedaeroIndex({ annualReturn: 5, annualVol: 0.1, weights: w({ KR_STOCK: 20, US_STOCK: 20, INTL_STOCK: 20, BOND: 20, GOLD_COMM: 20 }), turnoverPct: 0 });
if (maxed.grown > INDEX_MAX.grown || maxed.spread > INDEX_MAX.spread || maxed.held > INDEX_MAX.held) {
  fail(`상한 초과: ${JSON.stringify(maxed)}`);
}
if (maxed.total > 100) fail(`총점 ${maxed.total} (상한 100)`);

// 손실 구간은 0점이지 음수가 아니다
const losing = jedaeroIndex({ annualReturn: -0.3, annualVol: 0.2, weights: w({ BOND: 100 }), turnoverPct: 0 });
if (losing.grown !== 0) fail(`손실 구간 「위험을 이긴 성과」이 ${losing.grown}점 (기대 0)`);

// 기록이 없으면 0점
const empty = jedaeroIndex({ annualReturn: null, annualVol: null, weights: null, turnoverPct: null });
if (empty.total !== 0) fail(`기록 없음이 ${empty.total}점 (기대 0)`);

// 3.0 전선이면 「분산의 힘」이 만점 근처여야 한다
const three = jedaeroIndex({ annualReturn: null, annualVol: null, weights: w({ KR_STOCK: 33, US_STOCK: 33, BOND: 34 }), turnoverPct: null });
if (three.spread < INDEX_MAX.spread * 0.85) fail(`3전선 균등이 ${three.spread}점 (기대 ${INDEX_MAX.spread} 근처)`);

console.log(
  `유효 전선 몰빵 ${solo.toFixed(1)} / 전부예비대 ${allReserve.toFixed(1)} / 4균등 ${four.toFixed(1)} · ` +
    `몰빵+고수익 총점 ${onlyGrown.total} (≤${INDEX_MAX.grown}) · 3전선 균등 나눠담기 ${three.spread}/${INDEX_MAX.spread} · ` +
    `손실 구간 0점 · 기록 없음 0점`,
);

// P1-01: 하위 테마 배치 — 포인트가 쪼개지지 않는 병력 단위로 지켜지는가
// (구 P1-01 「적립 곡선」은 「매달 모았다면」 폐지와 함께 사라졌다. 번호를 재사용한다)
import { POINT_UNIT, type ThemeCode, type Weights } from '../../lib/constants';
import {
  adjustDetail,
  dropStaleDetails,
  isDetailOpen,
  isValidDetails,
  normalizeDetails,
  subRowsOf,
  type Details,
} from '../../lib/portfolio/details';
import { tickerFractions } from '../../lib/portfolio/engine';

const w = (o: Partial<Record<ThemeCode, number>>): Weights =>
  ({ KR_STOCK: 0, US_STOCK: 0, INTL_STOCK: 0, BOND: 0, GOLD_COMM: 0, REIT_INFRA: 0, ...o }) as Weights;

function fail(msg: string): never {
  console.log(msg);
  process.exit(1);
}

// 하위를 여는 전선은 주식 둘뿐 (D-5 현실 — UI 복잡도)
const openFronts = (['KR_STOCK', 'US_STOCK', 'INTL_STOCK', 'BOND', 'GOLD_COMM', 'REIT_INFRA'] as ThemeCode[]).filter(isDetailOpen);
if (openFronts.join(',') !== 'KR_STOCK,US_STOCK') fail(`하위 조정 전선 ${openFronts.join(',')} (기대 KR_STOCK,US_STOCK)`);

// 대표지수가 목록 첫 줄에 있어야 한다 — 「일부만 테마로 빼기」가 가능해야 하기 때문
const rows = subRowsOf('KR_STOCK');
if (!rows[0].isIndex) fail('하위 목록 첫 줄이 대표지수가 아님');

// 상위 포인트를 넘겨 놓을 수 없다
const weights = w({ KR_STOCK: 3 * POINT_UNIT, US_STOCK: 10 * POINT_UNIT });
let d: Details = {};
for (let i = 0; i < 5; i++) d = adjustDetail(d, weights, 'KR_STOCK', 'KR-SEMI', 1);
const semi = d.KR_STOCK?.['KR-SEMI'] ?? 0;
if (semi !== 3) fail(`상위 3포인트인데 하위에 ${semi}포인트가 놓임`);

// 0 미만으로 내려가지 않는다
const d2 = adjustDetail({}, weights, 'KR_STOCK', 'KR-BIO', -1);
if (Object.keys(d2.KR_STOCK ?? {}).length !== 0) fail('0 미만으로 내려감');

// 합계가 상위와 다르면 저장 거부
if (isValidDetails({ KR_STOCK: { 'KR-SEMI': 2 } }, weights)) fail('합계 불일치(2 vs 3)를 통과시킴');
if (!isValidDetails({ KR_STOCK: { 'KR-SEMI': 2, 'KR-BIO': 1 } }, weights)) fail('정상 배치를 거부함');
// 열지 않은 전선의 하위 값은 받지 않는다
if (isValidDetails({ BOND: { 'BD-UST': 1 } }, w({ BOND: POINT_UNIT }))) fail('열지 않은 전선의 하위 값을 통과시킴');
// 목록에 없는 지수는 받지 않는다
if (isValidDetails({ KR_STOCK: { 'US-TECH': 3 } }, weights)) fail('다른 전선의 지수를 통과시킴');

// 상위가 바뀌면 어긋난 하위를 버린다 (자동 비례 재조정 금지)
const shrunk = w({ KR_STOCK: 2 * POINT_UNIT, US_STOCK: 10 * POINT_UNIT });
const { details: kept, dropped } = dropStaleDetails({ KR_STOCK: { 'KR-SEMI': 2, 'KR-BIO': 1 } }, shrunk);
if (dropped.join(',') !== 'KR_STOCK') fail(`어긋난 하위를 버리지 않음 (dropped=${dropped.join(',')})`);
if (kept.KR_STOCK) fail('버렸다고 하면서 남아 있음');

// 엔진 전개: 하위 미지정 = 대표지수 100%, 지정 시 그 비율대로
const noDetail = tickerFractions({ effectiveFrom: '2026-01-02', weights: w({ KR_STOCK: 100 }) });
if (Math.abs((noDetail['KR-IDX'] ?? 0) - 1) > 1e-9) fail(`하위 미지정인데 대표지수 비중이 ${noDetail['KR-IDX']}`);
const withDetail = tickerFractions({
  effectiveFrom: '2026-01-02',
  weights: w({ KR_STOCK: 100 }),
  details: { KR_STOCK: { 'KR-IDX': 1, 'KR-SEMI': 3 } },
});
if (Math.abs((withDetail['KR-SEMI'] ?? 0) - 0.75) > 1e-9) fail(`하위 3/4인데 비중이 ${withDetail['KR-SEMI']}`);
const total = Object.values(withDetail).reduce((a, b) => a + b, 0);
if (Math.abs(total - 1) > 1e-9) fail(`전개 합계가 ${total} (기대 1)`);

// 전부 비면 null — 「지수추종」임을 DB에 명시한다
if (normalizeDetails({ KR_STOCK: {} }) !== null) fail('빈 배치가 null로 정리되지 않음');

console.log(
  `하위 조정 전선 ${openFronts.join('·')} · 상위 초과 차단(3p 상한) · 합계 불일치 거부 · ` +
    `열지 않은 전선 거부 · 상위 변경 시 하위 폐기 · 미지정=대표지수 100% · 지정 시 3/4=0.75 전개`,
);

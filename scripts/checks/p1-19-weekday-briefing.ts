// P1-19: 평일 AI-4 — 주말 가드와 분리. 입력에 가중 등락 없음. 질문 1개.
import { weekdayBriefingFallback, weekdayBriefingInput } from '../../lib/ai/briefing';
import { verifyFactualOutput } from '../../lib/ai/output-guard';
import { THEMES } from '../../lib/constants';
import type { MarketWeek } from '../../lib/market-week';

const week: MarketWeek = {
  fromDate: '2026-01-05',
  toDate: '2026-01-09',
  tradingDays: 5,
  moves: THEMES.map((t, i) => ({
    code: t.code,
    name: t.name,
    changePct: (i - 2) * 0.01,
    myWeight: i === 0 ? 40 : 10,
    contributionPct: (i - 2) * 0.01 * (i === 0 ? 0.4 : 0.1),
  })),
  best: {
    code: THEMES[0].code,
    name: THEMES[0].name,
    changePct: 0.02,
    myWeight: 40,
    contributionPct: 0.008,
  },
  worst: {
    code: THEMES[5].code,
    name: THEMES[5].name,
    changePct: -0.03,
    myWeight: 10,
    contributionPct: -0.003,
  },
  weightedPct: 0.012,
};

const payload = weekdayBriefingInput(week);
const raw = JSON.stringify(payload);
let failed = 0;
if (raw.includes('가중') || '내비중가중등락퍼센트' in payload || 'weightedPct' in payload) {
  console.log('평일 입력에 가중 등락이 들어 있음');
  failed += 1;
}
// ★ 비중 자체도 주지 않는다. 등락 × 비중을 곱하면 이번 주 내 손익이 나오기 때문이다.
if ('내비중퍼센트' in payload || raw.includes('myWeight')) {
  console.log('평일 입력에 내 비중이 들어 있음 — 등락과 곱하면 손익이 된다');
  failed += 1;
}

const fb = weekdayBriefingFallback(week);
if (fb.questions.length !== 1) {
  console.log(`평일 질문 ${fb.questions.length}개 — 1개여야 함`);
  failed += 1;
}
if (fb.summary.includes('가중')) {
  console.log('평일 폴백 요약이 가중 손익을 말함');
  failed += 1;
}
const guard = verifyFactualOutput([fb.summary, ...fb.questions].join(' '));
if (!guard.ok) {
  console.log(`평일 폴백이 출력 가드에 걸림: ${guard.reason}`);
  failed += 1;
}

if (failed > 0) process.exit(1);
console.log('평일 입력에서 가중 등락 제거, 질문 1개, 폴백 가드 통과');

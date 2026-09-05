// 고정 문안 원본 + 문안 규칙 검사기 (설계 문서 §5)
// ★ 화면과 검증 스크립트가 «같은 원본»을 본다. 화면에만 있으면 규칙이 지켜지는지 알 수 없다.
import { BENCHMARKS, SPIVA } from '../../db/seed/benchmarks';

const bench = (id: string) => {
  const b = BENCHMARKS.find((x) => x.id === id);
  if (!b) throw new Error(`기준선 ${id}가 BENCHMARKS에 없습니다.`);
  return b;
};
const slices = (id: string) =>
  bench(id)
    .slices.map((s) => `${s.name} ${s.pct}`)
    .join(' · ');

const nps = bench('NPS');
const gpfgStrategy = bench('GPFG_STRATEGY');
const gpfgActual = bench('GPFG_ACTUAL');

export const FIXED_COPY: Record<string, string> = {
  entry: '나의 투자 원칙 · 기록으로 한 장 만들기',
  title: '나의 투자 원칙',
  subtitle: '지금까지의 기록을 그대로 옮겼습니다.',
  checkHint: '빼고 싶은 문장은 체크를 풀면 됩니다',

  benchTitle: '다른 곳은 어떻게 나눠 뒀나',
  benchLead: '추천이 아닙니다. 목적도 기간도 다른 곳들의 배분입니다.',
  nps: `국민연금 — ${slices('NPS')} (${nps.asOf} 기금운용위원회 의결, ${nps.note})`,
  gpfg: `노르웨이 국부펀드 — 목표는 ${slices('GPFG_STRATEGY')}, 실제는 주식 ${
    gpfgActual.slices[0].pct
  } · 채권 ${gpfgActual.slices[1].pct} (NBIM ${gpfgActual.asOf})`,
  equalWeight: '균등배분 — 여섯 개에 고르게. 훈련의 「연합작전」이 이에 가깝습니다.',
  mappingNote:
    '자산군을 어떻게 자를지는 기관마다 다릅니다. 국민연금에는 금·원자재 자산군이 없고, 대체투자 14%는 리츠·인프라와 다릅니다 — 사모투자가 들어갑니다. 해외주식 34.7%도 미국과 그 밖을 나눠 공개하지 않습니다. 억지로 맞추지 않았습니다.',
  gapNote: `노르웨이는 목표가 주식 ${gpfgStrategy.slices[0].pct}인데 실제는 ${gpfgActual.slices[0].pct}입니다. 시장이 움직이면 비중은 목표에서 저절로 멀어집니다. 세계에서 가장 큰 국부펀드도 그렇습니다.`,
  spiva: `전문가와 다른 것이 문제가 아닙니다. 미국 주식형 액티브 펀드 중 10년 동안 지수를 밑돈 비율이 ${SPIVA.tenYearPct}%, 20년은 ${SPIVA.twentyYearPct}%였습니다.`,
  spivaSource:
    'S&P Dow Jones Indices, SPIVA U.S. Scorecard 2025년 말. 한국 펀드만의 10년 집계는 공개된 것이 없어 미국 기준입니다.',

  aiTitle: '왜 다른가',
  aiNoAnswer: '답을 적는 칸은 없습니다. 답은 다음 의사결정으로 하면 됩니다.',

  transferTitle: '밖에서는 이렇게 불립니다',
  transfer:
    '국내 주식 · 미국 주식 · 기타 해외 · 채권 · 금·원자재 · 리츠·인프라 — 증권 앱에서도 같은 이름으로 찾을 수 있습니다. 이런 지수를 따라가는 ETF가 여러 운용사에서 나와 있습니다.',
  twrSplit:
    '지금까지는 2,000만원이 한 번에 들어간 상태였습니다. 전역하고 월급을 넣기 시작하면, 화면에 뜨는 수익률과 판단이 얼마나 맞았는지가 갈라집니다. 갈라지는 것은 오류가 아닙니다.',

  saveNote:
    '저장한 이미지는 서버에 보관하지 않습니다. 이 서비스는 사용자님에 대한 판단을 보관하지 않습니다.',
  saveButton: '이미지로 저장',

  footerSim: '이 서비스의 시세는 교육용 모의 데이터입니다. 실제 거래는 일어나지 않습니다.',
  footerNoRec: '특정 상품이나 종목을 추천하지 않습니다.',
};

/** 갱신 경과 배너 (문안 21). 경과했을 때만 화면에 붙는다 */
export function staleNotice(label: string, asOf: string): string {
  return `${label} 기준선은 ${asOf} 기준입니다. 확인 예정일이 지났습니다.`;
}

// ★ 「추천」은 부정형으로 «정상» 등장한다 (문안 12·31). 먼저 지우고 검사한다 —
//   단순 grep이면 멀쩡한 문안이 FAIL하고, 그걸 피하려고 규칙을 지우게 된다.
const NEGATED = [/추천이 아닙니다/g, /추천하지 않습니다/g, /추천하지 않아요/g];

/** 명령형·권유형 어미. output-guard의 ADVICE_PATTERN보다 좁다 —
 *  고정 문안은 「하면 됩니다」처럼 정상적인 서술을 쓰기 때문이다. */
const IMPERATIVE = /(세요|십시오|하시죠|하시길|권장|권합니다|바랍니다|해야 합니다|하는 것이 좋)/;
const LABEL = /(공격적|보수적|안정형|공격형|위험중립형|무모|과감한 성향|신중한 성향|당신에게 맞는)/;
const BANNED = /(추천|최적|일치율|일치합니다|유사도|적정 비중)/;
const FUTURE = /(할 것입니다|하게 됩니다|될 것입니다|전망|목표가(?=\s*\d))/;

/** 위반 사유를 돌려준다. 위반이 없으면 null */
export function violatesCopyRules(text: string): string | null {
  let t = text;
  for (const re of NEGATED) t = t.replace(re, '');
  if (IMPERATIVE.test(t)) return '명령형·권유형';
  if (LABEL.test(t)) return '성향 라벨';
  if (BANNED.test(t)) return '금지 어휘(추천·최적·일치율)';
  if (FUTURE.test(t)) return '미래 시제·전망';
  return null;
}

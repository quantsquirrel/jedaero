// 공표된 기관 자산배분 + 학술 기준선 (설계 문서 §3)
// ★ 개별 전문가 전망·애널리스트 리포트를 쓰지 않는다. 「전문가 평균은 주식 60%인데 당신은 40%」는
//   목표 비중 제시이고, 권위가 붙어 AI가 말하는 것보다 강한 추천이 된다 (C10).
// ★ 전부 상수다. 런타임 외부 호출이 없다 (C6). 갱신은 사람이 하고 P1-25가 기계로 확인한다.
// ★ 공표 분류를 그대로 둔다. 우리 6자산군으로 강제 매핑하지 않는다 —
//   국민연금에는 금·원자재 자산군이 아예 없고, 맞춰 넣으면 «우리가 만든 숫자»가 된다.
// ★ 60/40은 넣지 않는다. 기관 공시도 학술 논문도 아니라 업계 관행일 뿐이고, 출처 링크를
//   정직하게 채울 수 없다. 화면 카피가 「억지로 맞추지 않았습니다」라서 인용을 만들면 모순된다.

export type BenchmarkSlice = { name: string; pct: number };

export type Benchmark = {
  id: 'NPS' | 'GPFG_STRATEGY' | 'GPFG_ACTUAL' | 'EQUAL_WEIGHT';
  label: string;
  slices: BenchmarkSlice[];
  /** 이 숫자의 기준일 */
  asOf: string;
  sourceUrl: string;
  /** 다음 확인 예정일. 지나면 화면이 스스로 신고한다 */
  nextReviewAt: string;
  note: string;
};

export const BENCHMARKS: readonly Benchmark[] = [
  {
    id: 'NPS',
    label: '국민연금',
    slices: [
      { name: '국내주식', pct: 20.8 },
      { name: '해외주식', pct: 34.7 },
      { name: '국내채권', pct: 23.1 },
      { name: '해외채권', pct: 7.4 },
      { name: '대체투자', pct: 14.0 },
    ],
    asOf: '2026-05-28',
    sourceUrl: 'https://fund.nps.or.kr/',
    // ★ 2026년에 두 번 바뀌었다 (1월 14.4→14.9, 5월 →20.8). 연 1회로 잡으면 낡은 숫자가 남는다.
    nextReviewAt: '2027-01-31',
    note: '2026년 말 목표비중 · 기금운용위원회 의결',
  },
  {
    id: 'GPFG_STRATEGY',
    label: '노르웨이 국부펀드 (목표)',
    slices: [
      { name: '주식', pct: 70 },
      { name: '채권', pct: 30 },
    ],
    asOf: '2019-05-01',
    sourceUrl: 'https://www.nbim.no/en/investments/benchmark-index/',
    nextReviewAt: '2027-02-28',
    note: '재무부가 정한 전략 기준지수',
  },
  {
    id: 'GPFG_ACTUAL',
    label: '노르웨이 국부펀드 (실제)',
    slices: [
      { name: '주식', pct: 72.1 },
      { name: '채권', pct: 25.8 },
      { name: '비상장 부동산', pct: 1.6 },
      { name: '비상장 인프라', pct: 0.5 },
    ],
    asOf: '2026-06-30',
    sourceUrl: 'https://www.nbim.no/en/investments/the-funds-value/',
    nextReviewAt: '2027-02-28',
    // 목표 70인데 실제 72.1 — 「목표 vs 현재」 갭의 실물 증거다. 학습 카드 4단계가 여기서 증명된다.
    note: '반기보고서 실제 배분',
  },
  {
    id: 'EQUAL_WEIGHT',
    label: '균등배분',
    // 6등분은 16.666…이라 소수 첫째자리로는 합이 100.2가 된다. 넷은 16.7, 둘은 16.6으로 100.0을 맞춘다.
    slices: [
      { name: '국내 주식', pct: 16.7 },
      { name: '미국 주식', pct: 16.7 },
      { name: '기타 해외', pct: 16.7 },
      { name: '채권', pct: 16.7 },
      { name: '금·원자재', pct: 16.6 },
      { name: '리츠·인프라', pct: 16.6 },
    ],
    asOf: '2026-09-05',
    sourceUrl: 'https://academic.oup.com/rfs/article/22/5/1915/1592901',
    nextReviewAt: '2099-12-31',
    note: 'DeMiguel · Garlappi · Uppal (2009)',
  },
] as const;

/** 액티브 펀드가 지수를 밑돈 비율. 「전문가를 따라가라」를 스스로 차단하는 근거다.
 *  ★ 한국 펀드만의 10년 집계는 공개된 것이 없다. 미국 기준임을 화면에 명시한다. */
export const SPIVA = {
  tenYearPct: 90.4,
  twentyYearPct: 95.0,
  asOf: '2025-12-31',
  sourceUrl: 'https://www.spglobal.com/spdji/en/research-insights/spiva/',
  note: '미국 주식형 액티브 펀드 (All Domestic Funds vs S&P Composite 1500)',
} as const;

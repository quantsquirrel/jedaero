// 종목 시드 30종 (docs/SEED.md §2)
// ⚠️ 티커·종목명은 표시용 라벨이다. 가격은 전부 합성 더미 데이터이며 실제 시세와 무관하다.
import type { ThemeCode } from '../../lib/constants';

export type TickerSeed = {
  ticker: string;
  name: string;
  theme: ThemeCode;
  kind: 'STOCK' | 'ETF';
};

export const TICKERS: TickerSeed[] = [
  // KR_LARGE — 국내 대형주 (6)
  { ticker: '005930', name: '삼성전자', theme: 'KR_LARGE', kind: 'STOCK' },
  { ticker: '000660', name: 'SK하이닉스', theme: 'KR_LARGE', kind: 'STOCK' },
  { ticker: '005380', name: '현대차', theme: 'KR_LARGE', kind: 'STOCK' },
  { ticker: '207940', name: '삼성바이오로직스', theme: 'KR_LARGE', kind: 'STOCK' },
  { ticker: '373220', name: 'LG에너지솔루션', theme: 'KR_LARGE', kind: 'STOCK' },
  { ticker: '069500', name: 'KODEX 200', theme: 'KR_LARGE', kind: 'ETF' },
  // KR_THEME — 국내 성장·테마 (6)
  { ticker: '091160', name: 'KODEX 반도체', theme: 'KR_THEME', kind: 'ETF' },
  { ticker: '305540', name: 'TIGER 2차전지테마', theme: 'KR_THEME', kind: 'ETF' },
  { ticker: '244580', name: 'KODEX 바이오', theme: 'KR_THEME', kind: 'ETF' },
  { ticker: '091180', name: 'KODEX 자동차', theme: 'KR_THEME', kind: 'ETF' },
  { ticker: '139230', name: 'TIGER 200 중공업', theme: 'KR_THEME', kind: 'ETF' },
  { ticker: '227540', name: 'TIGER 200 헬스케어', theme: 'KR_THEME', kind: 'ETF' },
  // US_INDEX — 미국지수 (국내상장 ETF) (5)
  { ticker: '360750', name: 'TIGER 미국S&P500', theme: 'US_INDEX', kind: 'ETF' },
  { ticker: '379810', name: 'KODEX 미국나스닥100', theme: 'US_INDEX', kind: 'ETF' },
  { ticker: '381180', name: 'TIGER 미국필라델피아반도체나스닥', theme: 'US_INDEX', kind: 'ETF' },
  { ticker: '133690', name: 'TIGER 미국나스닥100', theme: 'US_INDEX', kind: 'ETF' },
  { ticker: '143850', name: 'TIGER 미국S&P500 선물(H)', theme: 'US_INDEX', kind: 'ETF' },
  // BOND_CASH — 채권·현금성 (5)
  { ticker: '157450', name: 'TIGER 단기통안채', theme: 'BOND_CASH', kind: 'ETF' },
  { ticker: '114260', name: 'KODEX 국고채3년', theme: 'BOND_CASH', kind: 'ETF' },
  { ticker: '439870', name: 'KODEX CD금리액티브', theme: 'BOND_CASH', kind: 'ETF' },
  { ticker: '152380', name: 'KODEX 국채선물10년', theme: 'BOND_CASH', kind: 'ETF' },
  { ticker: '130730', name: 'KOSEF 단기자금', theme: 'BOND_CASH', kind: 'ETF' },
  // GOLD_COMM — 금·원자재 (4)
  { ticker: '132030', name: 'KODEX 골드선물(H)', theme: 'GOLD_COMM', kind: 'ETF' },
  { ticker: '319640', name: 'TIGER 골드선물(H)', theme: 'GOLD_COMM', kind: 'ETF' },
  { ticker: '130680', name: 'TIGER 원유선물Enhanced(H)', theme: 'GOLD_COMM', kind: 'ETF' },
  { ticker: '261220', name: 'KODEX WTI원유선물(H)', theme: 'GOLD_COMM', kind: 'ETF' },
  // DIVIDEND — 배당 (4)
  { ticker: '211560', name: 'TIGER 배당성장', theme: 'DIVIDEND', kind: 'ETF' },
  { ticker: '279530', name: 'KODEX 고배당', theme: 'DIVIDEND', kind: 'ETF' },
  { ticker: '161510', name: 'ARIRANG 고배당주', theme: 'DIVIDEND', kind: 'ETF' },
  { ticker: '104530', name: 'KOSEF 고배당', theme: 'DIVIDEND', kind: 'ETF' },
];

// 축별 대표 종목 (P0-11 검증, 화면 대표 표시용) = 각 축의 첫 종목
export const REPRESENTATIVE: Record<ThemeCode, string> = {
  KR_LARGE: '005930',
  KR_THEME: '091160',
  US_INDEX: '360750',
  BOND_CASH: '157450',
  GOLD_COMM: '132030',
  DIVIDEND: '211560',
};

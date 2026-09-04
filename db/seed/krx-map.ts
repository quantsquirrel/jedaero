// 6전선 → 한국 상장 지수/ETF 코드. 화면에는 screenName만. 상품명 주석은 여기만.
// 6개가 닫히기 전에 런타임 pricesUpTo 를 이 맵으로 바꾸지 말 것.
import { REPRESENTATIVE } from './tickers';
import type { ThemeCode } from '../../lib/constants';

export type KrxMapRow = {
  theme: ThemeCode;
  internal: string;
  krxCode: string;
  screenName: string;
};

export const KRX_MAP: readonly KrxMapRow[] = [
  // 069500 — KODEX 200 (주석만, 화면 금지)
  { theme: 'KR_STOCK', internal: REPRESENTATIVE.KR_STOCK, krxCode: '069500', screenName: '국내 대표지수' },
  // 379800 — KODEX 미국S&P500 (주석만, 화면 금지)
  { theme: 'US_STOCK', internal: REPRESENTATIVE.US_STOCK, krxCode: '379800', screenName: '미국 대표지수' },
  // 278240 — KODEX MSCI Emerging Markets (주석만, 화면 금지)
  { theme: 'INTL_STOCK', internal: REPRESENTATIVE.INTL_STOCK, krxCode: '278240', screenName: '신흥국 종합지수' },
  // 114260 — KODEX 국고채3년 (주석만, 화면 금지)
  { theme: 'BOND', internal: REPRESENTATIVE.BOND, krxCode: '114260', screenName: '종합채권 지수' },
  // 132030 — KODEX 골드선물 (주석만, 화면 금지)
  { theme: 'GOLD_COMM', internal: REPRESENTATIVE.GOLD_COMM, krxCode: '132030', screenName: '원자재 종합지수' },
  // 395160 — KODEX 리츠 (주석만, 화면 금지)
  { theme: 'REIT_INFRA', internal: REPRESENTATIVE.REIT_INFRA, krxCode: '395160', screenName: '리츠 종합지수' },
];

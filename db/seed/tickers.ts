// 지수 시드 36종 (DESIGN-DECISIONS §11-A)
// ★ 개별 종목명·운용사 상품명을 쓰지 않는다. 전부 「지수(바스켓)」 수준이다 (C10).
//   같은 섹터에 여러 운용사 상품이 있는데 하나를 골라 표시하는 것 자체가 특정 상품 지목이 된다.
//   화면 문구는 복수형으로 — "이런 지수를 따라가는 ETF가 여러 운용사에서 나와 있습니다."
// ⚠️ 가격은 전부 합성 더미 데이터이며 실제 지수와 무관하다 (scripts/generate-prices.ts).
// 구조: 전선마다 대표지수 1종 + 하위 테마 N종.
//   하위를 건드리지 않으면 그 전선은 대표지수를 그대로 추종한다 (lib/portfolio/engine.ts).
import type { ThemeCode } from '../../lib/constants';

export type TickerSeed = {
  ticker: string;
  name: string;
  theme: ThemeCode;
  kind: 'INDEX' | 'THEME'; // INDEX = 전선 대표지수, THEME = 하위 테마
};

export const TICKERS: TickerSeed[] = [
  // 국내 주식 — 대표 + 하위 7
  { ticker: 'KR-IDX', name: '국내 대표지수', theme: 'KR_STOCK', kind: 'INDEX' },
  { ticker: 'KR-SEMI', name: '국내 반도체 지수', theme: 'KR_STOCK', kind: 'THEME' },
  { ticker: 'KR-BATT', name: '국내 2차전지 지수', theme: 'KR_STOCK', kind: 'THEME' },
  { ticker: 'KR-BIO', name: '국내 바이오·헬스케어 지수', theme: 'KR_STOCK', kind: 'THEME' },
  { ticker: 'KR-FIN', name: '국내 금융 지수', theme: 'KR_STOCK', kind: 'THEME' },
  { ticker: 'KR-INDU', name: '국내 산업재 지수 (조선·기계·방산)', theme: 'KR_STOCK', kind: 'THEME' },
  { ticker: 'KR-AUTO', name: '국내 자동차 지수', theme: 'KR_STOCK', kind: 'THEME' },
  { ticker: 'KR-NET', name: '국내 인터넷·게임 지수', theme: 'KR_STOCK', kind: 'THEME' },

  // 미국 주식 — 대표 + 하위 8
  { ticker: 'US-IDX', name: '미국 대표지수 (S&P500)', theme: 'US_STOCK', kind: 'INDEX' },
  { ticker: 'US-TECH', name: '미국 빅테크·AI 지수', theme: 'US_STOCK', kind: 'THEME' },
  { ticker: 'US-SEMI', name: '미국 반도체 지수', theme: 'US_STOCK', kind: 'THEME' },
  { ticker: 'US-HLTH', name: '미국 헬스케어 지수', theme: 'US_STOCK', kind: 'THEME' },
  { ticker: 'US-FIN', name: '미국 금융 지수', theme: 'US_STOCK', kind: 'THEME' },
  { ticker: 'US-CONS', name: '미국 소비재 지수', theme: 'US_STOCK', kind: 'THEME' },
  { ticker: 'US-ENGY', name: '미국 에너지 지수', theme: 'US_STOCK', kind: 'THEME' },
  { ticker: 'US-DIV', name: '미국 배당 지수', theme: 'US_STOCK', kind: 'THEME' },

  // 기타 해외 — 대표 + 하위 4
  { ticker: 'IN-IDX', name: '신흥국 종합지수', theme: 'INTL_STOCK', kind: 'INDEX' },
  { ticker: 'IN-JP', name: '일본 대표지수', theme: 'INTL_STOCK', kind: 'THEME' },
  { ticker: 'IN-EU', name: '유럽 대표지수', theme: 'INTL_STOCK', kind: 'THEME' },
  { ticker: 'IN-CN', name: '중국 대표지수', theme: 'INTL_STOCK', kind: 'THEME' },
  { ticker: 'IN-IN', name: '인도 대표지수', theme: 'INTL_STOCK', kind: 'THEME' },

  // 채권 — 대표 + 하위 4
  { ticker: 'BD-IDX', name: '종합채권 지수', theme: 'BOND', kind: 'INDEX' },
  { ticker: 'BD-KTB3', name: '국고채 3년 지수', theme: 'BOND', kind: 'THEME' },
  { ticker: 'BD-KTB10', name: '국고채 10년 지수', theme: 'BOND', kind: 'THEME' },
  { ticker: 'BD-CORP', name: '회사채 지수', theme: 'BOND', kind: 'THEME' },
  { ticker: 'BD-UST', name: '미국채 지수', theme: 'BOND', kind: 'THEME' },

  // 금·원자재 — 대표 + 하위 4
  { ticker: 'CM-IDX', name: '원자재 종합지수', theme: 'GOLD_COMM', kind: 'INDEX' },
  { ticker: 'CM-GOLD', name: '금 지수', theme: 'GOLD_COMM', kind: 'THEME' },
  { ticker: 'CM-SILV', name: '은 지수', theme: 'GOLD_COMM', kind: 'THEME' },
  { ticker: 'CM-OIL', name: '원유·에너지 지수', theme: 'GOLD_COMM', kind: 'THEME' },
  { ticker: 'CM-AGRI', name: '농산물 지수', theme: 'GOLD_COMM', kind: 'THEME' },

  // 리츠·인프라 — 대표 + 하위 3
  { ticker: 'RE-IDX', name: '리츠 종합지수', theme: 'REIT_INFRA', kind: 'INDEX' },
  { ticker: 'RE-KR', name: '국내 리츠 지수', theme: 'REIT_INFRA', kind: 'THEME' },
  { ticker: 'RE-US', name: '미국 리츠 지수', theme: 'REIT_INFRA', kind: 'THEME' },
  { ticker: 'RE-DC', name: '데이터센터·전력 지수', theme: 'REIT_INFRA', kind: 'THEME' },
];

// 전선 대표지수 = 하위 테마를 건드리지 않았을 때의 기본 편성 대상.
// 전선 등락률(lib/market-week.ts)과 가격 시드 제약(scripts/generate-prices.ts)의 기준이기도 하다.
export const REPRESENTATIVE: Record<ThemeCode, string> = {
  KR_STOCK: 'KR-IDX',
  US_STOCK: 'US-IDX',
  INTL_STOCK: 'IN-IDX',
  BOND: 'BD-IDX',
  GOLD_COMM: 'CM-IDX',
  REIT_INFRA: 'RE-IDX',
};

/** 전선별 하위 테마 (대표지수 제외). 하위 조정 UI가 여는 목록 */
export const SUB_THEMES: Record<ThemeCode, TickerSeed[]> = Object.fromEntries(
  (Object.keys(REPRESENTATIVE) as ThemeCode[]).map((code) => [
    code,
    TICKERS.filter((t) => t.theme === code && t.kind === 'THEME'),
  ]),
) as Record<ThemeCode, TickerSeed[]>;

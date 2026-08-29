// ★ 부대 관련 컬럼이 하나도 없다는 점이 이 스키마의 핵심이다. 절대 추가하지 말 것. (C4)
// ★ holdings 테이블·cash_balance 컬럼 없음 — 보유수량은 (비중 이력 × 일별 종가 × 현금흐름)으로
//   요청 시점에 계산한다. 현금은 BOND_CASH 축 비중으로 표현된다.
// 논리 스키마 원본: SPEC.md §2 (테이블 15개 + 승인된 추가 1개 = 16개)
import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  timestamp,
  integer,
  jsonb,
  real,
  unique,
  primaryKey,
} from 'drizzle-orm/pg-core';

// 익명 세션 기반 사용자. 회원가입 없음.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  nickname: text('nickname').notNull(), // 실명 입력 금지 안내
  rank: text('rank').notNull(), // PRIVATE|PFC|CORPORAL|SERGEANT
  branch: text('branch').notNull(), // ARMY|NAVY|AIRFORCE|MARINE (복무기간 산정용)
  enlistedAt: date('enlisted_at').notNull(),
  dischargeAt: date('discharge_at').notNull(), // 동기 코호트 키
  homeDistance: text('home_distance').notNull(), // NEAR|MID|FAR|ISLAND (주소 원문 저장 금지)
  analyticsOptIn: boolean('analytics_opt_in').notNull().default(false), // AI-7 옵트인
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ★ 사용자가 조작하는 유일한 대상: 주차별 목표 비중 이력
export const allocations = pgTable(
  'allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    weekOf: text('week_of').notNull(), // YYYY-WW (ISO 주, KST)
    weights: jsonb('weights').notNull(), // {"KR_LARGE":30,"US_INDEX":40,...} 합계 100
    details: jsonb('details'), // 하위 비중(2축만). NULL이면 동일가중
    templateId: text('template_id'), // 예시 포트폴리오에서 시작했으면 그 id
    decidedAt: timestamp('decided_at', { withTimezone: true }).notNull(),
    effectiveFrom: date('effective_from').notNull(), // 체결 기준일 = 다음 거래일
  },
  (t) => [
    // ★ 주 1회 + 수정 불가를 DB가 강제
    unique('allocations_user_id_week_of_unique').on(t.userId, t.weekOf),
  ],
);

// 지출·예산
export const budgetMonths = pgTable(
  'budget_months',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    yearMonth: text('year_month').notNull(), // YYYY-MM
    baseSalary: integer('base_salary').notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }), // NULL 아니면 수정 불가
  },
  (t) => [unique('budget_months_user_id_year_month_unique').on(t.userId, t.yearMonth)],
);

export const budgetEnvelopes = pgTable('budget_envelopes', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetMonthId: uuid('budget_month_id').notNull(),
  category: text('category').notNull(),
  allocated: integer('allocated').notNull(),
  spent: integer('spent').notNull().default(0),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  occurredOn: date('occurred_on').notNull(),
  amount: integer('amount').notNull(), // 원 단위 정수
  memo: text('memo'),
  tier: text('tier').notNull().default('UNCLASSIFIED'), // A|B|C|UNCLASSIFIED
  category: text('category'),
  aiSuggestedTier: text('ai_suggested_tier'),
  aiConfidence: real('ai_confidence'),
  confirmedByUser: boolean('confirmed_by_user').notNull().default(false), // false면 tier 미반영
});

export const exemptionClaims = pgTable('exemption_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  yearQuarter: text('year_quarter').notNull(), // YYYY-Q. 분기 1회 제한 키
  type: text('type').notNull(), // TRANSPORT|MEDICAL|FAMILY_EMERGENCY
  amount: integer('amount').notNull(),
  reason: text('reason'), // 자유서술. 검증하지 않음
  capApplied: integer('cap_applied').notNull(),
});

// 위클리 퀘스트
export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  xp: integer('xp').notNull(),
  badge: text('badge'),
});

export const questProgress = pgTable(
  'quest_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    questId: uuid('quest_id').notNull(),
    weekOf: text('week_of').notNull(),
    progress: integer('progress').notNull().default(0),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [unique('quest_progress_user_quest_week_unique').on(t.userId, t.questId, t.weekOf)],
);

// 그룹
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // AI-5 필터 통과분만
  inviteCode: text('invite_code').unique().notNull(), // 6자리
  ownerId: uuid('owner_id').notNull(),
  memberLimit: integer('member_limit').notNull().default(30),
});

export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  userId: uuid('user_id').notNull(),
});

// 주간 집계 (랭킹용) — 요청 시점 lazy upsert. 크론 없음
export const weeklyScores = pgTable('weekly_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  weekOf: text('week_of').notNull(),
  twrPct: real('twr_pct'), // 전역(일시금) 곡선 시간가중수익률 (비교용)
  budgetAccuracy: real('budget_accuracy'), // 예산 준수율 0~1 (비교용)
  xp: integer('xp'),
});

// 종목 마스터 + 일별 종가 (사전 시드. 더미 데이터이며 실제 시세와 무관)
export const tickers = pgTable('tickers', {
  ticker: text('ticker').primaryKey(),
  name: text('name').notNull(),
  theme: text('theme').notNull(), // KR_LARGE|KR_THEME|US_INDEX|BOND_CASH|GOLD_COMM|DIVIDEND
  kind: text('kind').notNull(), // STOCK|ETF
});

export const prices = pgTable(
  'prices',
  {
    ticker: text('ticker').notNull(),
    tradeDate: date('trade_date').notNull(),
    close: integer('close').notNull(), // 원 단위 정수. 부동소수 금지
  },
  (t) => [primaryKey({ columns: [t.ticker, t.tradeDate] })],
);

// 공휴일 (요일 판정용). 2026~2027 대한민국 공휴일 시드
export const holidays = pgTable('holidays', {
  holidayDate: date('holiday_date').primaryKey(),
  name: text('name').notNull(),
});

// 관리자 킬스위치 등 설정
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // settings('ai_enabled', 'true'|'false')
});

// AI 호출 로그 겸 rate limit 카운터 (승인된 16번째 테이블)
// 분당·일당 제한은 요청 시점에 created_at 윈도우 count로 판정한다. 크론 없음
export const aiCalls = pgTable('ai_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  kind: text('kind').notNull(), // AI-1|AI-3|AI-4|AI-5|AI-7
  blocked: boolean('blocked').notNull().default(false), // 인젝션·rate limit 차단 여부
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

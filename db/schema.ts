// ★ 부대 관련 컬럼이 하나도 없다는 점이 이 스키마의 핵심이다. 절대 추가하지 말 것. (C4)
// ★ holdings 테이블·cash_balance 컬럼 없음 — 보유수량은 (비중 이력 × 일별 종가 × 현금흐름)으로
//   요청 시점에 계산한다. 현금은 예비대(미배치 포인트)로 표현된다 — 축이 아니라 잔여다.
// 논리 스키마 원본: SPEC.md §2. 테이블 11개 (ai_calls·drafts 포함). 가계부·퀘스트 테이블 없음.
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
  dischargeAt: date('discharge_at').notNull(),
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
    weights: jsonb('weights').notNull(), // {"KR_STOCK":20,"US_STOCK":40,...} 5의 배수, 합계 100 이하(나머지=예비대)
    details: jsonb('details'), // 하위 테마 비중(주식 2전선만). NULL이면 그 전선의 대표지수 추종
    templateId: text('template_id'), // 예시 작전에서 시작했으면 그 id (OPERATIONS)
    decidedAt: timestamp('decided_at', { withTimezone: true }).notNull(),
    effectiveFrom: date('effective_from').notNull(), // 체결 기준일 = 다음 거래일
  },
  (t) => [
    // ★ 주 1회 + 수정 불가를 DB가 강제
    unique('allocations_user_id_week_of_unique').on(t.userId, t.weekOf),
  ],
);

// 평일 명령하달 초안. allocations 가 아니다. 안 적은 주가 정상. 반쪽 UI는 넣지 않음.
export const drafts = pgTable(
  'drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    weekOf: text('week_of').notNull(),
    weights: jsonb('weights').notNull(), // 의도 목표 비중. 현재 편성 대비가 아니라 목표 그 자체
    note: text('note'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('drafts_user_id_week_of_unique').on(t.userId, t.weekOf)],
);

// 가계부(지출·봉투 예산·면제 청구)는 제거됐다 (DESIGN-DECISIONS §9 → 완전 제외).
// budget_months / budget_envelopes / expenses / exemption_claims 테이블을 되살리지 말 것.
// 투자 파트와의 접합이 약했고, 지출 분류가 서비스의 초점을 흐렸다.

// 퀘스트·XP는 제거됐다 (DESIGN-DECISIONS §7).
// 빈도를 늘리는 게임화는 이 서비스가 가르치려는 것(주 1회·오래 버티기)과 정면으로 어긋난다.
// quests / quest_progress 테이블을 되살리지 말 것.

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

// 주간 집계 (제대로 지수) — 요청 시점 lazy upsert. 크론 없음
// 세 축을 따로 저장한다. 총점만 두면 화면에서 "왜 이 점수인가"를 보여줄 수 없다.
export const weeklyScores = pgTable('weekly_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  weekOf: text('week_of').notNull(),
  grown: real('grown'), // 불린 만큼 (40점 만점)
  spread: real('spread'), // 나눠 담은 만큼 (30점 만점)
  held: real('held'), // 버틴 만큼 (30점 만점)
  total: real('total'), // 제대로 지수 (100점 만점)
});

// 종목 마스터 + 일별 종가 (사전 시드. 더미 데이터이며 실제 시세와 무관)
export const tickers = pgTable('tickers', {
  ticker: text('ticker').primaryKey(),
  name: text('name').notNull(),
  theme: text('theme').notNull(), // KR_STOCK|US_STOCK|INTL_STOCK|BOND|GOLD_COMM|REIT_INFRA
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
  kind: text('kind').notNull(), // AI-3|AI-4|AI-5|AI-7
  blocked: boolean('blocked').notNull().default(false), // 인젝션·rate limit 차단 여부
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

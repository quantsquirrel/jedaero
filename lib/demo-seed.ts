// /demo 진입 시 주입되는 체험용 데이터 (SPEC §7, docs/SEED.md §8)
// - 12주치 비중 변경 이력 (조정하지 않은 주 4주 포함 — 행이 없는 주가 곧 "유지")
// - 3개월치 지출 (A/B/C 골고루 + 미확정 3건)
// 리그·성향분석용 더미 사용자 200명은 3단계(리그·인사이트 구현)에서 전역 시드로 추가한다.
import { db } from '../db';
import {
  allocations,
  budgetEnvelopes,
  budgetMonths,
  exemptionClaims,
  expenses,
  users,
} from '../db/schema';
import { addDays, mondayOfWeeksAgo, weekOfDateStr } from './week';
import { nextTradingDay } from './portfolio/prices';
import { SALARY_2026, TRANSPORT_CAP } from './constants';
import { ACTIVE_WEIGHT_STORY } from './demo-story';

const NICKNAMES = ['해뜰날', '강철비', '초코우유', '별헤는밤', '든든적금', '월급지킴이'];

// 지출 3개월치: [일수 전, 금액, 메모, tier, 확정 여부, AI 제안, 신뢰도]
type DemoExpense = [number, number, string, string, boolean, string | null, number | null];
const EXPENSES: DemoExpense[] = [
  // 이번 달 — 미확정 3건 포함 (심사자가 확정 버튼을 눌러볼 수 있게)
  [1, 4500, 'PX 초코바·음료', 'UNCLASSIFIED', false, 'C', 0.93],
  [2, 28000, '외박 왕복 시외버스', 'UNCLASSIFIED', false, 'A', 0.86],
  [4, 30000, '모임', 'UNCLASSIFIED', false, 'B', 0.52],
  [3, 45000, '통신비 자동이체', 'B', true, 'B', 0.97],
  [6, 12000, '이발', 'B', true, 'B', 0.95],
  [8, 3800, 'PX 과자', 'C', true, 'C', 0.94],
  [10, 24000, '치킨 배달', 'C', true, 'C', 0.96],
  [12, 15000, '세면도구·생필품', 'B', true, 'B', 0.9],
  [14, 86000, '정기휴가 왕복 KTX', 'A', true, 'A', 0.95],
  [16, 9900, '게임 결제', 'C', true, 'C', 0.97],
  [18, 5500, 'PX 음료수', 'C', true, 'C', 0.93],
  [21, 32000, '휴가 중 식사', 'B', true, 'B', 0.71],
  [24, 40000, '안경 렌즈 교체', 'A', true, 'A', 0.88],
  // 지난달
  [33, 45000, '통신비 자동이체', 'B', true, 'B', 0.97],
  [35, 12000, '이발', 'B', true, 'B', 0.95],
  [37, 6200, 'PX 간식', 'C', true, 'C', 0.94],
  [40, 19000, '피자 배달', 'C', true, 'C', 0.96],
  [43, 22000, '자기계발 도서', 'B', true, 'B', 0.85],
  [46, 78000, '휴가 왕복 고속버스', 'A', true, 'A', 0.9],
  [49, 30000, '친구 생일 선물', 'C', true, 'C', 0.89],
  [52, 8900, '화장품', 'B', true, 'B', 0.82],
  [55, 4200, 'PX 아이스크림', 'C', true, 'C', 0.95],
  [58, 12000, '처방약', 'A', true, 'A', 0.87],
  // 지지난달
  [63, 45000, '통신비 자동이체', 'B', true, 'B', 0.97],
  [66, 12000, '이발', 'B', true, 'B', 0.95],
  [69, 15500, '외박 식비', 'B', true, 'B', 0.8],
  [72, 5000, 'PX 컵라면·간식', 'C', true, 'C', 0.94],
  [76, 27000, '운동화 깔창·양말', 'B', true, 'B', 0.74],
  [80, 13900, '게임 결제', 'C', true, 'C', 0.97],
  [84, 3600, 'PX 과자', 'C', true, 'C', 0.94],
];

export async function createDemoUser(now: Date = new Date()): Promise<{ id: string }> {
  const todayK = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
  const nickname = `${NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]}${Math.floor(10 + Math.random() * 90)}`;

  const [user] = await db
    .insert(users)
    .values({
      nickname,
      rank: 'CORPORAL',
      branch: 'ARMY',
      enlistedAt: addDays(todayK, -430), // 약 14개월차
      dischargeAt: addDays(todayK, 120), // 전역 D-120
      homeDistance: 'FAR', // 왕복 상한 90,000원 — 시나리오 11(KTX 86,000)이 상한 내 면제
      // analytics_opt_in은 기본 false로 시작 — 시나리오 15(옵트인 동의 화면)를 시연하기 위해
    })
    .returning({ id: users.id });

  // 12주치 비중 이력 (스킵 주 2주는 행 없음 = 직전 비중 유지)
  const allocRows = ACTIVE_WEIGHT_STORY.map((w) => {
    const monday = mondayOfWeeksAgo(now, w.weeksAgo);
    const sunday = addDays(monday, 6);
    const decidedAt = new Date(`${sunday}T11:00:00Z`); // 일요일 20:00 KST
    return {
      userId: user.id,
      weekOf: weekOfDateStr(monday),
      weights: w.weights,
      details: null,
      templateId: w.templateId ?? null,
      decidedAt,
      effectiveFrom: nextTradingDay(sunday) ?? addDays(sunday, 1),
    };
  });
  await db.insert(allocations).values(allocRows);

  await db.insert(expenses).values(
    EXPENSES.map(([daysAgo, amount, memo, tier, confirmed, aiTier, aiConf]) => ({
      userId: user.id,
      occurredOn: addDays(todayK, -daysAgo),
      amount,
      memo,
      tier,
      category: null,
      aiSuggestedTier: aiTier,
      aiConfidence: aiConf,
      confirmedByUser: confirmed,
    })),
  );

  // 예산 봉투: 확정(잠금)된 이번 달 + 미확정 다음 달 (docs/SEED.md §8)
  const thisMonth = todayK.slice(0, 7);
  const nextDate = new Date(`${thisMonth}-01T00:00:00Z`);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  const nextMonth = nextDate.toISOString().slice(0, 7);
  const salary = SALARY_2026.CORPORAL;
  const [lockedMonth] = await db
    .insert(budgetMonths)
    .values({ userId: user.id, yearMonth: thisMonth, baseSalary: salary, lockedAt: now })
    .returning({ id: budgetMonths.id });
  await db.insert(budgetEnvelopes).values([
    { budgetMonthId: lockedMonth.id, category: '통신비', allocated: 45_000 },
    { budgetMonthId: lockedMonth.id, category: '생필품', allocated: 40_000 },
    { budgetMonthId: lockedMonth.id, category: '외박 식비', allocated: 60_000 },
    { budgetMonthId: lockedMonth.id, category: '이발', allocated: 12_000 },
    { budgetMonthId: lockedMonth.id, category: '자기계발', allocated: 30_000 },
  ]);
  const [openMonth] = await db
    .insert(budgetMonths)
    .values({ userId: user.id, yearMonth: nextMonth, baseSalary: salary, lockedAt: null })
    .returning({ id: budgetMonths.id });
  await db.insert(budgetEnvelopes).values([
    { budgetMonthId: openMonth.id, category: '통신비', allocated: 45_000 },
    { budgetMonthId: openMonth.id, category: '생필품', allocated: 35_000 },
  ]);

  // A계층 면제 내역: 확정된 정기휴가 KTX 86,000원 — FAR 상한(90,000) 내 전액 면제
  const quarter = `${todayK.slice(0, 4)}-${Math.ceil(Number(todayK.slice(5, 7)) / 3)}`;
  await db.insert(exemptionClaims).values({
    userId: user.id,
    yearQuarter: quarter,
    type: 'TRANSPORT',
    amount: 86_000,
    reason: '정기휴가 왕복 KTX',
    capApplied: Math.min(86_000, TRANSPORT_CAP.FAR),
  });

  return user;
}

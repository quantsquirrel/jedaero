// AI-6: 이상 패턴 → 상담 연결 (SPEC §4)
// ★ 차단이 아니라 연결이다. 면제 청구 반복은 조작일 수도 있지만 도박 채무를 상환 중인 신호일 수도 있다.
//   계정을 막으면 그 사람은 떠날 뿐 문제는 해결되지 않는다. 그래서 이 모듈은 아무것도 막지 않는다.
// ★ 판정은 규칙 기반이다. 생성형 AI가 아니므로 UI에 고지 배지를 붙이지 않고 "규칙 기반"으로 표기한다 (C9).
//   취약한 상황일 수 있는 사람에게 LLM이 즉흥적으로 문장을 만들게 두지 않는다 — 문구는 고정한다.
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { exemptionClaims } from '../db/schema';

// ⚠️ 제출 전 대표번호·운영시간을 반드시 재확인할 것.
export const SUPPORT_CHANNELS = [
  {
    name: '금융감독원 금융상담',
    contact: '1332',
    note: '빚·연체·금융사기 등 금융 문제 전반. 무료·익명 상담',
  },
  {
    name: '국방헬프콜',
    contact: '1303',
    note: '군 생활 고충 상담. 24시간',
  },
] as const;

export type SupportLevel = 'STANDING' | 'ELEVATED';

export type SupportSignal = {
  level: SupportLevel;
  /** 어떤 관찰이 근거였는지. ELEVATED일 때만 채워진다. 사용자에게 그대로 보여준다 — 숨기지 않는다 */
  reasons: string[];
  quarterClaims: number;
  overCapClaims: number;
};

// 판정 기준. 값을 바꿀 때는 "차단이 아니라 연결"이라는 전제를 유지할 것
const QUARTER_CLAIM_THRESHOLD = 4; // 한 분기 면제 청구 건수
const OVER_CAP_THRESHOLD = 2; // 상한을 넘겨 초과분이 B로 편입된 횟수
const NON_TRANSPORT_THRESHOLD = 2; // 교통비 외(의료·경조사) 청구 건수

/** 이번 분기 면제 청구 패턴을 본다. 어떤 경우에도 기능을 잠그지 않는다. */
export async function detectSupportSignal(userId: string, yearQuarter: string): Promise<SupportSignal> {
  const claims = await db
    .select({
      type: exemptionClaims.type,
      amount: exemptionClaims.amount,
      capApplied: exemptionClaims.capApplied,
    })
    .from(exemptionClaims)
    .where(and(eq(exemptionClaims.userId, userId), eq(exemptionClaims.yearQuarter, yearQuarter)));

  const overCapClaims = claims.filter((c) => c.amount > c.capApplied).length;
  const nonTransport = claims.filter((c) => c.type !== 'TRANSPORT').length;

  const reasons: string[] = [];
  if (claims.length >= QUARTER_CLAIM_THRESHOLD)
    reasons.push(`이번 분기 면제 인정 요청이 ${claims.length}건입니다.`);
  if (overCapClaims >= OVER_CAP_THRESHOLD)
    reasons.push(`상한을 넘겨 초과분이 B로 넘어간 건이 ${overCapClaims}건입니다.`);
  if (nonTransport >= NON_TRANSPORT_THRESHOLD)
    reasons.push(`교통비 외 사유(의료·경조사) 요청이 ${nonTransport}건입니다.`);

  return {
    level: reasons.length > 0 ? 'ELEVATED' : 'STANDING',
    reasons,
    quarterClaims: claims.length,
    overCapClaims,
  };
}

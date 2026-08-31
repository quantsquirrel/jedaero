'use server';
// 온보딩 (S2): 계급·군종·복무 기간·거리 → 시드 지급 → 예시 포트폴리오 선택
// 최초 배분은 "조정"이 아니라 "시작"이므로 요일 제한을 적용하지 않는다.
// 단, week_of는 현재 주로 기록되어 주 1회 규칙에 그대로 편입된다.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '../../db';
import { allocations, users } from '../../db/schema';
import { PORTFOLIO_TEMPLATES, SALARY_2026, TRANSPORT_CAP } from '../../lib/constants';
import { kstToday } from '../../lib/day-type';
import { nextTradingDay } from '../../lib/portfolio/prices';
import { USER_COOKIE, userCookieOptions } from '../../lib/session';
import { weekOf } from '../../lib/week';

export type OnboardingState = { error?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const nickname = String(formData.get('nickname') ?? '').trim();
  const rank = String(formData.get('rank') ?? '');
  const branch = String(formData.get('branch') ?? '');
  const enlistedAt = String(formData.get('enlistedAt') ?? '');
  const dischargeAt = String(formData.get('dischargeAt') ?? '');
  const homeDistance = String(formData.get('homeDistance') ?? '');
  const templateId = String(formData.get('templateId') ?? '');
  // "이 배분을 고른 이유 한 줄"은 선택 입력이며 저장하지 않는다 (스키마에 컬럼 없음)

  if (nickname.length < 1 || nickname.length > 12) return { error: '별명은 1~12자로 입력해주세요.' };
  if (!(rank in SALARY_2026)) return { error: '계급을 선택해주세요.' };
  if (!['ARMY', 'NAVY', 'AIRFORCE', 'MARINE'].includes(branch)) return { error: '군종을 선택해주세요.' };
  if (!(homeDistance in TRANSPORT_CAP)) return { error: '집까지 거리를 선택해주세요.' };
  if (!DATE_RE.test(enlistedAt) || !DATE_RE.test(dischargeAt)) return { error: '입대일과 전역 예정일을 입력해주세요.' };
  if (dischargeAt <= enlistedAt) return { error: '전역 예정일이 입대일보다 빨라요.' };
  const template = PORTFOLIO_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return { error: '예시 포트폴리오를 선택해주세요.' };

  const today = kstToday();
  const effectiveFrom = nextTradingDay(today);
  if (!effectiveFrom) return { error: '체결 가능한 거래일이 없습니다. 관리자에게 알려주세요.' };

  const [user] = await db
    .insert(users)
    .values({ nickname, rank, branch, enlistedAt, dischargeAt, homeDistance })
    .returning({ id: users.id });

  await db.insert(allocations).values({
    userId: user.id,
    weekOf: weekOf(new Date()),
    weights: template.weights,
    details: null,
    templateId: template.id,
    decidedAt: new Date(),
    effectiveFrom,
  });

  const store = await cookies();
  store.set(USER_COOKIE, user.id, userCookieOptions);
  redirect('/home');
}

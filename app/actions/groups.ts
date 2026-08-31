'use server';
// 그룹 생성·참여 — 그룹명은 AI-5 필터(정규식 1차 + 의심 케이스 LLM 2차)를 통과해야 한다
import { revalidatePath } from 'next/cache';
import { guardedAiCall } from '../../lib/ai/guard';
import { llmUnitGuard } from '../../lib/ai/unit-guard';
import { checkGroupName } from '../../lib/filters/unit-filter';
import { createGroup, joinGroup } from '../../lib/groups';
import { getSessionUser } from '../../lib/session';

export type GroupFormState = { error?: string; ok?: boolean };

export async function createGroupAction(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const name = String(formData.get('name') ?? '').trim();
  const check = checkGroupName(name);
  if (check.blocked) return { error: check.reason ?? '사용할 수 없는 그룹명입니다.' };

  // 정규식 1차 통과분 중 의심 케이스만 LLM 2차 가드
  if (check.suspicious) {
    const guard = await guardedAiCall(user.id, 'AI-5', () => llmUnitGuard(name));
    if ('ok' in guard && guard.ok.blocked) {
      return { error: '부대 식별 정보는 입력하실 수 없습니다.' };
    }
  }

  const result = await createGroup(user.id, name);
  if ('error' in result) return { error: result.error };
  revalidatePath('/groups');
  return { ok: true };
}

export async function joinGroupAction(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const code = String(formData.get('code') ?? '');
  if (!/^[A-Za-z0-9]{6}$/.test(code.trim())) return { error: '초대코드는 6자리입니다.' };

  const result = await joinGroup(user.id, code);
  if ('error' in result) return { error: result.error };
  revalidatePath('/groups');
  return { ok: true };
}

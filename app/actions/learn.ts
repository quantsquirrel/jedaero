'use server';
// 학습 카드 완료(LEARN_1) + 주말 한 줄 회고(REVIEW_1)
// 회고 입력은 LLM 파이프라인과 동일한 입력 필터를 통과해야 한다 (SPEC §5, 시나리오 17).
import { revalidatePath } from 'next/cache';
import { recordAiCall } from '../../lib/ai/guard';
import { detectInjection } from '../../lib/filters/injection-filter';
import { bumpQuest } from '../../lib/quests';
import { getSessionUser } from '../../lib/session';

export async function completeLearnCard(): Promise<{ error?: string; ok?: boolean }> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  await bumpQuest(user.id, 'LEARN_1', 1);
  revalidatePath('/learn');
  revalidatePath('/home');
  return { ok: true };
}

export type ReviewState = { error?: string; ok?: boolean };

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };

  const text = String(formData.get('text') ?? '').trim();
  if (text.length < 2 || text.length > 200) return { error: '회고는 2~200자로 적어주세요.' };

  // 입력 필터: 인젝션·개인정보·부대정보 차단. 차단 사유·입력 내용을 되풀이하지 않는다.
  const check = detectInjection(text);
  if (check.blocked) {
    await recordAiCall(user.id, 'AI-3', true);
    return { error: '요청을 처리할 수 없습니다. 입력에 허용되지 않는 패턴이 포함되어 있습니다.' };
  }

  // 회고 텍스트는 저장하지 않는다 (스키마에 저장 컬럼 없음). 퀘스트 완료만 기록.
  await bumpQuest(user.id, 'REVIEW_1', 1);
  revalidatePath('/learn');
  revalidatePath('/home');
  return { ok: true };
}

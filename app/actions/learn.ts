'use server';
// 학습 카드 완료 + 주말 한 줄 회고 + AI-3 되묻기
// 회고 입력은 LLM 파이프라인과 동일한 입력 필터를 통과해야 한다 (SPEC §5, 시나리오 17).
import { revalidatePath } from 'next/cache';
import { generateReflection, reflectionFallback, type Reflection } from '../../lib/ai/reflect';
import { guardedAiCall, recordAiCall } from '../../lib/ai/guard';
import { detectInjection } from '../../lib/filters/injection-filter';
import { collectReviewFacts } from '../../lib/review-context';
import { getSessionUser } from '../../lib/session';

export async function completeLearnCard(): Promise<{ error?: string; ok?: boolean }> {
  const user = await getSessionUser();
  if (!user) return { error: '세션이 없습니다.' };
  revalidatePath('/learn');
  revalidatePath('/home');
  return { ok: true };
}

export type ReviewState = {
  error?: string;
  ok?: boolean;
  reflection?: Reflection;
  source?: 'ai' | 'rule';
  notice?: string;
};

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
  revalidatePath('/learn');
  revalidatePath('/home');

  // AI-3 되묻기 — 이번 주 사실은 규칙 기반으로 모으고, LLM은 질문 하나만 되돌려준다.
  // 실패해도 회고 자체는 이미 기록됐다. 되묻기는 규칙 기반 폴백으로 내려간다.
  const facts = await collectReviewFacts(user.id);
  const result = await guardedAiCall(user.id, 'AI-3', () => generateReflection(text, facts));
  if ('ok' in result) return { ok: true, reflection: result.ok, source: 'ai' };
  return { ok: true, reflection: reflectionFallback(facts), source: 'rule', notice: result.message };
}

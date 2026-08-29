// P1-13: rate limit(분당 5·일 50, 초과 시 429)·킬스위치(ai_enabled=false → 룰 기반 폴백)
// 함수·상수 존재를 자동 검사. 실제 429·폴백 동작은 심사자 시나리오 18에서 확인.
import { AI_RATE_LIMIT } from '../../lib/constants';

async function main() {
  let guard: Record<string, unknown>;
  let fallback: Record<string, unknown>;
  try {
    guard = await import('../../lib/ai/guard');
  } catch {
    console.log('lib/ai/guard.ts 미구현 (3단계)');
    process.exit(1);
  }
  try {
    fallback = await import('../../lib/ai/fallback');
  } catch {
    console.log('lib/ai/fallback.ts 미구현 (3단계)');
    process.exit(1);
  }
  if (AI_RATE_LIMIT.perMinute !== 5 || AI_RATE_LIMIT.perDay !== 50) {
    console.log(`rate limit 상수 ${JSON.stringify(AI_RATE_LIMIT)} (기대 5/분, 50/일)`);
    process.exit(1);
  }
  if (typeof guard.checkRateLimit !== 'function' || typeof guard.isAiEnabled !== 'function') {
    console.log('guard에 checkRateLimit/isAiEnabled 없음');
    process.exit(1);
  }
  if (typeof fallback.classifyExpenseFallback !== 'function') {
    console.log('룰 기반 폴백(classifyExpenseFallback) 없음');
    process.exit(1);
  }
  console.log('rate limit(5/분·50/일)·킬스위치·룰 기반 폴백 존재');
}
main();

// P1-13: rate limit(분당 5·일 50, 초과 시 429)·킬스위치(ai_enabled=false → 룰 기반 폴백)
// 함수·상수 존재를 자동 검사. 실제 429·폴백 동작은 심사자 시나리오 18에서 확인.
import { AI_RATE_LIMIT } from '../../lib/constants';

async function main() {
  // ★ import 실패를 「미구현」으로 뭉뚱그리지 않는다.
  //   lib/ai/guard.ts는 db를 import하므로 DATABASE_URL이 없으면 여기서 던진다.
  //   원인을 구분하지 않으면 환경 문제를 코드 문제로 오진하게 된다.
  const load = async (path: string, label: string): Promise<Record<string, unknown>> => {
    try {
      return await import(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/database connection string|DATABASE_URL/i.test(msg)) {
        console.log(`DATABASE_URL 없음 — ${label} 로드 불가 (코드 문제 아님)`);
      } else {
        console.log(`${label} 로드 실패: ${msg}`);
      }
      process.exit(1);
    }
  };
  const guard = await load('../../lib/ai/guard', 'lib/ai/guard.ts');
  // 지출 분류 폴백은 가계부와 함께 사라졌다. 남은 룰 기반 폴백은 회고 되묻기다.
  const fallback = await load('../../lib/ai/reflect', 'lib/ai/reflect.ts');
  if (AI_RATE_LIMIT.perMinute !== 5 || AI_RATE_LIMIT.perDay !== 50) {
    console.log(`rate limit 상수 ${JSON.stringify(AI_RATE_LIMIT)} (기대 5/분, 50/일)`);
    process.exit(1);
  }
  if (typeof guard.checkRateLimit !== 'function' || typeof guard.isAiEnabled !== 'function') {
    console.log('guard에 checkRateLimit/isAiEnabled 없음');
    process.exit(1);
  }
  if (typeof fallback.reflectionFallback !== 'function') {
    console.log('룰 기반 폴백(reflectionFallback) 없음');
    process.exit(1);
  }
  console.log('rate limit(5/분·50/일)·킬스위치·룰 기반 폴백 존재');
}
main();

// DB 오류를 화면에 올리지 않고 가른다. 스택·원문은 로그에만.
// reviews 가 아직 없는 배포에서 원칙 화면 전체를 죽이지 않기 위해 쓴다.

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message);
  return String(err);
}

function codeOf(err: unknown): string {
  if (typeof err === 'object' && err && 'code' in err) return String((err as { code: unknown }).code);
  return '';
}

/** Postgres 42P01 — 그 이름 테이블이 없을 때 */
export function isMissingRelation(err: unknown, table: string): boolean {
  if (codeOf(err) === '42P01' && messageOf(err).includes(table)) return true;
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`relation ["']?${escaped}["']? does not exist`, 'i').test(messageOf(err));
}

/** 테이블이 없으면 빈 목록. 다른 오류는 그대로 던진다. */
export async function reviewsOrEmpty<T>(run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch (err) {
    if (isMissingRelation(err, 'reviews')) {
      console.error('[reviews] 테이블이 없습니다. 복기 목록을 비웁니다.');
      return [];
    }
    throw err;
  }
}

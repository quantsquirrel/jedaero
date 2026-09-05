// 비교표 행 조립 + 갱신 경과 판정 (설계 문서 §4)
// ★ db를 import하지 않는다 — DATABASE_URL 없이 P1-25가 돌아야 한다.
// ★ 판정은 날짜 비교뿐이다. 네트워크가 없다. 요일 판정과 같은 규율 —
//   서버에서 판단하고 클라이언트 시계를 믿지 않는다.
import { BENCHMARKS, type Benchmark } from '../../db/seed/benchmarks';

export type BenchmarkRow = Benchmark & { stale: boolean };

/** todayStr은 kstToday()가 만드는 정규 YYYY-MM-DD 문자열이어야 한다. */
export function benchmarkRows(todayStr: string): BenchmarkRow[] {
  return BENCHMARKS.map((b) => ({ ...b, stale: todayStr > b.nextReviewAt }));
}

/** todayStr은 kstToday()가 만드는 정규 YYYY-MM-DD 문자열이어야 한다. */
export function staleBenchmarks(todayStr: string): BenchmarkRow[] {
  return benchmarkRows(todayStr).filter((b) => b.stale);
}

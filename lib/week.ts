// 주차 계산 — week_of는 ISO-8601 주(월~일, KST) "YYYY-WW"
const KST_OFFSET_MS = 9 * 3600_000;

function isoWeekOfUtcDate(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // 월=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // 그 주의 목요일
  const isoYear = date.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7,
    );
  return { year: isoYear, week };
}

/** 현재 시각(절대 instant)의 KST 기준 주차 */
export function weekOf(now: Date = new Date()): string {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  const { year, week } = isoWeekOfUtcDate(k);
  return `${year}-${String(week).padStart(2, '0')}`;
}

/** 날짜 문자열(YYYY-MM-DD)의 주차 */
export function weekOfDateStr(dateStr: string): string {
  const { year, week } = isoWeekOfUtcDate(new Date(`${dateStr}T00:00:00Z`));
  return `${year}-${String(week).padStart(2, '0')}`;
}

/** ISO 주차 두 개 사이의 주 간격. 연말의 52/53주 경계도 실제 달력으로 계산한다. */
export function weeksBetween(fromWeek: string, toWeek: string): number {
  const mondayMs = (weekStr: string): number | null => {
    const match = /^(\d{4})-(\d{2})$/.exec(weekStr);
    if (!match) return null;
    const year = Number(match[1]);
    const week = Number(match[2]);
    if (week < 1 || week > 53) return null;

    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = (jan4.getUTCDay() + 6) % 7;
    return jan4.getTime() - jan4Day * 86_400_000 + (week - 1) * 7 * 86_400_000;
  };

  const from = mondayMs(fromWeek);
  const to = mondayMs(toWeek);
  if (from === null || to === null) return 0;
  return Math.round((to - from) / (7 * 86_400_000));
}

/** KST 기준 k주 전 월요일 날짜 (YYYY-MM-DD). weeksAgo=0이면 이번 주 월요일 */
export function mondayOfWeeksAgo(now: Date, weeksAgo: number): string {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  const dow = (k.getUTCDay() + 6) % 7; // 월=0
  k.setUTCDate(k.getUTCDate() - dow - weeksAgo * 7);
  return k.toISOString().slice(0, 10);
}

/** 날짜 문자열에 일수 더하기 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

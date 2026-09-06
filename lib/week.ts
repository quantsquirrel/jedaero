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

function mondayMsOfWeek(weekStr: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(weekStr);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  return jan4.getTime() - jan4Day * 86_400_000 + (week - 1) * 7 * 86_400_000;
}

/** ISO 주차(YYYY-WW)의 월요일 날짜. 잘못된 형식이면 입력을 그대로 돌려준다. */
export function mondayOfWeek(weekOf: string): string {
  const ms = mondayMsOfWeek(weekOf);
  if (ms === null) return weekOf;
  return new Date(ms).toISOString().slice(0, 10);
}

/** ISO 주차 두 개 사이의 주 간격. 연말의 52/53주 경계도 실제 달력으로 계산한다. */
export function weeksBetween(fromWeek: string, toWeek: string): number {
  const from = mondayMsOfWeek(fromWeek);
  const to = mondayMsOfWeek(toWeek);
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

/** 주차의 사람이 읽는 구간 표기 — "08-31 ~ 09-06". 형식이 어긋나면 주차 문자열 그대로. */
export function weekRangeLabel(weekStr: string): string {
  // mondayOfWeek 는 형식이 어긋나면 입력을 그대로 돌려주므로 실패를 구분할 수 없다.
  // 여기서는 원시 함수(number | null)를 직접 써서 «파싱 실패»를 분명히 가른다.
  const ms = mondayMsOfWeek(weekStr);
  if (ms === null) return weekStr;
  const monday = new Date(ms).toISOString().slice(0, 10);
  return `${monday.slice(5)} ~ ${addDays(monday, 6).slice(5)}`;
}

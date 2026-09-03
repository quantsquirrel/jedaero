// 초안 ↔ 확정 비교 (잠금 문서 §1)
// ★ 출력은 «사실 서술»로 끝난다. 평가·조언을 붙이지 않는다 (C8, C10).
//   "화요일엔 이렇게 적으셨고 지금은 다르게 하셨습니다" — 판단은 사용자가 한다.
// ★ 규칙 기반이다. 생성형 AI가 아니므로 화면에서 고지 배지를 붙이지 않는다 (C9).
import { POINT_UNIT, THEMES, type ThemeCode, type Weights } from '../constants';

/** 근거 한 줄의 최대 길이. 초안은 «메모»이지 일지가 아니다 */
export const NOTE_MAX = 120;

export type DraftDiffRow = { code: ThemeCode; name: string; draftPt: number; finalPt: number };

export type DraftDiff = {
  same: boolean;
  rows: DraftDiffRow[];
  /** 달라진 전선만 */
  changed: DraftDiffRow[];
  /** 옮긴 포인트의 총량 (한쪽이 늘면 다른 쪽이 줄므로 절반) */
  movedPoints: number;
  sentence: string;
};

const pt = (w: Partial<Weights>, c: ThemeCode) => Math.round((w[c] ?? 0) / POINT_UNIT);

export function compareDraft(draft: Partial<Weights>, final: Partial<Weights>): DraftDiff {
  const rows: DraftDiffRow[] = THEMES.map((t) => ({
    code: t.code,
    name: t.name,
    draftPt: pt(draft, t.code),
    finalPt: pt(final, t.code),
  }));
  const changed = rows.filter((r) => r.draftPt !== r.finalPt);
  const movedPoints =
    Math.round(changed.reduce((s, r) => s + Math.abs(r.finalPt - r.draftPt), 0) / 2 * 10) / 10;

  if (changed.length === 0) {
    return {
      same: true,
      rows,
      changed,
      movedPoints: 0,
      sentence: '평일에 적어 둔 초안과 이번 주 확정이 같았습니다.',
    };
  }

  const named = changed
    .slice(0, 3)
    .map((r) => `${r.name} ${r.draftPt}→${r.finalPt}포인트`)
    .join(', ');
  const rest = changed.length > 3 ? ` 외 ${changed.length - 3}개 전선` : '';
  return {
    same: false,
    rows,
    changed,
    movedPoints,
    sentence: `평일 초안과 이번 주 확정이 ${changed.length}개 전선에서 달랐습니다 — ${named}${rest}.`,
  };
}

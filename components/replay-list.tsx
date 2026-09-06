import { THEME_CODES, THEMES } from '@/lib/constants';
import { FIXED_COPY } from '@/lib/principles/copy';
import { formatDeltaPp, type ReplayWeek } from '@/lib/principles/replay';
import { SourceChip } from '@/components/source-chip';

function bookLine(week: ReplayWeek): string {
  const fronts = THEME_CODES.filter((c) => (week.weights[c] ?? 0) > 0)
    .map((c) => `${THEMES.find((t) => t.code === c)?.name ?? c} ${week.weights[c]}%`)
    .join(' · ');
  const reserve = 100 - THEME_CODES.reduce((s, c) => s + (week.weights[c] ?? 0), 0);
  return reserve > 0 ? `${fronts} · 예비대 ${reserve}%` : fronts;
}

function changeLine(week: ReplayWeek): string {
  if (week.firstConfirm) return FIXED_COPY.replayFirst;
  if (week.held) return FIXED_COPY.replayHeld;
  if (week.deltas.length === 0) return FIXED_COPY.replayHeld;
  return week.deltas.map((d) => `${d.name} ${formatDeltaPp(d.pp)}`).join(' · ');
}

export function ReplayList({ weeks }: { weeks: ReplayWeek[] }) {
  if (weeks.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{FIXED_COPY.replayTitle}</h2>
      <SourceChip kind="rule" />
      <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.replayLead}</p>

      <ul className="flex flex-col gap-2">
        {weeks.map((week) => (
          <li key={week.weekOf} className="rounded-xl border border-border px-4 py-3">
            <p className="font-mono text-xs tabular-nums text-faint">{week.monday}</p>
            {week.review ? (
              <p className="mt-2 break-keep rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed">
                {week.review}
              </p>
            ) : null}
            <p className="mt-2 font-mono text-sm tabular-nums leading-relaxed">{changeLine(week)}</p>
            {week.firstConfirm ? (
              <p className="mt-1 break-keep font-mono text-xs tabular-nums leading-relaxed text-muted-foreground">
                {bookLine(week)}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.replayNotInImage}</p>
    </section>
  );
}

// S12 나의 투자 원칙 — 전역 시점 산출물 (설계 문서)
// ★ 평일에도 전부 열린다. 심사 5일이 전부 평일이므로 잠기면 평가에서 사라진다.
//   지표 교체와 충돌하지 않는다 — 여기 숫자는 누적·최대낙폭처럼 «느린 숫자»이고
//   「이번 주 변동」이 없다. 제대로 지수 점수를 넣지 않는 이유도 같다 (주말 전용이므로).
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { allocations } from '@/db/schema';
import { SPIVA } from '@/db/seed/benchmarks';
import { PageHeader } from '@/components/page-header';
import { SourceChip } from '@/components/source-chip';
import { PrinciplesSheet } from '@/components/principles-sheet';
import { PrinciplesAi } from '@/components/principles-ai';
import { kstToday } from '@/lib/day-type';
import { pricesUpTo } from '@/lib/portfolio/prices';
import { benchmarkRows } from '@/lib/principles/benchmarks';
import { FIXED_COPY, staleNotice } from '@/lib/principles/copy';
import { buildPrincipleSentences, type PrincipleRow } from '@/lib/principles/facts';
import { getSessionUser } from '@/lib/session';
import { weekOf } from '@/lib/week';
import type { Weights } from '@/lib/constants';
import type { Details } from '@/lib/portfolio/details';

export default async function PrinciplesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.userId, user.id))
    .orderBy(asc(allocations.effectiveFrom), asc(allocations.decidedAt));

  const today = kstToday();
  const bench = benchmarkRows(today);
  const stale = bench.filter((b) => b.stale);

  const principleRows: PrincipleRow[] = rows.map((r) => ({
    weekOf: r.weekOf,
    effectiveFrom: r.effectiveFrom,
    weights: r.weights as Weights,
    details: (r.details as Details | null) ?? null,
  }));
  const { dates, series } = pricesUpTo(today);
  const sentences =
    principleRows.length > 0
      ? buildPrincipleSentences({
          rows: principleRows,
          currentWeek: weekOf(new Date()),
          dates,
          series,
        })
      : [];

  return (
    <main className="flex flex-col gap-6 px-5 py-8">
      <PageHeader
        title={FIXED_COPY.title}
        description={FIXED_COPY.subtitle}
        badge={<SourceChip kind="human" label="확정은 본인이 합니다" />}
      />

      {sentences.length === 0 ? (
        <p className="rounded-xl border border-border px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          아직 편성 기록이 없습니다. 주말에 첫 편성을 확정하면 이 화면이 채워집니다.
        </p>
      ) : (
        <PrinciplesSheet sentences={sentences} />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{FIXED_COPY.benchTitle}</h2>
        <SourceChip kind="rule" />
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.benchLead}</p>

        <ul className="flex flex-col gap-2">
          {bench.map((b) => (
            <li key={b.id} className="rounded-xl border border-border px-4 py-3">
              <p className="text-sm font-semibold">{b.label}</p>
              <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
                {b.slices.map((s) => `${s.name} ${s.pct}`).join(' · ')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {b.note} · {b.asOf} 기준 ·{' '}
                <a href={b.sourceUrl} className="underline" target="_blank" rel="noreferrer noopener">
                  출처
                </a>
              </p>
            </li>
          ))}
        </ul>

        {stale.length > 0 ? (
          <p className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            {stale.map((b) => staleNotice(b.label, b.asOf)).join(' ')}
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.mappingNote}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.gapNote}</p>
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-sm font-semibold leading-relaxed">{FIXED_COPY.spiva}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {FIXED_COPY.spivaSource}{' '}
            <a href={SPIVA.sourceUrl} className="underline" target="_blank" rel="noreferrer noopener">
              출처
            </a>
          </p>
        </div>
      </section>

      {sentences.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{FIXED_COPY.aiTitle}</h2>
          <PrinciplesAi />
          <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.aiNoAnswer}</p>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{FIXED_COPY.transferTitle}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.transfer}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{FIXED_COPY.twrSplit}</p>
      </section>

      <footer className="flex flex-col gap-1 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">{FIXED_COPY.footerSim}</p>
        <p className="text-xs text-muted-foreground">{FIXED_COPY.footerNoRec}</p>
      </footer>
    </main>
  );
}

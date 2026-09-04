'use client';
// 명령하달 — 평일에 남기는 초안 편성기 (잠금 문서 §1)
// ★ 「예약 주문」이라고 쓰지 않는다. 실행되지 않는 «메모»다.
// ★ 안 적어도 아무 일도 없다. 빈 상태를 꾸짖는 배지·카운터를 두지 않는다.
// 조작 문법은 편성기와 같다 — 포인트 20개, `+`/`−`, 슬라이더 없음, 자동 비례 재조정 없음.
import { useState, useTransition } from 'react';
import { deleteDraft, saveDraft } from '@/app/actions/drafts';
import { NOTE_MAX } from '@/lib/drafts/compare';
import { Button } from '@/components/ui/button';
import { POINT_UNIT, RESERVE, THEMES, TOTAL_POINTS, type ThemeCode, type Weights } from '@/lib/constants';
import { adjustPoints, emptyWeights, pointsOf, reservePoints } from '@/lib/portfolio/weights';
import { cn } from '@/lib/utils';

export function DraftEditor({
  initial,
  initialNote,
  existed,
}: {
  initial: Weights | null;
  initialNote: string;
  existed: boolean;
}) {
  const [open, setOpen] = useState(existed);
  const [weights, setWeights] = useState<Weights>(initial ?? emptyWeights());
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(existed);
  const [result, setResult] = useState<{ ok?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const reserve = reservePoints(weights);

  const bump = (code: ThemeCode, delta: 1 | -1) => {
    setResult({});
    setWeights((w) => adjustPoints(w, code, delta));
  };

  const submit = () =>
    startTransition(async () => {
      const res = await saveDraft(weights, note);
      if ('error' in res) setResult({ error: res.error });
      else {
        setSaved(true);
        setResult({ ok: '초안을 남겼습니다. 주말 편성기에서 나란히 보입니다.' });
      }
    });

  const remove = () =>
    startTransition(async () => {
      const res = await deleteDraft();
      if ('error' in res) setResult({ error: res.error });
      else {
        setSaved(false);
        setWeights(emptyWeights());
        setNote('');
        setResult({ ok: '초안을 지웠습니다.' });
      }
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3.5 text-left transition-colors hover:border-zinc-600"
      >
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
            명령하달 · 선택
          </span>
          <span className="mt-0.5 block font-semibold">이번 주 초안 남기기</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            초안 없이 주말로 가도 됩니다.
          </span>
        </span>
        <span className="shrink-0 text-sm text-muted-foreground">열기 →</span>
      </button>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
            명령하달 · 선택
          </p>
          <h3 className="mt-1 font-semibold">이번 주 초안</h3>
        </div>
        <span className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400">
          아직 실행되지 않은 메모
        </span>
      </div>

      <p className="px-4 pt-2 text-xs leading-relaxed text-muted-foreground">
        체결되지 않습니다. 주말 편성기에서 «화요일에 적은 것»과 «지금 정하는 것»을 나란히 보게
        됩니다. 둘이 달라도 괜찮습니다 — 그 차이가 이 훈련이 가르치려는 것입니다.
      </p>

      <div className="flex flex-col gap-2.5 px-4 pt-4">
        {THEMES.map((t) => {
          const pt = pointsOf(weights, t.code);
          return (
            <div key={t.code} className="flex items-center justify-between gap-3">
              <span className="text-sm">{t.name}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`${t.name} 초안 1포인트 빼기`}
                  disabled={pending || pt <= 0}
                  onClick={() => bump(t.code, -1)}
                >
                  −
                </Button>
                <span className="w-16 text-center font-mono text-base tabular-nums">
                  {pt}
                  <span className="ml-1 text-xs text-muted-foreground">{weights[t.code] ?? 0}%</span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`${t.name} 초안 1포인트 놓기`}
                  disabled={pending || reserve <= 0}
                  onClick={() => bump(t.code, 1)}
                >
                  +
                </Button>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-2.5">
          <span className="text-sm text-muted-foreground">{RESERVE.name}</span>
          <span className="font-mono text-sm tabular-nums text-muted-foreground">
            {reserve}
            <span className="ml-1 text-xs">/ {TOTAL_POINTS}포인트 · {reserve * POINT_UNIT}%</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-4 pt-4">
        <label htmlFor="draft-note" className="text-xs text-muted-foreground">
          왜 이렇게 옮기려 하나요 — 한 줄 (선택)
        </label>
        <textarea
          id="draft-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
          rows={2}
          placeholder="비워 두어도 저장됩니다."
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus-visible:border-amber-400/50"
        />
        <span className="self-end font-mono text-[11px] tabular-nums text-zinc-600">
          {note.length}/{NOTE_MAX}
        </span>
      </div>

      {result.error ? (
        <p className="px-4 pt-2 text-sm text-destructive">{result.error}</p>
      ) : result.ok ? (
        <p className="px-4 pt-2 text-sm text-emerald-400">{result.ok}</p>
      ) : null}

      <div className="flex gap-2 px-4 pb-4 pt-3">
        <Button type="button" className="flex-1" disabled={pending} onClick={submit}>
          {pending ? '저장 중…' : saved ? '초안 고치기' : '초안 남기기'}
        </Button>
        {saved ? (
          <Button type="button" variant="outline" disabled={pending} onClick={remove}>
            지우기
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
            접기
          </Button>
        )}
      </div>

      <p className={cn('px-4 pb-4 text-[11px] leading-relaxed text-zinc-600')}>
        초안은 편성이 아닙니다. 이번 주 편성은 주말에 편성기에서 확정합니다.
      </p>
    </section>
  );
}

'use client';
// 전선 편성기 — 사용자가 조작하는 유일한 대상 (DESIGN-DECISIONS §3)
// 슬라이더 금지. 포인트 20개를 +/- 버튼으로 배치한다. % 는 작은 글씨로 병기.
// ★ 자동 재조정 없음. 한 전선을 올려도 다른 전선은 그대로다. 포인트는 원래 유한하다.
// ★ 예비대(미배치분)를 항상 표시한다. "0%"가 아니라 "예비대 7포인트"라고 적혀야
//   방치가 아니라 선택이 된다 (과소투자를 조용히 훈련시키지 않기 위한 장치).
// ★ 자유도 3단계: 주식 두 전선은 안에서 테마로 다시 나눌 수 있다. 열지 않으면 대표지수 추종.
//   2포인트 이상 놓인 전선에서만 열린다 — 1포인트는 쪼갤 수 없다.
import { useState, useTransition } from 'react';
import { saveAllocation } from '@/app/actions/allocation';
import { PointTray } from '@/components/point-tray';
import { SourceChip } from '@/components/source-chip';
import { Button } from '@/components/ui/button';
import { POINT_UNIT, RESERVE, THEMES, TOTAL_POINTS, type ThemeCode, type Weights } from '@/lib/constants';
import {
  adjustDetail,
  dropStaleDetails,
  isDetailOpen,
  placedSubPoints,
  subRowsOf,
  type Details,
} from '@/lib/portfolio/details';
import { adjustPoints, pointsOf, reservePoints } from '@/lib/portfolio/weights';
import { cn } from '@/lib/utils';

export function WeightEditor({
  initial,
  initialDetails,
  disabled,
  disabledReason,
  draft,
}: {
  initial: Weights;
  initialDetails?: Details | null;
  disabled: boolean;
  disabledReason?: string;
  /** 평일에 남긴 초안 (명령하달). 있으면 나란히 보여주고 «한 번» 불러올 수 있다. */
  draft?: { weights: Weights; note: string | null } | null;
}) {
  const [weights, setWeights] = useState<Weights>(initial);
  const [details, setDetails] = useState<Details>(initialDetails ?? {});
  const [open, setOpen] = useState<ThemeCode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();
  const [loadedDraft, setLoadedDraft] = useState(false);

  const dirty =
    THEMES.some((t) => weights[t.code] !== initial[t.code]) ||
    JSON.stringify(details) !== JSON.stringify(initialDetails ?? {});
  const locked = disabled || pending;
  const reserve = reservePoints(weights);

  const bump = (code: ThemeCode, delta: 1 | -1) => {
    setResult({});
    setWeights((w) => {
      const next = adjustPoints(w, code, delta);
      if (next === w) return w;
      // 상위가 바뀌면 어긋난 하위 배치를 버린다. 비례 재조정은 하지 않는다
      setDetails((d) => {
        const { details: kept, dropped } = dropStaleDetails(d, next);
        setNotice(
          dropped.length > 0
            ? `${dropped
                .map((c) => THEMES.find((t) => t.code === c)?.name ?? c)
                .join('·')}의 하위 배치를 지수 추종으로 되돌렸습니다. 상위 포인트가 바뀌었기 때문입니다.`
            : null,
        );
        return kept;
      });
      return next;
    });
  };

  const bumpSub = (code: ThemeCode, ticker: string, delta: 1 | -1) => {
    setResult({});
    setNotice(null);
    setDetails((d) => adjustDetail(d, weights, code, ticker, delta));
  };

  const submit = () =>
    startTransition(async () => {
      const res = await saveAllocation(weights, details);
      if ('error' in res) setResult({ error: res.error });
      else setResult({ ok: `확정됐습니다. ${res.effectiveFrom} 종가로 반영됩니다 (예약 체결).` });
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          포인트 <span className="font-mono tabular-nums">{TOTAL_POINTS}</span>개를 여섯 전선에
          나눠 놓습니다. 1포인트 = {POINT_UNIT}%.
        </p>
        <SourceChip kind="human" className="shrink-0" />
      </div>

      <PointTray placed={TOTAL_POINTS - reserve} />

      {THEMES.map((t) => {
        const pt = pointsOf(weights, t.code);
        // 1포인트는 쪼갤 수 없다. 나눌 병력이 있어야 하위가 열린다
        const canSplit = isDetailOpen(t.code) && pt >= 2;
        const isOpen = open === t.code;
        const subPlaced = placedSubPoints(details, t.code);
        return (
          <div key={t.code} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">{t.name}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`${t.name} 1포인트 빼기`}
                  disabled={locked || pt <= 0}
                  onClick={() => bump(t.code, -1)}
                >
                  −
                </Button>
                <span className="w-16 text-center font-mono text-base tabular-nums">
                  {pt}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {weights[t.code] ?? 0}%
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`${t.name} 1포인트 놓기`}
                  disabled={locked || reserve <= 0}
                  onClick={() => bump(t.code, 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {canSplit ? (
              // 심사 시나리오 6-c가 지목하는 컨트롤이다. 밑줄 텍스트만 두면 터치 타깃이 16px다.
              <button
                type="button"
                aria-expanded={isOpen}
                className="flex min-h-11 items-center self-start text-xs text-muted-foreground underline underline-offset-2"
                onClick={() => setOpen(isOpen ? null : t.code)}
              >
                {isOpen
                  ? '테마 나누기 닫기'
                  : subPlaced > 0
                    ? `테마로 나눔 — ${subPlaced}/${pt}포인트 배치됨`
                    : '테마로 나누기 (지금은 지수 추종)'}
              </button>
            ) : null}

            {isOpen ? (
              <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  {t.name}에 놓은 <b className="text-foreground">{pt}포인트</b>를 이 안에서 다시
                  나눕니다. 남기면 그만큼 대표지수를 따라갑니다.
                </p>
                {subRowsOf(t.code).map((row) => {
                  const at = details[t.code]?.[row.ticker] ?? 0;
                  return (
                    <div key={row.ticker} className="flex items-center justify-between gap-2">
                      <span className="text-xs">
                        {row.name}
                        {row.isIndex ? (
                          <span className="ml-1 text-[11px] text-muted-foreground">기본</span>
                        ) : null}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`${row.name} 1포인트 빼기`}
                          disabled={locked || at <= 0}
                          onClick={() => bumpSub(t.code, row.ticker, -1)}
                        >
                          −
                        </Button>
                        <span className="w-6 text-center font-mono text-sm tabular-nums">{at}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`${row.name} 1포인트 놓기`}
                          disabled={locked || subPlaced >= pt}
                          onClick={() => bumpSub(t.code, row.ticker, 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <p className="border-t border-border pt-2 text-xs text-muted-foreground">
                  배치 <span className="font-mono tabular-nums">{subPlaced}</span> / {pt} 포인트
                  {subPlaced > 0 && subPlaced < pt
                    ? ` · 남은 ${pt - subPlaced}포인트는 대표지수를 따라갑니다`
                    : ''}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* 명령하달 초안 — «자동 적용 금지». 불러오는 것 자체가 명령이 되면 안 된다 (잠금 문서 §1) */}
      {draft ? (
        <div className="flex flex-col gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
            평일에 남긴 초안
          </p>
          <div className="flex flex-col gap-1">
            {THEMES.map((t) => {
              const d = Math.round((draft.weights[t.code] ?? 0) / POINT_UNIT);
              const now = pointsOf(weights, t.code);
              return (
                <div key={t.code} className="flex items-center justify-between gap-2 text-xs">
                  <span className="w-24 shrink-0 truncate">{t.name}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    초안 {d}p → 지금 {now}p
                  </span>
                  <span
                    className={cn(
                      'w-10 text-right font-mono tabular-nums',
                      now === d ? 'text-muted-foreground' : 'text-primary/90',
                    )}
                  >
                    {now === d ? '같음' : `${now > d ? '+' : '−'}${Math.abs(now - d)}p`}
                  </span>
                </div>
              );
            })}
          </div>
          {draft.note ? (
            <p className="border-t border-primary/20 pt-2 text-xs leading-relaxed text-primary/70">
              “{draft.note}”
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={locked || loadedDraft}
            onClick={() => {
              setWeights(draft.weights);
              setDetails({});
              setLoadedDraft(true);
              setNotice('초안을 편성기에 올렸습니다. 아직 확정되지 않았습니다 — 그대로 둘지 고칠지는 지금 정합니다.');
            }}
          >
            {loadedDraft ? '초안을 올렸습니다' : '초안 불러오기'}
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            초안은 저절로 적용되지 않습니다. 화요일의 판단과 지금의 판단은 다를 수 있고, 그 차이를
            보는 것이 이 화면의 목적입니다.
          </p>
        </div>
      ) : null}

      {/* 예비대 — 축이 아니라 잔여지만, 하나의 축처럼 보여야 한다 */}
      <div className="rounded-md border border-dashed border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{RESERVE.name}</span>
          <span className="font-mono text-base tabular-nums">
            {reserve}
            <span className="ml-1 text-xs text-muted-foreground">{reserve * POINT_UNIT}%</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{RESERVE.note}</p>
        {/* ★ 예비대가 0이면 여섯 전선의 `+`가 전부 비활성이 된다. 왜 안 눌리는지 같은 화면에
            적지 않으면 화면이 고장난 것으로 읽힌다 (DESIGN-RULES §7 잠김 문구 규범). */}
        {reserve === 0 && !disabled ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            포인트를 전부 놓았습니다. 더 놓으려면 먼저 다른 전선에서 빼야 합니다.
          </p>
        ) : null}
      </div>

      {notice ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          {notice}
        </p>
      ) : null}
      {disabled && disabledReason ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{disabledReason}</p>
      ) : null}
      {result.error ? <p className="text-sm text-destructive">{result.error}</p> : null}
      {result.ok ? <p className="text-sm text-up">{result.ok}</p> : null}

      <Button
        type="button"
        className={cn('h-12 text-base', !dirty && 'opacity-60')}
        disabled={locked || !dirty}
        onClick={submit}
      >
        {pending ? '저장 중…' : '이번 주 편성 확정'}
      </Button>
      <p className="text-xs text-muted-foreground">
        확정하면 이번 주에는 다시 바꿀 수 없고, 다음 거래일 종가로 반영됩니다. 결정과 체결 사이의
        시차는 예약주문의 본질입니다.
      </p>
    </div>
  );
}

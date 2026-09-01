'use client';
// 예산 봉투 배정 — 월 1회 확정 후 잠금 (SPEC §3-2 B) + AI-2 배정 제안
// ★ 제안은 입력칸을 채울 뿐이다. 저장은 사용자가 [확정] 을 눌러야 일어난다 (C8 보조수단성).
import { useActionState, useState, useTransition } from 'react';
import { saveBudget, suggestBudgetAction, type BudgetState, type SuggestState } from '@/app/actions/budget';
import { AiNotice } from '@/components/ai-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { won } from '@/lib/format';

type Suggestion = Exclude<SuggestState, { error: string }>;

export function BudgetForm({
  yearMonth,
  categories,
  salary,
  initial,
}: {
  yearMonth: string;
  categories: readonly string[];
  salary: number;
  initial?: Record<string, number>;
}) {
  const [state, formAction, pending] = useActionState<BudgetState, FormData>(saveBudget, {});
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [c, initial?.[c] ? String(initial[c]) : ''])),
  );
  const [suggesting, startSuggest] = useTransition();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const total = categories.reduce((s, c) => s + (Number(values[c]) || 0), 0);

  const askSuggestion = () =>
    startSuggest(async () => {
      setSuggestError(null);
      const res = await suggestBudgetAction(yearMonth);
      if ('error' in res) {
        setSuggestion(null);
        setSuggestError(res.error);
        return;
      }
      setSuggestion(res);
      // 제안을 폼에 채운다. 저장은 아직 일어나지 않는다.
      setValues((prev) => {
        const next = { ...prev };
        for (const c of categories) next[c] = '';
        for (const e of res.entries) next[e.category] = String(e.allocated);
        return next;
      });
    });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="yearMonth" value={yearMonth} />
      <p className="text-sm text-muted-foreground">
        {yearMonth} · 월 봉급 <b className="text-foreground">{won(salary)}</b>{' '}
        <span className="text-xs">(규칙 기반 · AI 아님)</span>
      </p>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" disabled={suggesting} onClick={askSuggestion}>
          {suggesting ? '과거 3개월 읽는 중…' : 'AI 배정 제안 받기'}
        </Button>
        {suggestError ? <p className="text-sm text-destructive">{suggestError}</p> : null}
        {suggestion ? (
          <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3">
            {suggestion.source === 'ai' ? (
              <AiNotice />
            ) : (
              <span className="inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                규칙 기반 제안 · 생성형 AI 아님
              </span>
            )}
            {suggestion.notice ? <p className="text-xs text-muted-foreground">{suggestion.notice}</p> : null}
            <p className="text-sm leading-relaxed">{suggestion.note}</p>
            <ul className="flex flex-col gap-1 border-t border-border pt-2 text-xs">
              {suggestion.entries.map((e) => (
                <li key={e.category} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {e.category} — {e.reason}
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">{won(e.allocated)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              아래 칸에 채워 넣었습니다. 아직 저장되지 않았습니다 — 고쳐 쓰고 직접 확정해주세요.
            </p>
          </div>
        ) : null}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="flex items-center justify-between gap-3">
          <Label htmlFor={`cat-${cat}`} className="shrink-0">
            {cat}
          </Label>
          <Input
            id={`cat-${cat}`}
            name={`cat:${cat}`}
            type="number"
            min={0}
            step={1000}
            value={values[cat] ?? ''}
            onChange={(e) => setValues((prev) => ({ ...prev, [cat]: e.target.value }))}
            placeholder="0"
            className="w-36 text-right"
          />
        </div>
      ))}

      <p className="flex justify-between text-xs text-muted-foreground">
        <span>배정 합계</span>
        <span className="font-mono tabular-nums">
          {won(total)} / 봉급 {won(salary)}
        </span>
      </p>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-400">저장됐습니다.</p> : null}
      <div className="flex gap-2">
        <Button type="submit" name="lock" value="false" variant="outline" disabled={pending} className="flex-1">
          임시 저장
        </Button>
        <Button type="submit" name="lock" value="true" disabled={pending} className="flex-1">
          확정하고 잠그기
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        확정하면 이 달에는 다시 바꿀 수 없습니다. 봉투는 월초에 정하고, 그 달에 바꾸지 않는
        훈련입니다.
      </p>
    </form>
  );
}

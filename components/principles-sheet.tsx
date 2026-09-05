'use client';
// 사실 문장 체크박스 + 이미지 저장 링크
// ★ 선택을 서버에 저장하지 않는다. 링크의 문장 id로만 넘긴다.
//   이미지 라우트가 세션에서 문장을 «다시 계산»하므로 사용자 입력이 렌더러에 닿지 않는다.
import { useState } from 'react';
import type { PrincipleSentence } from '@/lib/principles/facts';
import { FIXED_COPY } from '@/lib/principles/copy';
import { SourceChip } from '@/components/source-chip';

export function PrinciplesSheet({ sentences }: { sentences: PrincipleSentence[] }) {
  const [picked, setPicked] = useState<string[]>(() => sentences.map((s) => s.id));
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const href = `/principles/image?lines=${picked.join(',')}`;

  return (
    <section className="flex flex-col gap-3">
      <SourceChip kind="rule" />
      <p className="text-xs text-muted-foreground">{FIXED_COPY.checkHint}</p>

      <ul className="flex flex-col gap-2">
        {sentences.map((s) => (
          <li key={s.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-input px-4 py-3 transition-colors hover:border-muted-foreground/40">
              <input
                type="checkbox"
                checked={picked.includes(s.id)}
                onChange={() => toggle(s.id)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="text-sm leading-relaxed">{s.text}</span>
            </label>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted-foreground">{FIXED_COPY.saveNote}</p>

      {picked.length > 0 ? (
        <a
          href={href}
          download="나의-투자-원칙.png"
          className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {FIXED_COPY.saveButton}
        </a>
      ) : (
        <p className="text-xs text-muted-foreground">문장을 하나 이상 남기면 저장할 수 있습니다.</p>
      )}
    </section>
  );
}

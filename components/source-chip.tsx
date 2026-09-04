import { cn } from '@/lib/utils';

// 경계 표식 — 이 문장을 누가 만들었나. 세 칩은 모든 화면에서 같은 뜻이다.
//   규칙 = 공개된 산식이 계산한 숫자 (중립색)
//   AI  = 생성형 AI가 쓴 문장 (violet) — C9. 이 배지 없이 AI 응답을 띄우지 않는다
//   사람 = 확정은 본인이 한다 (신호색)
// ★ 규칙이 만든 숫자에 AI 칩을 붙이지 않는다. 색이 곧 출처다.
type Kind = 'rule' | 'ai' | 'human';

const STYLE: Record<Kind, string> = {
  rule: 'border-border text-muted-foreground',
  ai: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  human: 'border-primary/40 bg-primary/10 text-primary/90',
};

const LABEL: Record<Kind, string> = {
  rule: '규칙 기반 계산 · 생성형 AI 아님',
  ai: '생성형 AI 제안 · 확정은 본인이 합니다',
  human: '확정은 본인이 합니다 · 주말 1회',
};

export function SourceChip({
  kind,
  label,
  className,
}: {
  kind: Kind;
  /** 맥락에 맞춰 문구만 바꾼다. 색과 뜻은 바꾸지 않는다 */
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        STYLE[kind],
        className,
      )}
    >
      {kind === 'ai' ? (
        <svg viewBox="0 0 24 24" className="size-3 fill-current" aria-hidden>
          <path d="M12 2l1.9 5.7L19.6 9l-5.7 1.9L12 16.6l-1.9-5.7L4.4 9l5.7-1.3L12 2z" />
        </svg>
      ) : null}
      {label ?? LABEL[kind]}
    </span>
  );
}

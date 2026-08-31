import { cn } from '@/lib/utils';

// 생성형 AI 고지 배지 (C9, 금융보안원 AI 보안 안내서 평가기준 1.5)
// 모든 AI 응답·제안 상단에 이 배지를 붙인다. 규칙 기반 영역에는 붙이지 않는다.
export function AiNotice({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-300',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3 fill-current" aria-hidden>
        <path d="M12 2l1.9 5.7L19.6 9l-5.7 1.9L12 16.6l-1.9-5.7L4.4 9l5.7-1.3L12 2z" />
      </svg>
      생성형 AI 제안 · 확정은 본인이 합니다
    </span>
  );
}

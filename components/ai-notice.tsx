import { SourceChip } from '@/components/source-chip';

// 생성형 AI 고지 배지 (C9, 금융보안원 AI 보안 안내서 평가기준 1.5)
// 모든 AI 응답·제안 상단에 이 배지를 붙인다. 규칙 기반 영역에는 붙이지 않는다.
// 표식 자체는 components/source-chip.tsx 가 갖는다 — 규칙·AI·사람이 한곳에서 정의되어야
// 색과 뜻이 갈라지지 않는다. 이 파일은 C9 용 이름을 지키기 위해 남긴다.
export function AiNotice({ className }: { className?: string }) {
  return <SourceChip kind="ai" className={className} />;
}

// LLM 입력 필터 — 프롬프트 인젝션·개인정보·부대정보 탐지 (SPEC §5)
// LLM 호출 전에 반드시 통과해야 한다. 차단 시 입력 내용을 응답에 되풀이하지 않는다.
import { UNIT_PATTERNS } from './unit-filter';

type Rule = { name: string; re: RegExp };

const INJECTION_RULES: Rule[] = [
  {
    name: '지시 무시',
    re: /(이전|앞서|위의|기존).{0,10}(지시|명령|규칙|지침|프롬프트).{0,10}(무시|잊어|건너뛰|무효화)/,
  },
  { name: '역할 전환', re: /(역할|행동|흉내).{0,10}(해커|관리자|개발자|제한없는|무제한)/ },
  {
    name: '제한 해제',
    re: /(제거|해제|무시|우회).{0,10}(모든|전체|당신의).{0,10}(제한|필터|안전장치|제약)/,
  },
  { name: '지시 무시(영문)', re: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/i },
  { name: '시스템 프롬프트 요구', re: /(시스템|초기)\s*프롬프트.{0,12}(보여|알려|출력|공개)/ },
];

const PRIVACY_RULES: Rule[] = [
  {
    name: '주민등록번호',
    re: /(?:(?:19|20)\d{2}|[0-9]{2})(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])-[1-4]\d{6}/,
  },
  { name: '계좌번호 추정', re: /\d{3,6}-\d{2,6}-\d{4,8}/ },
];

// 구조 검증: 명령어 체이닝, Base64/헥사 인코딩, 과도한 괄호 중첩, 코드블록 우회
const STRUCTURE_RULES: Rule[] = [
  { name: '명령어 체이닝', re: /(;|\|\||&&)\s*\S/ },
  { name: '인코딩 우회', re: /[A-Za-z0-9+/]{48,}={0,2}|(?:\\x[0-9a-fA-F]{2}){8,}/ },
  { name: '괄호 중첩', re: /[({[]{5,}/ },
  { name: '코드블록 우회', re: /```/ },
];

export type InjectionCheck = { blocked: boolean; pattern?: string };

export function detectInjection(text: string): InjectionCheck {
  for (const rule of [...INJECTION_RULES, ...PRIVACY_RULES, ...STRUCTURE_RULES]) {
    if (rule.re.test(text)) return { blocked: true, pattern: rule.name };
  }
  // 부대정보 패턴도 동일 파이프라인 (C4)
  for (const re of UNIT_PATTERNS) {
    if (re.test(text)) return { blocked: true, pattern: '부대정보' };
  }
  return { blocked: false };
}

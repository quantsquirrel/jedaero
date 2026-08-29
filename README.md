# 제대로 (JEDAERO)

2026 금융 AI Challenge (금융보안원 주최) 출품작.
**제출 마감 2026-09-07 10:00 / 배포 URL 가용 09-07 11:00 ~ 09-11 23:59 (미접근 시 결격)**

> 전역할 때 실제로 받게 될 2,020만원을, 복무 중에 미리 굴려보는 모의투자 훈련 웹서비스.

## 문서

| 파일 | 내용 |
|---|---|
| `CLAUDE.md` | 절대 금지 C1~C11 + 구조 규칙. Claude Code가 자동으로 읽음 |
| `SPEC.md` | 전체 구현 명세 |
| `docs/SEED.md` | 예시 포트폴리오·종목·가격 시드·퀘스트·상수 |
| `docs/VERIFY.md` | 검증 항목 P0 14 / P1 13, 심사자 시나리오 18 |
| `PROMPT.md` | Claude Code에 붙여넣을 프롬프트 |

## 시작

```bash
cd ~/Developer/jedaero
claude
# PROMPT.md 의 --- 아래 전체를 붙여넣기
```

## 사람이 직접 해야 하는 것

- [ ] Neon 프로젝트 생성 → `DATABASE_URL`
- [ ] Vercel 프로젝트 연결 + 환경변수
- [ ] LLM API 키 발급 + **사용량 상한 설정**
- [ ] `ADMIN_PASSWORD` 설정
- [ ] 각 단계 후 `bash scripts/verify.sh` **직접 재실행** (에이전트 보고를 믿지 말 것)
- [ ] 09-06 기능 동결
- [ ] 09-07 ~ 09-11 매일 URL 접속 확인

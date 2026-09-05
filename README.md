# 제대로 (JEDAERO)

2026 금융 AI Challenge (금융보안원 주최) 출품작.
**제출 마감 2026-09-07 10:00 / 배포 URL 가용 09-07 11:00 ~ 09-11 23:59 (미접근 시 결격)**

> 전역할 때 받게 될 목돈을, 복무 중에 미리 굴려보는 모의투자 훈련 웹서비스. 시드는 전원 2,000만원.

## 문서

| 파일 | 내용 |
|---|---|
| `CLAUDE.md` | 절대 금지 C1~C11 + 구조 규칙 |
| `SPEC.md` | 현재 구현 명세 |
| `docs/HANDOFF.md` | 지금 어디고 다음에 뭘 하나 |
| `docs/DESIGN-DECISIONS.md` | 왜 그렇게 만들었나 |
| `docs/SEED.md` | 예시 작전·지수 시드·가격 조건 |
| `docs/VERIFY.md` | P0 14 / P1 / 심사자 시나리오 |
| `PROMPT.md` | 이어가기용. 부트스트랩 구버전을 따르지 말 것 |

## 시작

```bash
cd ~/projects/jedaero
# docs/HANDOFF.md 를 먼저 읽는다
```

작업 브랜치를 쓴다. `main`에 직접 커밋하지 않는다.

## 사람이 직접 해야 하는 것

- [ ] Neon 프로젝트 생성 → `DATABASE_URL`
- [ ] `npm run db:migrate` 후 `npm run seed`
- [ ] Vercel 프로젝트 연결 + 환경변수
- [ ] LLM API 키 + **사용량 상한**
- [ ] `ADMIN_PASSWORD`
- [ ] `bash scripts/verify.sh` **직접 재실행**
- [ ] 09-06 기능 동결
- [ ] 09-07 ~ 09-11 매일 URL 접속 확인
- [ ] 기준선 갱신 확인 — **1월·6월 국민연금 / 2월·8월 노르웨이 / 3월·9월 SPIVA** (`db/seed/benchmarks.ts`)

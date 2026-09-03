# 핸드오프 — 2026-09-04 (6차)

다음 세션이 이걸 먼저 읽고 바로 이어가면 된다.
설계 근거는 `docs/DESIGN-DECISIONS.md` §14. **이 문서는 "지금 어디까지 왔고 다음에 뭘 하나"만 다룬다.**

잠근 원문: `docs/superpowers/specs/2026-09-04-predeploy-layers-design.md`

---

## 0. 상황

- **제출 마감 2026-09-07 10:00** — **D-3**
- 배포 URL **09-07 11:00 ~ 09-11 23:59**. 미접근 시 결격
- 심사 5일 전부 평일. `/demo` 토글은 결격 방지
- **09-04 낮:** 동료와 배포만 하고 빨리 헤어진다 (Unblock · migrate · main)
- **기능 구현은 배포를 기다리지 않아도 되는 것부터** 이 세션에서 한다

---

## 1. Git / Vercel

| 무엇 | 상태 |
|---|---|
| 브랜치 | `feat/landing-redesign`. 6차 핸드오프·잠금 문서는 이 커밋에 포함 |
| 프로덕션 | `jedaero.vercel.app` = `main` `482ee94`. **구제품** (2,020만·가계부) |
| GitHub→Vercel | **연결됨.** Preview `Deployment was blocked` (커밋 메일 로컬 주소) |
| 대시보드 | https://vercel.com/quantsquirrels-projects/jedaero/13phdvXsbEf9TRyi8y3qNPXWHb8c |
| `.env` | `KRX_API_KEY`·`DATA_GO_KR_API_KEY`만. **`DATABASE_URL` 없음** |
| gh | `jonnykkk16` write. 레포·Vercel 주인 `quantsquirrel` |

푸시: `git -c credential.helper='!gh auth git-credential' push`

보안 PR #1~#5 미머지. **#5 vs `scripts/seed.ts` 충돌 가능.** 배포 안정 후.

---

## 2. 제품 (브랜치 = 진실)

가계부·퀘스트 없음. 시드 2,000만. 테이블 10. 포인트 20+예비대+하위 테마. 제대로 지수. 랜딩 zinc/amber. 평일=누적+지형, 주말=변동+편성+AI-4 버튼.

**런타임 시세는 Neon이 아니라 `db/seed/prices.ts` 파일** (`lib/portfolio/prices.ts`). 세션·편성만 DB.

브라우저로 확인한 화면: `/` · `/onboarding`뿐.

---

## 3. 잠근 기획 (코드 없음)

| 주제 | 결정 |
|---|---|
| 브리핑룸 | 평일 홈=정찰 일지(B). 평일 AI 문장(C)은 필요조건. 출석 금지 |
| 명령하달 | **선택** 구조형 초안. 빈 주가 정상. `allocations` 아님. 반쪽 UI면 안 넣음 |
| 도상훈련 | 고정 **12개월** 3장: 2020-02-03~2021-01-29 / 2022 한 해 / 2008-09-01~2009-08-31. 커스텀 구간은 SPEC §10 |
| 맵+캐시 | 6전선 일괄 내부 매핑. 국내만 실종가 금지. 지형 일러스트는 배관 다음 |
| 공익 | **타겟 아님.** 장중 폰 가능. 온보딩에 넣지 않음 |

도상훈련 시세 ≠ KRX 맵. 2008년 한국 ETF가 없다. 픽스처는 교육용 고정 시계열.

종심 방어 온보딩 문구는 **지우지 말 것.**

---

## 4. 다음 세션 — 배포 없이 할 일 (우선)

원문 과업 분석은 채팅 캔버스 `solo-work-tonight.canvas.tsx`. 코드는 아래 순서로.

1. **도상훈련 엔진+픽스처+check** — `computeCurve` 재사용. 화면에 「교육용 과거 지형」
2. **평일 AI-4 분리** — `generateBriefingAction` WEEKEND 가드와 분리. 평일 입력에서 가중 등락 제거. 질문 1개
3. **`krx-map.ts` + fetch 스크립트** — 런타임 `pricesUpTo` 교체 금지. 6개 닫히기 전 시드 유지
4. 지형 SVG 슬롯. 앱 토큰을 랜딩 amber에
5. `drafts` 스키마·migration만. 편성기 UI는 세션 열린 뒤

하지 말 것: Production 강제 푸시, seed 전체 교체, 국내만 실종가, 명령하달 반쪽 폼, 2008 ETF scrape.

---

## 5. 09-04 낮 배포 (15분)

1. Vercel Preview **Unblock** + Member
2. Neon migrate `0001`~`0003`. 시드됐으면 **seed 금지**
3. env: `DATABASE_URL`, `OPENAI_API_KEY`(+상한), `ADMIN_PASSWORD`
4. `main` 머지 → 랜딩이 2,000만·가계부 없음
5. `DATABASE_URL`을 로컬 `.env`에 — 이후 `/demo`는 집에서도

VERIFY 1·4·6·10·19·20. migrate 없이 main 올리면 `/home` 깨짐.

---

## 6. 환경

- `~/projects/jedaero` · `CLAUDE.md` C1~C11
- Neon HTTP만. 로컬 TCP Postgres 불가
- 브라우저: Chrome
- `npx tsc --noEmit` / `npx eslint .` / `bash scripts/verify.sh` (DB 없으면 절반 FAIL 정상)

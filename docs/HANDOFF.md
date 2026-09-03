# 핸드오프 — 2026-09-03 (4차 갱신)

다음 세션이 이걸 먼저 읽고 바로 이어가면 된다.
설계 근거는 `docs/DESIGN-DECISIONS.md`에 있다. **이 문서는 "지금 어디까지 왔고 다음에 뭘 하나"만 다룬다.**

---

## 0. 상황

- **제출 마감 2026-09-07 10:00** — 오늘 09-03 기준 **D-4**
- 배포 URL이 **09-07 11:00 ~ 09-11 23:59** 열려 있어야 함. 미접근 시 결격
- **심사 기간 5일이 전부 평일이다** (09-07 월 ~ 09-11 금). 주말이 하루도 없다.
  → 평일 화면이 심사에서 실제로 평가받는 화면이고, `/demo` 요일 토글이 결격 방지 장치다
- 동료 합류 09-04. GitHub·Vercel 권한은 **이미 있다.** 내일은 연결 문자열이 오면 로컬 `/home`을 열고, 푸시 뒤 배포를 같이 하면 된다.

---

## 1. 접근 권한 (09-03 저녁 확인)

| 무엇 | 상태 |
|---|---|
| GitHub `quantsquirrel/jedaero` | 동료 **`jonnykkk16`** write collaborator. 초대 대기가 아님. 이 계정 커밋은 아직 없음 |
| Vercel | **동료에게 프로젝트 권한이 있다.** 아이디를 다시 받을 필요 없음. 이 머신에는 CLI·대시보드가 없어 멤버십을 대조하지는 못함 |
| 로컬 `.env` | `KRX_API_KEY`·`DATA_GO_KR_API_KEY`만 있음. **`DATABASE_URL` 없음** → `/home` 이후는 브라우저 미확인 |

동료 Vercel ID는 배포 전제가 아니다. 한 사람 화면에서 GitHub 연결·환경변수만 넣으면 된다.

**동료에게 요청한 것** (로컬 작업을 푸는 순서):

1. Vercel env에서 `DATABASE_URL` (필수). 있으면 `DATABASE_URL_UNPOOLED`
2. 있으면 `OPENAI_API_KEY`, `ADMIN_PASSWORD` — UI만 볼 때는 없어도 됨
3. Neon migrate/seed가 이미 됐는지, 같은 DB에 로컬 migrate/seed를 돌려도 되는지
4. (있으면 좋음) 이 쪽 Vercel 이메일을 프로젝트 Member로 초대 — 없어도 오늘 작업은 됨

키는 채팅·커밋에 넣지 않는다. 받으면 `.env`에만 넣는다.
시드가 아직이면 여기서 `npm run db:migrate` / `npm run seed`를 돌려도 된다. 이미 시드된 운영 DB면 migrate만 하고 seed는 건드리지 않는다.

---

## 2. 현재 브랜치

```
feat/landing-redesign        ← origin보다 7커밋 ahead. 오후 흐름 정비·문서 정합은 아직 커밋 안 됨
```

`jedaero.vercel.app`은 여전히 `main`(482ee94). 에이전트는 배포를 실행하지 않는다.

미머지 보안 PR 5건 (#1~#5) 열려 있음. **#5는 `scripts/seed.ts`와 충돌 가능.**

푸시: `git -c credential.helper='!gh auth git-credential' push`

---

## 3. 09-03 오후에 한 것 — 사용 흐름 정비 + 문서 정합

PM 점검 기록은 채팅 옆 캔버스 `user-flow-audit.canvas.tsx`.

심사자 기본 경로가 평일 빈 홈으로 떨어지는 것이 가장 큰 구멍이었다. 브리핑룸은 만들지 않았다.
이미 있는 조각으로 평일을 정직하게 만들었다.

| 항목 | 내용 |
|---|---|
| 유령 카피 | 퀘스트·지출 기록·봉급·교통비 면제·시드 2,020만 문구 제거 |
| 학습 2·3 | 「분산이 줄이는 것과 줄이지 못하는 것」 / 「매일 보는 숫자와 주 단위로 보는 숫자는 다르다」 |
| 지표 교체 | 평일 포트폴리오: 누적 수익률 공개. 이번 주 변동은 주말에만 |
| 오늘의 지형 | 홈·학습 평일에 6전선 등락 표시. 내 손익 가중·AI 브리핑은 주말 |
| 데모 토글 | 「주말에서 무엇이 열리는지」 한 줄 |
| 네비 | 「리그」 → 「지수」. 자물쇠 화면에 학습·그룹 출구 |
| 랜딩 평일 목록 | 브리핑·작전계획 약속 삭제. 실재 기능으로 교체 |
| 내부 문서 | `SPEC.md`·`README.md`·`PROMPT.md`·`CLAUDE.md`·`docs/SEED.md`·`docs/VERIFY.md`·`docs/DESIGN-DECISIONS.md`를 현재 제품(테이블 10·시드 2,000만·가계부/퀘스트 없음)에 맞춤 |

**브라우저로 확인한 화면은 여전히 `/`와 `/onboarding`뿐.** DB 없음.

---

## 4. 다음 — URL이 오면 오늘, 배포는 09-04

**`DATABASE_URL`이 오는 즉시 (오늘이어도):**

```
.env에 DATABASE_URL 기입
npm run db:migrate          # 시드 여부 확인 후
npm run seed                # 미시드일 때만
next dev  →  /home · /demo · 편성기 · 지수 눈으로 확인
```

**09-04 배포 (동료 Vercel 화면에서):**

```
git -c credential.helper='!gh auth git-credential' push
Vercel에 GitHub 레포 연결 (아직이면) + 환경변수 확인
  DATABASE_URL, OPENAI_API_KEY(+상한), ADMIN_PASSWORD
```

그 다음 `/demo`로 편성기·지수·그룹·평일/주말 토글을 눈으로 확인.
`docs/VERIFY.md` 시나리오 1·4·6·10·19·20이 이번 흐름 정비를 반영한다.

GitHub write는 이미 있다. Vercel 권한도 동료에게 있다. 막힌 것은 연결 문자열 공유와 푸시 후 Production 연결뿐이다.

---

## 5. 그 다음 기능 (DB 이후)

- **브리핑룸** — 심사 메인. 아직 미착수. 지금은 홈의 「오늘의 지형」이 그 자리의 최소판
- **작전계획 → 명령하달**
- **설정 탭** — 계급·군종·전역일. 전역 D-Day를 여기로
- **사회복무요원(공익)** 군종
- 도상훈련 · 일별 종가 API · 게임화 일괄 라운드

---

## 6. 미해결 — 판단이 필요한 것

### 6-1. 「종심 방어」가 성과 두 축을 모두 지배한다

온보딩 맥락 문구(`components/onboarding-form.tsx`)로 막고 있음. **지우지 말 것.**
구조적 해소는 시드 구간이 길어질 때.

### 6-2. 용어

전선 / 테마. 하단 네비는 이제 홈 · 포트폴리오 · 지수 · 학습.

### 6-3. 랜딩 3번 섹션 조작 가능화

미결정. 연합작전 배분을 정적으로 보여준다.

---

## 7. 환경 함정

- 세션은 `~/projects/jedaero`에서 시작. `CLAUDE.md` C1~C11
- `.env`에 `DATABASE_URL` 없음. Neon HTTP만 붙음. 로컬 Postgres 불가
- push: `git -c credential.helper='!gh auth git-credential' push`
- 브라우저: Chrome. Arc 확장 실패
- `SPEC.md`는 09-03 제품 기준으로 맞춤. 가계부·퀘스트·2,020만은 명세에서 뺐다

검증:

```
npx tsc --noEmit
npx eslint .
bash scripts/verify.sh   # DB 없으면 절반 FAIL — 정상
```

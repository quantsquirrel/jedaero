# Attribution — 이 빌드가 무엇에서 무엇을 가져왔나

출처 «신원»은 스카우트가 소유한다 (`.omd/reference-board.json`). 이 문서는 핸드가 실제로
전이한 것과 그것이 «어디에 내려앉았는지»만 사니타이즈된 소스 키로 적는다. 픽셀·스크린샷·
카피를 옮긴 것은 없다. 전부 구조 규칙과 토큰 «관계»의 전이다.

## 토큰 그룹별 출처 (기계 판독용)

| Group | Source |
|---|---|
| color | theory/color |
| type | theory/typography |
| spacing | theory/layout |
| radius | theory/components |
| motion | theory/motion |

이 다섯 줄은 «어느 팩 문서의 원리를 따랐는가»다. 실제 «값»은 전부 `app/globals.css`의
기존 토큰이고 이 실행에서 새 값을 하나도 만들지 않았다. 아래는 스카우트 레코드에서 전이한
구조 규칙과 그것이 내려앉은 자리다.

## 구성(composition) — 스카우트 레코드에서 전이한 것

### `SEGMENTED-PARTIAL-LOCK` → 모든 앱 화면 상단 · `[data-region="day-state"]`
- 가져온 규칙: 부분적으로 닫힌 옵션 그룹은 트랙 «전체»를 살려 두고 닫힌 라벨의 대비만 내린다. 선택은 표면 한 단으로 말한다. 닫힌 모드가 무엇을 여는지 평문 한 줄을 붙인다.
- 이 빌드에서: `components/demo-toggle.tsx` 전면 재작성. 활성 알약 `bg-primary` → `bg-secondary ring-border`. 닫힌 칸은 `border-input`으로 만질 수 있음을 유지. 「그때 열리는 것: …」 한 줄. 두 칸 모두 `min-h-11`. 평일 첫 페인트의 가장 큰 객체.

### `SEGMENTED-RAISED-INSET` → `/portfolio` · `[data-region="day-mode"]`
- 가져온 규칙: 선택된 칸은 «들린 인셋 면 + 테두리»이지 강조색 채움이 아니다. 모든 칸의 패딩·글자 굵기가 같아 선택이 움직여도 리플로가 없다.
- 이 빌드에서: 요일 배너 버튼 그룹. 같은 해부를 `components/drill-deck.tsx`의 시나리오 탭 3개와 겹쳐보기 토글에도 적용 (전부 `bg-primary` → 표면 한 단).

### `STEPPER-LOCKED-STATE` → `/portfolio` · `[data-region="allocation-editor"]`
- 가져온 규칙: 잠긴 상태는 기하와 크기를 그대로 두고 전경·테두리 «대비만» 내린다. 여섯 행을 한 덩어리로 잠그되 각 행은 실제 현재값을 계속 보인다.
- 이 빌드에서: `components/weight-editor.tsx`의 여섯 전선을 `divide-y` 한 블록으로 묶었다. 회색 오버레이 없음. 잠겨도 값·`+`/`−`·행 높이가 그대로이고 사유 문장이 같은 카드 안에 남는다 (선택 조건 1).

### `WEIGHTED-SEGMENT-METER` → `/portfolio` · `[data-region="reserve"]`
- 가져온 규칙: 한 트랙에 채워진 칸들 + 채워지지 않은 꼬리. 칸의 폭이 곧 수량이고 «남은 것»이 같은 읽기 안에 있다.
- 이 빌드에서: `components/point-tray.tsx` 20칸. 채워진 칸은 차트 사다리(`--chart-3`), 예비대는 점선 빈 칸. 「배치 18 · 예비대 2」로 이름과 수를 함께 적는다. 트랙에 신호색이 없다.

### `TASK-LIST-STATUS` → `/home`, `/league`, `/insights` · `[data-region="job-links"]`
- 가져온 규칙: 각 행은 이름 + 오른쪽 상태 낱말. «지금 열려 있는 것»에만 무게를 주고 끝난 것은 꾸미지 않는다. 힌트는 이름 아래 한 줄.
- 이 빌드에서: `components/job-links.tsx`. `primary` 행만 `py-4 + text-base`로 크기가 다르고 나머지는 `py-3 + text-sm`. 평일 `/home`의 「명령하달 초안」이 그 하나가 되도록 바꿨다.

### `SIGNED-DELTA-ROW` → `/home` · `[data-region="home-figure"]`
- 가져온 규칙: 작은 물러난 라벨 위 큰 tabular 숫자. 등락 색은 «별도의 작은 표식»에만 닿고 표제 숫자에는 닿지 않는다. 부호는 항상 있다.
- 이 빌드에서: 홈 「누적 수익률」 블록. `lib/format.ts`의 `pct()`가 U+2212/`+`를 항상 붙인다 (색각 대응).

### `DENSE-STATUS-TABLE` → `/portfolio` · `[data-region="front-terrain"]`
- 가져온 규칙: 상태 열«만» 색을 갖고 나머지 열은 중립 텍스트. 데이터가 뼈대보다 무겁다.
- 이 빌드에서: 「목표 vs 현재 비중」. 이름·목표·현재는 중립, `--up`/`--down`은 편차 열에만. 신호색 없음.

거절한 전이: `CONTINUOUS-SLIDER-ANTI`(안티레퍼런스 — 슬라이더 금지, `+`/`−`만), `STEPPER-HOVER-ANTI`
(안티레퍼런스 — 호버로만 드러나는 컨트롤 금지. 이 앱은 손가락으로 쓴다).

## 토큰 — 새로 만든 것 없음

색·반지름·간격 값은 전부 `app/globals.css`의 기존 토큰이다. 이 실행에서 «값»을 하나도
추가하지 않았고, 사다리 안에서 어느 단을 쓰는지만 바꿨다 (`--chart-1` → `--chart-3`,
`components/point-tray.tsx`. 근거는 `.omd/decisions.md`). 리터럴 색 클래스 0개.

## 그래픽 — 저장소 안의 재료만

`components/desktop-surround.tsx`의 능선 세 겹은 이 저장소의 기존 능선 모티프
(`components/ridge.tsx`, `components/front-terrain.tsx`)와 같은 어휘로 직접 그린 인라인 SVG다.
외부 에셋·사진·아이콘 라이브러리·AI 생성 이미지를 «하나도» 쓰지 않았다. 색은 `--chart-5` 하나.
아이콘은 기존 `lucide-react`(하단 네비) 그대로이고 새로 추가한 것이 없다.
폰트는 기존 자가 호스팅 IBM Plex Sans KR / IBM Plex Mono (`next/font`, `app/layout.tsx`).
런타임 외부 폰트 호출 없음 (docs/DESIGN-RULES.md §2).

## 모션 — 없음

`motionDecision: none`. 이 실행은 시간 기반 장면을 «만들지 않았다».
기존 모션은 둘뿐이고 둘 다 `prefers-reduced-motion`을 지킨다:
`components/reveal.tsx`(랜딩 스크롤 진입 페이드, `motion-reduce:transition-none` + JS에서
`matchMedia('(prefers-reduced-motion: reduce)')` 즉시 표시), 랜딩 CTA의 hover translate
(`motion-reduce:transition-none motion-reduce:hover:translate-y-0`).
이 실행이 모션에 한 일은 «줄인 것»뿐이다 — `transition-all` 4곳을 실제로 움직이는 속성만
명시하도록 바꿨다 (`app/page.tsx`, `components/reveal.tsx`, `components/ui/button.tsx`,
`components/ui/badge.tsx`). 새 장면 0개.

## 정적 템플릿 이탈 (motionDecision: none이 요구하는 것)

이탈 대상으로 지목된 템플릿은 «evenly-weighted panels의 generic admin/dashboard»다.
이탈은 정적이고 기능적이다: (1) 화면마다 «들린 표면 띠» 하나(`lib/lead-band.ts`)가 작업 대상을
형제 카드에서 밝기로 떼어낸다, (2) 평일 화면의 빈 자리를 이미 계산돼 있는 사실로 채워
정보 밀도를 올린다, (3) 데스크톱 좌우가 검정이 아니라 야간 지형이 된다. 테마·은유·기억에
남는 순간을 넣지 않았다.

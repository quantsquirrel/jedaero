#!/usr/bin/env bash
# 검증 스크립트 — docs/VERIFY.md §A 형식.
# 각 항목을 [ID] PASS|FAIL 한 줄로 출력하고, 하나라도 FAIL이면 exit 1.
cd "$(dirname "$0")/.." || exit 1

# .env.local 로드
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi

ANY_FAIL=0; P0P=0; P0T=0; P1P=0; P1T=0
report() { # id status msg
  printf '[%s] %s  %s\n' "$1" "$2" "$3"
  case "$1" in
    P0-*) P0T=$((P0T + 1)); [ "$2" = PASS ] && P0P=$((P0P + 1)) ;;
    P1-*) P1T=$((P1T + 1)); [ "$2" = PASS ] && P1P=$((P1P + 1)) ;;
  esac
  [ "$2" = FAIL ] && ANY_FAIL=1
  return 0
}
# DB 판정은 psql 바이너리가 아니라 프로젝트의 pg 드라이버로 한다.
# psql이 없는 머신에서 「스키마 깨짐」과 「도구 없음」이 똑같이 FAIL로 찍히던 문제를 없앤다.
# 한 번만 실행해 결과를 담아 두고, 각 항목은 그 줄을 꺼내 쓴다.
DB_PROBE=$(npx tsx scripts/checks/db-probe.ts 2>/dev/null | grep -E '^P[01]-[0-9]+\|')
probe() { # id — 해당 항목을 report 한다
  local line status msg
  line=$(printf '%s\n' "$DB_PROBE" | grep -m1 "^$1|")
  if [ -z "$line" ]; then
    report "$1" FAIL "DB 검사를 실행하지 못했습니다 (미구현 아님)"
    return 0
  fi
  status=${line#*|}; status=${status%%|*}
  msg=${line#*|}; msg=${msg#*|}
  report "$1" "$status" "$msg"
}
run_check() { # id tsx파일 — 스크립트가 마지막 줄에 사유를 출력하고 exit code로 판정
  local out
  if out=$(npx tsx "$2" 2>&1); then
    report "$1" PASS "$(echo "$out" | tail -1)"
  else
    report "$1" FAIL "$(echo "$out" | tail -1)"
  fi
}

# ---------- P0 ----------

# P0-01 빌드
if npm run build >.verify-build.log 2>&1; then
  report P0-01 PASS "npm run build exit 0"
  BUILD_OK=1
else
  report P0-01 FAIL "npm run build 실패 — .verify-build.log 참조"
  BUILD_OK=0
fi

# P0-02 스키마: public 스키마 테이블 정확히 11개(ai_calls·drafts 포함), 목록 일치
# quests·quest_progress는 퀘스트·XP 폐지로,
# budget_months·budget_envelopes·expenses·exemption_claims는 가계부 제외로 제거됐다. 되살리지 말 것.
probe P0-02

# P0-03 부대 정보 없음 — docs/VERIFY.md §A-1 스코프 규칙 그대로.
# 검사 대상: db/schema.ts, db/migrations/*.sql, app/**/*.tsx, components/**/*.tsx 만.
# lib/filters/unit-filter.ts·테스트·문서는 대상에 넣지 않는다 (AI-5 필터의 정규식은 합법).
UNIT_RE='unit_id|unitId|unit_name|unitName|division|battalion|regiment|brigade|소속부대|부대명|사단|여단|연대|대대|중대|소대'
SCOPE_FILES=$(
  { [ -f db/schema.ts ] && echo db/schema.ts
    ls db/migrations/*.sql 2>/dev/null
    find app components -name '*.tsx' 2>/dev/null; } | sort -u
)
HITS=$(echo "$SCOPE_FILES" | xargs -r grep -nE "$UNIT_RE" 2>/dev/null)
if [ -z "$HITS" ]; then
  report P0-03 PASS "A-1 스코프 내 부대 정보 패턴 0건"
else
  report P0-03 FAIL "$(echo "$HITS" | head -1) 외 $(echo "$HITS" | wc -l | tr -d ' ')건"
fi

# P0-04 금지 구조: holdings 테이블·cash_balance 컬럼 없음 (DB 기준)
probe P0-04

# P0-05 주 1회 제약: allocations UNIQUE(user_id, week_of)
probe P0-05

# P0-06 디바이스 권한 API 참조 0건 (코드만, 문서·설정 제외)
DEV_HITS=$(grep -rnE 'getUserMedia|navigator\.geolocation|navigator\.bluetooth' app lib components db --include='*.ts' --include='*.tsx' 2>/dev/null)
if [ -z "$DEV_HITS" ]; then
  report P0-06 PASS "getUserMedia/geolocation/bluetooth 참조 0건"
else
  report P0-06 FAIL "$(echo "$DEV_HITS" | head -1)"
fi

# P0-07 요일 판정 / P0-08 마감 시각
run_check P0-07 scripts/checks/p0-07-day-type.ts
run_check P0-08 scripts/checks/p0-08-rebalance.ts

# P0-09 주 1회 강제: 같은 (user_id, week_of) 2회 insert → 제약 위반 후 롤백
probe P0-09

# P0-10 예시 배분 합계
run_check P0-10 scripts/checks/p0-10-templates.ts

# P0-11 가격 시드 드로다운: 위험 4축 대표 -15% 이상, 채권 -8% 이내, 금·원자재 전구간 +
probe P0-11

# P0-12 키 유출: 클라이언트 번들에 실제 비밀값·API 키 패턴 0건
if [ ! -d .next/static ]; then
  report P0-12 FAIL "빌드 산출물(.next/static) 없음"
else
  LEAK=""
  if [ -f .env.local ]; then
    while IFS='=' read -r k v; do
      case "$k" in
        DATABASE_URL | OPENAI_API_KEY | ANTHROPIC_API_KEY | ADMIN_PASSWORD)
          v=${v%\"}; v=${v#\"}
          [ -n "$v" ] && grep -rqF "$v" .next/static 2>/dev/null && LEAK="$LEAK $k"
          ;;
      esac
    done <.env.local
  fi
  grep -rqE 'sk-(proj|ant)-[A-Za-z0-9_-]{10}' .next/static 2>/dev/null && LEAK="$LEAK sk-패턴"
  if [ -z "$LEAK" ]; then
    report P0-12 PASS "클라이언트 번들에 키 문자열 0건"
  else
    report P0-12 FAIL "번들에서 발견:$LEAK"
  fi
fi

# P0-13 데모 접근: 재진입·요일 왕복에도 같은 사용자 쿠키 유지
if [ ! -e app/demo/page.tsx ] && [ ! -e app/demo/route.ts ]; then
  report P0-13 FAIL "/demo 라우트 없음 (2단계)"
elif [ "$BUILD_OK" != 1 ]; then
  report P0-13 FAIL "빌드 실패로 서버 기동 불가"
else
  npx next start -p 3130 >/dev/null 2>&1 &
  SRV=$!
  READY=0
  for _ in $(seq 1 40); do
    curl -sf -o /dev/null http://localhost:3130/ && READY=1 && break
    sleep 0.5
  done
  if [ "$READY" = 1 ]; then
    DEMO_JAR=$(mktemp)
    C1=$(curl -sL -o /dev/null -w '%{http_code}' -c "$DEMO_JAR" -b "$DEMO_JAR" http://localhost:3130/demo)
    USER1=$(awk '$6 == "user_id" {print $7}' "$DEMO_JAR")
    C2=$(curl -sL -o /dev/null -w '%{http_code}' -c "$DEMO_JAR" -b "$DEMO_JAR" http://localhost:3130/demo)
    USER2=$(awk '$6 == "user_id" {print $7}' "$DEMO_JAR")
    ACTION_ID=$(node -e "const m=require('./.next/server/server-reference-manifest.json').node; process.stdout.write(Object.entries(m).find(([,v])=>v.exportedName==='setDemoDay')?.[0] ?? '')")
    CW=$(curl -s -o /dev/null -w '%{http_code}' -c "$DEMO_JAR" -b "$DEMO_JAR" -X POST http://localhost:3130/home -H "Next-Action: $ACTION_ID" -H 'Accept: text/x-component' -H 'Content-Type: text/plain;charset=UTF-8' --data-binary '["WEEKEND"]')
    WEEKEND_DAY=$(awk '$6 == "demo_day" {print $7}' "$DEMO_JAR")
    WEEKEND_USER=$(awk '$6 == "user_id" {print $7}' "$DEMO_JAR")
    CD=$(curl -s -o /dev/null -w '%{http_code}' -c "$DEMO_JAR" -b "$DEMO_JAR" -X POST http://localhost:3130/home -H "Next-Action: $ACTION_ID" -H 'Accept: text/x-component' -H 'Content-Type: text/plain;charset=UTF-8' --data-binary '["WEEKDAY"]')
    WEEKDAY_DAY=$(awk '$6 == "demo_day" {print $7}' "$DEMO_JAR")
    WEEKDAY_USER=$(awk '$6 == "user_id" {print $7}' "$DEMO_JAR")
    if [ "$C1" = 200 ] && [ "$C2" = 200 ] && [ "$CW" = 200 ] && [ "$CD" = 200 ] && [ -n "$USER1" ] && [ "$USER1" = "$USER2" ] && [ "$USER2" = "$WEEKEND_USER" ] && [ "$WEEKEND_USER" = "$WEEKDAY_USER" ] && [ "$WEEKEND_DAY" = WEEKEND ] && [ "$WEEKDAY_DAY" = WEEKDAY ]; then
      report P0-13 PASS "재진입·평일↔주말 전환 뒤 user_id 유지"
    else
      report P0-13 FAIL "demo=$C1/$C2 action=$CW/$CD user 유지=$([ "$USER1" = "$WEEKDAY_USER" ] && echo yes || echo no) day=$WEEKEND_DAY/$WEEKDAY_DAY"
    fi
  else
    report P0-13 FAIL "next start 기동 실패"
  fi
  kill "$SRV" 2>/dev/null
  wait "$SRV" 2>/dev/null
fi

# P0-14 AI 고지 배지: 배지 컴포넌트 존재 + AI 응답 렌더러가 사용
BADGE_FILE=$(grep -rlF '생성형 AI' components --include='*.tsx' 2>/dev/null | head -1)
BADGE_USED=$(grep -rlE "AiNotice" app components --include='*.tsx' 2>/dev/null | grep -v 'ai-notice' | head -1)
if [ -n "$BADGE_FILE" ] && [ -n "$BADGE_USED" ]; then
  report P0-14 PASS "고지 배지 $BADGE_FILE — $BADGE_USED 에서 사용"
else
  report P0-14 FAIL "배지 컴포넌트(${BADGE_FILE:-없음}) 또는 사용처(${BADGE_USED:-없음}) 없음"
fi

# ---------- P1 ----------

# P1-01 하위 테마 배치 (구 「적립 곡선」 폐지 후 번호 재사용)
run_check P1-01 scripts/checks/p1-01-details.ts

# P1-02 합산 금지: app/·components/ .tsx에서 총 자산·총 평가액·totalAssets·combinedValue 0건
# 곡선이 하나가 된 뒤에도 남긴다 — 이 표기가 되살아나는 것 자체가 두 번째 곡선이 생겼다는 신호다.
SUM_HITS=$(grep -rnE '총 자산|총 평가액|totalAssets|combinedValue' app components --include='*.tsx' 2>/dev/null)
if [ -z "$SUM_HITS" ]; then
  report P1-02 PASS "합산 표기 0건"
else
  report P1-02 FAIL "$(echo "$SUM_HITS" | head -1)"
fi

run_check P1-03 scripts/checks/p1-03-twr.ts

# P1-04 랭킹 격리: 랭킹 로직이 적립 곡선을 참조하지 않음
if [ ! -f lib/league.ts ]; then
  report P1-04 FAIL "lib/league.ts 미구현 (3단계)"
else
  ISO_HITS=$(grep -nE 'accumul|monthly|적립' lib/league.ts)
  if [ -z "$ISO_HITS" ]; then
    report P1-04 PASS "랭킹 로직에 적립 곡선 참조 없음"
  else
    report P1-04 FAIL "$(echo "$ISO_HITS" | head -1)"
  fi
fi

run_check P1-05 scripts/checks/p1-05-jedaero-index.ts

# P1-06 폐지 — 퀘스트·XP 제거 (DESIGN-DECISIONS §7). 번호는 상호참조를 위해 비워 둔다.

# P1-07 옵트인 기본값 false
probe P1-07

run_check P1-08 scripts/checks/p1-08-optin.ts
run_check P1-09 scripts/checks/p1-09-kanon.ts

# P1-10 그룹 API 응답에 수익률 필드 없음
GROUP_FILES=$(ls lib/groups.ts 2>/dev/null; find app -path '*groups*' \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null)
if [ -z "$GROUP_FILES" ]; then
  report P1-10 FAIL "그룹 구현 없음 (3단계)"
else
  GR_HITS=$(echo "$GROUP_FILES" | xargs -r grep -nE 'twrPct|twr_pct|returnPct' 2>/dev/null)
  if [ -z "$GR_HITS" ]; then
    report P1-10 PASS "그룹 코드에 수익률 필드 참조 0건"
  else
    report P1-10 FAIL "$(echo "$GR_HITS" | head -1)"
  fi
fi

run_check P1-11 scripts/checks/p1-11-unit-filter.ts
run_check P1-12 scripts/checks/p1-12-injection.ts
run_check P1-13 scripts/checks/p1-13-guard.ts

# P1-14 목표 vs 현재 갭 회귀 (P0-1) / P1-15 AI-4 주간 시황 계산
# P1-16 LLM 출력 검증(조언·라벨·전망). P1-17은 폐지 (AI-2 봉투 제안 — 가계부 제외)
run_check P1-14 scripts/checks/p1-14-gap.ts
run_check P1-15 scripts/checks/p1-15-market-week.ts
run_check P1-16 scripts/checks/p1-16-output-guard.ts
run_check P1-18 scripts/checks/p1-18-drill.ts
run_check P1-19 scripts/checks/p1-19-weekday-briefing.ts
run_check P1-20 scripts/checks/p1-20-krx-map.ts
run_check P1-21 scripts/checks/p1-21-number-guard.ts
run_check P1-22 scripts/checks/p1-22-drafts.ts
run_check P1-23 scripts/checks/p1-23-weekly-turnover.ts
run_check P1-24 scripts/checks/p1-24-security-hardening.ts
run_check P1-25 scripts/checks/p1-25-benchmarks.ts
run_check P1-26 scripts/checks/p1-26-principles-copy.ts
run_check P1-27 scripts/checks/p1-27-principles-ai.ts
run_check P1-28 scripts/checks/p1-28-audit-fixes.ts
run_check P1-29 scripts/checks/p1-29-judge-ux.ts

# ---------- 요약 ----------
echo '---'
printf 'P0: %d/%d PASS   P1: %d/%d PASS\n' "$P0P" "$P0T" "$P1P" "$P1T"
exit $ANY_FAIL

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
q() { psql "$DATABASE_URL" -X -A -t -c "$1" 2>/dev/null; }
have_db() { [ -n "${DATABASE_URL:-}" ]; }
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
EXPECTED="ai_calls allocations drafts group_members groups holidays prices settings tickers users weekly_scores"
if ! have_db; then
  report P0-02 FAIL "DATABASE_URL 없음"
else
  ACTUAL=$(q "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1" | tr '\n' ' ' | sed 's/ *$//')
  if [ "$ACTUAL" = "$EXPECTED" ]; then
    report P0-02 PASS "테이블 11개 목록 일치"
  else
    report P0-02 FAIL "테이블 불일치: [${ACTUAL:-없음}]"
  fi
fi

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
if ! have_db; then
  report P0-04 FAIL "DATABASE_URL 없음"
else
  H=$(q "SELECT coalesce(to_regclass('public.holdings')::text, '없음')")
  CB=$(q "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND column_name='cash_balance'")
  if [ "$H" = "없음" ] && [ "$CB" = "0" ]; then
    report P0-04 PASS "holdings 테이블 없음, cash_balance 컬럼 없음"
  else
    report P0-04 FAIL "holdings=$H, cash_balance 컬럼 ${CB:-?}개"
  fi
fi

# P0-05 주 1회 제약: allocations UNIQUE(user_id, week_of)
if ! have_db; then
  report P0-05 FAIL "DATABASE_URL 없음"
else
  U=$(q "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND tablename='allocations' AND indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%user_id%' AND indexdef LIKE '%week_of%'")
  if [ "${U:-0}" -ge 1 ]; then
    report P0-05 PASS "UNIQUE(user_id, week_of) 존재"
  else
    report P0-05 FAIL "allocations에 UNIQUE(user_id, week_of) 없음"
  fi
fi

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
if ! have_db; then
  report P0-09 FAIL "DATABASE_URL 없음"
else
  OUT=$(psql "$DATABASE_URL" -X -q 2>&1 <<'SQL'
BEGIN;
INSERT INTO users (id, nickname, rank, branch, enlisted_at, discharge_at, home_distance)
VALUES ('00000000-0000-0000-0000-000000000901', '검증용', 'PRIVATE', 'ARMY', '2026-01-01', '2027-06-30', 'NEAR');
INSERT INTO allocations (user_id, week_of, weights, decided_at, effective_from)
VALUES ('00000000-0000-0000-0000-000000000901', '2099-01', '{}'::jsonb, now(), '2099-01-04');
INSERT INTO allocations (user_id, week_of, weights, decided_at, effective_from)
VALUES ('00000000-0000-0000-0000-000000000901', '2099-01', '{}'::jsonb, now(), '2099-01-04');
ROLLBACK;
SQL
  )
  if echo "$OUT" | grep -q 'duplicate key value violates unique constraint'; then
    report P0-09 PASS "같은 주 2회 insert → unique_violation 발생 (롤백됨)"
  else
    report P0-09 FAIL "제약 위반이 발생하지 않음: $(echo "$OUT" | head -1)"
  fi
fi

# P0-10 예시 배분 합계
run_check P0-10 scripts/checks/p0-10-templates.ts

# P0-11 가격 시드 드로다운 (합의안): 위험 4축 대표 -15% 이상, BOND_CASH 대표는 -8% 이내
if ! have_db; then
  report P0-11 FAIL "DATABASE_URL 없음"
else
  mdd_of() {
    q "SELECT round(((SELECT min(close::float8 / peak) FROM (SELECT close, max(close) OVER (ORDER BY trade_date) AS peak FROM prices WHERE ticker='$1') s) - 1) * 1000) / 10"
  }
  ret_of() {
    q "SELECT round(((SELECT close FROM prices WHERE ticker='$1' ORDER BY trade_date DESC LIMIT 1)::float8 / (SELECT close FROM prices WHERE ticker='$1' ORDER BY trade_date ASC LIMIT 1) - 1) * 1000) / 10"
  }
  DD_MSG=""; DD_FAIL=""
  # 위험 4전선 대표지수는 -15% 이상 빠지는 구간이 있어야 한다
  for pair in KR_STOCK:KR-IDX US_STOCK:US-IDX INTL_STOCK:IN-IDX REIT_INFRA:RE-IDX; do
    axis=${pair%%:*}; tk=${pair##*:}
    v=$(mdd_of "$tk")
    DD_MSG="$DD_MSG $axis ${v:-없음}%"
    [ -z "$v" ] && DD_FAIL="$DD_FAIL $axis(시드없음)" && continue
    awk "BEGIN{exit !($v <= -15)}" || DD_FAIL="$DD_FAIL $axis($v%)"
  done
  # 채권은 얕게 — 여섯 전선이 같이 빠지면 리밸런싱을 가르칠 재료가 사라진다
  vb=$(mdd_of BD-IDX)
  DD_MSG="$DD_MSG BOND ${vb:-없음}%"
  if [ -z "$vb" ]; then
    DD_FAIL="$DD_FAIL BOND(시드없음)"
  else
    awk "BEGIN{exit !($vb >= -8)}" || DD_FAIL="$DD_FAIL BOND($vb%)"
  fi
  # 금·원자재는 주식이 빠지는 구간에 오르도록 생성된다 — 전구간 수익률이 양수여야 한다
  vg=$(ret_of CM-IDX)
  DD_MSG="$DD_MSG GOLD_COMM 전구간 ${vg:-없음}%"
  if [ -z "$vg" ]; then
    DD_FAIL="$DD_FAIL GOLD_COMM(시드없음)"
  else
    awk "BEGIN{exit !($vg > 0)}" || DD_FAIL="$DD_FAIL GOLD_COMM(전구간 $vg%)"
  fi
  if [ -z "$DD_FAIL" ]; then
    report P0-11 PASS "대표 종목 MDD:$DD_MSG"
  else
    report P0-11 FAIL "기준 미달:$DD_FAIL (전체:$DD_MSG)"
  fi
fi

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

# P0-13 데모 접근: /demo 200, 요일 토글 평일·주말 모두 200
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
    C1=$(curl -sL -o /dev/null -w '%{http_code}' http://localhost:3130/demo)
    C2=$(curl -sL -o /dev/null -w '%{http_code}' -b 'demo_day=WEEKDAY' http://localhost:3130/demo)
    C3=$(curl -sL -o /dev/null -w '%{http_code}' -b 'demo_day=WEEKEND' http://localhost:3130/demo)
    if [ "$C1" = 200 ] && [ "$C2" = 200 ] && [ "$C3" = 200 ]; then
      report P0-13 PASS "/demo 200, 토글 평일 200, 주말 200"
    else
      report P0-13 FAIL "/demo $C1, 평일 $C2, 주말 $C3"
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
if ! have_db; then
  report P1-07 FAIL "DATABASE_URL 없음"
else
  DEF=$(q "SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='analytics_opt_in'")
  if echo "$DEF" | grep -q 'false'; then
    report P1-07 PASS "analytics_opt_in DEFAULT false"
  else
    report P1-07 FAIL "기본값: ${DEF:-없음}"
  fi
fi

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

# ---------- 요약 ----------
echo '---'
printf 'P0: %d/%d PASS   P1: %d/%d PASS\n' "$P0P" "$P0T" "$P1P" "$P1T"
exit $ANY_FAIL

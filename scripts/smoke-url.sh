#!/usr/bin/env bash
# 외부 스모크 — 배포 URL을 «팀원이 아닌 환경»에서 때린다.
#
#   bash scripts/smoke-url.sh https://jedaero.vercel.app
#
# 왜 있나: 내 기기·내 계정에서 열린 링크는 검증이 아니다. 심사자는 로그인 없는 새 세션,
# 모바일 회선, 시크릿 창에서 연다. 이 스크립트는 그 조건을 curl 로 흉내 낸다.
# 사람이 할 일은 §B 에 따로 있다 (이 스크립트가 대신하지 못하는 것).
#
# 출력은 docs/VERIFY.md §A 와 같은 [ID] PASS|FAIL 한 줄 형식. 하나라도 FAIL 이면 exit 1.
# 이 파일은 저장소·DB·환경변수를 전혀 읽지 않는다. 다른 기기에 복사해 그대로 실행할 수 있다.

set -u
BASE="${1:-}"
if [ -z "$BASE" ]; then
  echo "사용법: bash scripts/smoke-url.sh https://<배포 도메인>" >&2
  exit 2
fi
BASE="${BASE%/}"

JAR="$(mktemp -t jedaero-smoke.XXXXXX)"
TMP="$(mktemp -t jedaero-body.XXXXXX)"
trap 'rm -f "$JAR" "$TMP"' EXIT

ANY_FAIL=0; PASSN=0; TOTAL=0
report() { # id status msg
  printf '[%s] %s  %s\n' "$1" "$2" "$3"
  TOTAL=$((TOTAL + 1))
  [ "$2" = PASS ] && PASSN=$((PASSN + 1))
  [ "$2" = FAIL ] && ANY_FAIL=1
  return 0
}
UA_MOBILE='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

# get <path> [extra curl args...] → 상태코드를 echo, 본문은 $TMP
get() {
  local path="$1"; shift
  curl -s -o "$TMP" -w '%{http_code}' --max-time 30 -A "$UA_MOBILE" "$@" "$BASE$path"
}
has() { grep -qF -- "$1" "$TMP"; }
# 심사자가 절대 보면 안 되는 문자열 — Next 기본 오류·Vercel 보호벽·스택트레이스
FORBIDDEN='Application error|Internal Server Error|Vercel Authentication|vercel.com/login|Deployment Protection|at Object\.|node_modules/|\.tsx?:[0-9]+:[0-9]+'
clean() { ! grep -qE "$FORBIDDEN" "$TMP"; }

# ---------- S0 전제 ----------
case "$BASE" in
  https://*) report S0-01 PASS "https 주소" ;;
  *) report S0-01 FAIL "https 가 아님: $BASE (쿠키가 secure 라 http 에서는 세션이 안 붙는다)" ;;
esac

# ---------- S1 첫 화면 ----------
start=$(date +%s)
code=$(get /)
elapsed=$(( $(date +%s) - start ))
if [ "$code" = 200 ] && has '제대로' && has '3분 심사 데모 시작' && clean; then
  report S1-01 PASS "/ 200, 히어로·데모 버튼 확인, ${elapsed}s"
else
  report S1-01 FAIL "/ → $code (제대로:$(has '제대로' && echo y || echo n) 데모버튼:$(has '3분 심사 데모 시작' && echo y || echo n) 금지문자열:$(clean && echo 없음 || echo 있음))"
fi
# 첫 문장 기준선 — 랜딩 히어로 = SPEC §0 = 기획서 첫 문장 (docs/SUBMISSION-BASELINE.md)
if has '전역할 때 받게 될 목돈을, 복무 중에 미리 굴려보는'; then
  report S1-02 PASS "첫 화면 문장이 기준선과 일치"
else
  report S1-02 FAIL "첫 화면에 기준선 문장 없음 — 기획서 첫 문장과 어긋났을 수 있다"
fi
if has '교육용' && has '실제 거래'; then
  report S1-03 PASS "«교육용·실제 거래 없음» 고지 있음"
else
  report S1-03 FAIL "교육용·실제 거래 없음 고지가 첫 화면에 없음"
fi

# ---------- S2 데모 진입 (쿠키 없는 새 세션) ----------
rm -f "$JAR"
hdr="$(mktemp -t jedaero-hdr.XXXXXX)"
code=$(curl -s -o "$TMP" -D "$hdr" -w '%{http_code}' --max-time 60 -A "$UA_MOBILE" -c "$JAR" "$BASE/demo")
loc=$(grep -i '^location:' "$hdr" | tr -d '\r' | awk '{print $2}')
rm -f "$hdr"
if [ "$code" = 303 ] && echo "$loc" | grep -q '/home$'; then
  report S2-01 PASS "/demo → 303 → /home"
elif [ "$code" = 303 ] && echo "$loc" | grep -q '/demo/unavailable'; then
  report S2-01 FAIL "/demo 가 안내 화면으로 폴백됨 (저장소 실패). 화면은 비지 않지만 데모는 못 들어감"
else
  report S2-01 FAIL "/demo → $code (Location: ${loc:-없음})"
fi
if grep -q 'user_id' "$JAR" && grep -q 'demo_day' "$JAR"; then
  report S2-02 PASS "user_id · demo_day 쿠키 발급"
else
  report S2-02 FAIL "쿠키 미발급 (user_id:$(grep -q user_id "$JAR" && echo y || echo n) demo_day:$(grep -q demo_day "$JAR" && echo y || echo n))"
fi

# ---------- S3 데모 세션으로 앱 화면 전부 ----------
code=$(get /home -b "$JAR")
if [ "$code" = 200 ] && has '데모 · 지금은' && clean; then
  report S3-01 PASS "/home 200, 요일 토글 배너 있음"
else
  report S3-01 FAIL "/home → $code (토글배너:$(has '데모 · 지금은' && echo y || echo n) 금지문자열:$(clean && echo 없음 || echo 있음))"
fi
if has '다음 편성까지' || has '지금 편성할 수 있습니다'; then
  report S3-02 PASS "/home 최상단이 «다음 편성까지» 계열"
else
  report S3-02 FAIL "/home 최상단 문구 불일치"
fi
n=0
for p in /portfolio /league /learn /insights /groups; do
  n=$((n + 1))
  code=$(get "$p" -b "$JAR")
  if [ "$code" = 200 ] && clean; then
    report "S3-1$n" PASS "$p 200"
  else
    report "S3-1$n" FAIL "$p → $code (금지문자열:$(clean && echo 없음 || echo 있음))"
  fi
done

# ---------- S4 요일 토글 (쿠키 직접 지정 — 심사 5일이 전부 평일이므로 주말이 반드시 열려야 한다) ----------
UID_COOKIE=$(awk '$6=="user_id"{print $7}' "$JAR" | tail -1)
code=$(get /home -b "user_id=$UID_COOKIE; demo_day=WEEKEND")
if [ "$code" = 200 ] && has '주말 화면'; then
  report S4-01 PASS "demo_day=WEEKEND → 주말 화면"
else
  report S4-01 FAIL "주말 전환 실패 ($code)"
fi
code=$(get /portfolio -b "user_id=$UID_COOKIE; demo_day=WEEKEND")
if [ "$code" = 200 ] && ! has '주말에만 조정할 수 있습니다'; then
  report S4-02 PASS "주말 /portfolio 에 편성 조정 잠금 문구 없음"
else
  report S4-02 FAIL "주말인데 조정 잠금 ($code)"
fi
code=$(get /home -b "user_id=$UID_COOKIE; demo_day=WEEKDAY")
if [ "$code" = 200 ] && has '평일 화면'; then
  report S4-03 PASS "demo_day=WEEKDAY → 평일 화면"
else
  report S4-03 FAIL "평일 전환 실패 ($code)"
fi

# ---------- S5 오류·권한 경로 (빈 화면이 아니라 안내가 떠야 한다) ----------
code=$(get /home)   # 쿠키 없음
if [ "$code" = 200 ] && has '3분 심사 데모 시작'; then
  # curl 이 리다이렉트를 따라가지 않으므로 200 이면 홈이 세션 없이 열린 것
  report S5-01 FAIL "/home 이 세션 없이 200 — 리다이렉트가 없다"
elif [ "$code" = 307 ] || [ "$code" = 308 ] || [ "$code" = 302 ] || [ "$code" = 303 ]; then
  report S5-01 PASS "/home 세션 없음 → $code 리다이렉트"
else
  report S5-01 FAIL "/home 세션 없음 → $code"
fi
code=$(get /this-page-does-not-exist-9f3a)
if [ "$code" = 404 ] && has '이 주소에는 화면이 없습니다'; then
  report S5-02 PASS "404 커스텀 안내 화면"
else
  report S5-02 FAIL "404 → $code (커스텀안내:$(has '이 주소에는 화면이 없습니다' && echo y || echo n)) — Next/Vercel 기본 404 가 보인다"
fi
for p in /expenses /budget; do
  code=$(get "$p" -b "$JAR")
  if [ "$code" = 404 ]; then
    report "S5-03$(echo "$p" | tr -d /)" PASS "$p 404 (폐지 라우트가 되살아나지 않음)"
  else
    report "S5-03$(echo "$p" | tr -d /)" FAIL "$p → $code (폐지된 가계부 라우트가 응답한다)"
  fi
done
code=$(get /demo/unavailable)
if [ "$code" = 200 ] && has '데모 다시 시도'; then
  report S5-04 PASS "/demo/unavailable 안내 화면 열림 (저장소 실패 시 폴백 목적지)"
else
  report S5-04 FAIL "/demo/unavailable → $code"
fi

# ---------- S6 데스크톱 UA 로 한 번 더 ----------
code=$(curl -s -o "$TMP" -w '%{http_code}' --max-time 30 -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0 Safari/537.36' "$BASE/")
if [ "$code" = 200 ] && has '제대로'; then
  report S6-01 PASS "데스크톱 UA 도 200"
else
  report S6-01 FAIL "데스크톱 UA → $code"
fi

echo '---'
printf '외부 스모크: %d/%d PASS  (%s)\n' "$PASSN" "$TOTAL" "$BASE"
cat <<'EOF'

§B 사람이 직접 할 것 (이 스크립트가 못 하는 것):
  1. 팀원이 아닌 사람의 휴대폰, 모바일 회선(와이파이 끄고)에서 위 주소를 연다
  2. 시크릿 창에서 /demo → 토글 주말 → 편성 +/- → 확정 → 재시도 시 «이미 조정» 문구
  3. 학습 → 회고 «하락장에도 편성을 지켰다» → AI 배지 + 질문 1개 (AI 키 없으면 규칙 폴백 + 안내)
  4. 그룹명 «12사단 3대대» 차단 문구
  5. 화면 어디에도 «Application error», 영문 스택, Vercel 로그인 벽이 없는지
  결과는 docs/FAILURE-LOG.md 에 날짜·기기·회선과 함께 남긴다.
EOF
exit $ANY_FAIL

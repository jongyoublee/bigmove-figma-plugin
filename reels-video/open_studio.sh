#!/usr/bin/env bash
# Studio 띄우기 (11/12 사용자 요청: 이미 열린 탭이 있으면 새 창을 열지 않는다)
#   bash open_studio.sh [영상 ID]   예) bash open_studio.sh Phase1Pk
# 1) Studio가 꺼져 있으면 켜고(자동 창 열기 끔) 해당 영상 주소를 한 번 연다
# 2) 켜져 있고 브라우저 탭이 연결돼 있으면 아무것도 열지 않는다 (코드를 고치면 그 탭이 저절로 새로고침됨)
# 3) 켜져 있지만 열린 탭이 없으면 해당 영상 주소를 연다
cd "$(dirname "$0")" || exit 1
ID="${1:-Phase1Pk}"
URL="http://localhost:3000/$ID"
up() { [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || true)" = "200" ]; }
tabs() { netstat -ano | grep ':3000 ' | grep ESTABLISHED | grep -c '127.0.0.1:3000 ' ; }

if ! up; then
  nohup npx remotion studio --no-open > /dev/null 2>&1 &
  for _ in $(seq 1 60); do up && break; sleep 1; done
  up || { echo "Studio를 켜지 못함"; exit 1; }
  cmd //c start "" "$URL"
  echo "Studio를 켜고 $ID 화면을 열었음"
elif [ "$(tabs)" -gt 0 ]; then
  echo "이미 열린 Studio 탭이 있음 → 새 창 안 엶 (탭이 저절로 새로고침됨). 다른 영상이면 왼쪽 목록에서 $ID 선택"
else
  cmd //c start "" "$URL"
  echo "열린 탭이 없어서 $ID 화면을 열었음"
fi

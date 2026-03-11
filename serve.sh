#!/bin/bash
# ========================================
#   내 이야기를 들어줘! - 로컬 서버 시작
# ========================================
# Mac/Linux용 간단한 로컬 서버 실행 스크립트
# 사용법: bash serve.sh

echo "========================================"
echo "  내 이야기를 들어줘! - 로컬 서버 시작"
echo "========================================"
echo ""
echo "서버가 시작되면 브라우저에서 열립니다."
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

# 브라우저 자동 열기 (OS에 따라 다른 명령 사용)
if command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:8080 &
elif command -v open &> /dev/null; then
    # macOS
    open http://localhost:8080 &
fi

# Python 로컬 서버 실행 (python3 우선, 없으면 python 사용)
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
else
    echo "오류: Python이 설치되어 있지 않습니다."
    echo "Python을 설치한 후 다시 실행해주세요."
    exit 1
fi

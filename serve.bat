@echo off
chcp 65001 >nul
echo ========================================
echo   내 이야기를 들어줘! - 로컬 서버 시작
echo ========================================
echo.
echo 서버가 시작되면 브라우저에서 열립니다.
echo 종료하려면 Ctrl+C를 누르세요.
echo.
start http://localhost:8080
python -m http.server 8080

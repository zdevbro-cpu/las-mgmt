@echo off
echo ========================================
echo Vercel 빌드 에러 해결 스크립트
echo ========================================
echo.

echo [1/5] node_modules 삭제 중...
if exist node_modules rd /s /q node_modules
if exist package-lock.json del /q package-lock.json
echo ✓ 삭제 완료
echo.

echo [2/5] npm 캐시 클리어 중...
call npm cache clean --force
echo ✓ 캐시 클리어 완료
echo.

echo [3/5] 패키지 재설치 중...
call npm install
if %errorlevel% neq 0 (
    echo ✗ 설치 실패!
    pause
    exit /b 1
)
echo ✓ 설치 완료
echo.

echo [4/5] 로컬 빌드 테스트 중...
call npm run build
if %errorlevel% neq 0 (
    echo ✗ 빌드 실패!
    pause
    exit /b 1
)
echo ✓ 빌드 성공
echo.

echo [5/5] Git에 추가 중...
git add vercel.json .nvmrc package.json package-lock.json
git commit -m "Fix: Vercel build permission issue"
echo ✓ Git 커밋 완료
echo.

echo ========================================
echo ✅ 모든 작업 완료!
echo.
echo 다음 단계:
echo 1. git push 실행
echo 2. Vercel에서 캐시 없이 재배포
echo ========================================
pause

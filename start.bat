@echo off
chcp 65001 > nul
echo ========================================
echo  タスク管理アプリ 起動スクリプト
echo ========================================

echo.
echo [1/3] PostgreSQL を起動中...
docker compose up -d
if %errorlevel% neq 0 (
    echo エラー: Docker が起動していません。Docker Desktop を起動してから再実行してください。
    pause
    exit /b 1
)
echo PostgreSQL 起動完了

echo.
echo [2/3] バックエンド（Spring Boot）を起動中...
start "Backend" cmd /k "cd backend && gradlew.bat bootRun"

echo.
echo [3/3] フロントエンド（React）を起動中...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  起動完了
echo  フロントエンド: http://localhost:5173
echo  バックエンド:   http://localhost:8080
echo ========================================
echo.
echo ※ 各ターミナルウィンドウを閉じるとサーバーが停止します
pause

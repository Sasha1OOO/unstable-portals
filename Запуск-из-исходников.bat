@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Лаборатория нестабильных порталов — dev

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js не найден. Установите LTS с https://nodejs.org и запустите снова.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [*] Устанавливаю зависимости (один раз)...
  call npm install || (echo [!] npm install упал & pause & exit /b 1)
)

echo [*] Запускаю dev-сервер. Браузер откроется на http://localhost:5173
echo     Остановить — закрыть это окно или Ctrl+C.
call npm run dev
pause

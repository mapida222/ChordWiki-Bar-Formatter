@echo off
setlocal

cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found. Install Node.js 20.19 or later.
  pause
  exit /b 1
)

rem Vite opens the browser only after the development server is ready.
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort --open
if errorlevel 1 (
  echo.
  echo [ERROR] The development server could not start on port 5173.
  echo Close any other program using port 5173, then run this file again.
  pause
  exit /b 1
)

endlocal

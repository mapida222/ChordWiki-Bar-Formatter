@echo off
setlocal

cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found. Install Node.js 20.19 or later.
  pause
  exit /b 1
)

rem If this project's server is already running, just open the page.
powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:5173/"
  exit /b 0
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

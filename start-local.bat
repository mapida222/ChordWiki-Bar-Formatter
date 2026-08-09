@echo off
setlocal

cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found. Install Node.js 20.19 or later.
  pause
  exit /b 1
)

rem Open the page only after Vite starts accepting HTTP requests.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "$url = 'http://127.0.0.1:5173/'; for ($attempt = 0; $attempt -lt 80; $attempt++) { try { $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { Start-Process $url; exit 0 } } catch {}; Start-Sleep -Milliseconds 250 }"

npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
if errorlevel 1 (
  echo.
  echo [ERROR] The development server could not start on port 5173.
  echo Close any other program using port 5173, then run this file again.
  pause
  exit /b 1
)

endlocal

@echo off
setlocal

cd /d "%~dp0"

set "APP_URL=http://127.0.0.1:5173/committed-preview.html"

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm.cmd was not found.
    echo Install Node.js 20.19 or later.
    pause
    exit /b 1
)

rem 初回だけ依存パッケージを準備
if not exist "%~dp0node_modules\.bin\vite.cmd" (
    echo [INFO] Viteが見つからないため、依存パッケージをインストールします。
    set "NPM_CACHE=%TEMP%\chordwiki-bar-formatter-npm-cache"
    call npm.cmd install --cache "%NPM_CACHE%" --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

rem 最新版のサーバーが既に動いている場合だけ開く
powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/committed-preview.html' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500 -and $response.Content -match 'committed-measure-check') { exit 0 } } catch {}; exit 1" >nul 2>nul

if not errorlevel 1 (
    start "" "%APP_URL%"
    exit /b 0
)

rem Vite起動後にリアルタイムエディターを開く
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort --open /committed-preview.html

if errorlevel 1 (
    echo.
    echo [ERROR] The development server could not start on port 5173.
    echo Close any other program using port 5173, then run this file again.
    pause
    exit /b 1
)

endlocal

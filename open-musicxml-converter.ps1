$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appUrl = 'http://127.0.0.1:5173/musicxml-converter.html'

function Test-MusicXmlPage {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $appUrl -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500 -and $response.Content -match 'musicxml-converter-page.js'
  } catch {
    return $false
  }
}

try {
  if (Test-MusicXmlPage) {
    Start-Process $appUrl
    exit 0
  }

  $npm = Get-Command npm.cmd -ErrorAction Stop
  $vite = Join-Path $projectDir 'node_modules\.bin\vite.cmd'
  if (-not (Test-Path -LiteralPath $vite)) {
    Write-Host '[INFO] Installing Vite dependencies.'
    $cacheDir = Join-Path $env:TEMP 'chordwiki-bar-formatter-npm-cache'
    & $npm.Source install --cache $cacheDir --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
      throw 'npm install failed.'
    }
  }

  $serverProcess = Start-Process -FilePath $npm.Source -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory $projectDir -PassThru

  $deadline = (Get-Date).AddSeconds(20)
  do {
    Start-Sleep -Milliseconds 250
    if (Test-MusicXmlPage) {
      Start-Process $appUrl
      Wait-Process -Id $serverProcess.Id
      exit 0
    }
  } while ((Get-Date) -lt $deadline)

  throw 'MusicXML converter page did not start.'
} catch {
  Write-Host "[ERROR] $($_.Exception.Message)"
  Read-Host 'Press Enter to close'
  exit 1
}

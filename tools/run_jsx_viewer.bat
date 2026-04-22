@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "PORT=8765"
set "HTML_FILE=jsx_browser_viewer.html"
set "JSX_FILE="
set "PY_CMD="

for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "Get-ChildItem -LiteralPath . -File -Filter *.jsx | Sort-Object Name | Select-Object -ExpandProperty Name -First 1"`) do (
  set "JSX_FILE=%%F"
)

if not exist "%HTML_FILE%" (
  echo ERROR: %HTML_FILE% was not found in this folder.
  pause
  exit /b 1
)

if not defined JSX_FILE (
  echo ERROR: No .jsx file was found in this folder.
  echo Put the .jsx file in the same directory as this .bat and %HTML_FILE%.
  pause
  exit /b 1
)

py -3 -c "import sys" >nul 2>nul
if not errorlevel 1 (
  set "PY_CMD=py -3"
) else (
  python -c "import sys" >nul 2>nul
  if not errorlevel 1 (
    set "PY_CMD=python"
  )
)

if not defined PY_CMD (
  echo ERROR: Python was not found.
  echo Install Python or make sure py/python is available in PATH.
  pause
  exit /b 1
)

for /f "usebackq delims=" %%U in (`powershell -NoProfile -Command "[uri]::EscapeDataString('%JSX_FILE%')"`) do (
  set "ENCODED_JSX=%%U"
)

set "URL=http://127.0.0.1:%PORT%/%HTML_FILE%?file=%ENCODED_JSX%&view=visual"

echo Starting local server on port %PORT% ...
start "JSX Viewer Server" cmd /k %PY_CMD% -m http.server %PORT%

echo Waiting for server to start ...
ping 127.0.0.1 -n 3 >nul

echo Opening %URL%
start "" "%URL%"

echo.
echo Server window left open intentionally.
echo Close that server window when you are done.

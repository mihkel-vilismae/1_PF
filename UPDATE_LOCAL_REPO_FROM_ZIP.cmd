@REM Drag-and-drop updater for replacing this repo from a ZIP.
@REM Creates a timestamped backup before mirroring extracted files.
@REM Preserves local Git metadata and common dependency/build folders.
@REM Intended for Windows operator use from the target repo folder.
@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Drag a repo ZIP onto this file.
REM It backs up the current folder, extracts the ZIP into a temp folder,
REM then copies the extracted repo contents over this folder.

set "ZIP_PATH=%~1"
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

if "%ZIP_PATH%"=="" (
  echo.
  echo Usage:
  echo   Drag a repo ZIP file onto this .cmd file.
  echo.
  echo This script must live in the local repo folder you want to update.
  echo.
  pause
  exit /b 1
)

if not exist "%ZIP_PATH%" (
  echo ERROR: ZIP not found:
  echo %ZIP_PATH%
  pause
  exit /b 1
)

if /I not "%~x1"==".zip" (
  echo ERROR: Dropped file is not a .zip:
  echo %ZIP_PATH%
  pause
  exit /b 1
)

echo.
echo Repo folder:
echo   %SCRIPT_DIR%
echo.
echo ZIP to install:
echo   %ZIP_PATH%
echo.
echo This will overwrite files in the repo folder after creating a backup.
echo.
choice /C YN /M "Continue"
if errorlevel 2 (
  echo Cancelled.
  pause
  exit /b 0
)

for /f %%I in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%I"

set "BACKUP_DIR=%SCRIPT_DIR%__backup_before_zip_install_%STAMP%"
set "TMP_DIR=%TEMP%\repo_zip_install_%STAMP%"

echo.
echo Creating backup:
echo   %BACKUP_DIR%

robocopy "%SCRIPT_DIR%" "%BACKUP_DIR%" /MIR /XD ".git" "node_modules" "dist" "build" ".vite" ".next" "__pycache__" /XF "*.log" >nul
if errorlevel 8 (
  echo ERROR: Backup failed.
  pause
  exit /b 1
)

echo.
echo Extracting ZIP...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "Remove-Item -LiteralPath '%TMP_DIR%' -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "New-Item -ItemType Directory -Path '%TMP_DIR%' | Out-Null;" ^
  "Expand-Archive -LiteralPath '%ZIP_PATH%' -DestinationPath '%TMP_DIR%' -Force"

if errorlevel 1 (
  echo ERROR: ZIP extraction failed.
  pause
  exit /b 1
)

echo.
echo Detecting repo root inside ZIP...

for /f "usebackq delims=" %%R in (`powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root='%TMP_DIR%';" ^
  "$dirs=Get-ChildItem -LiteralPath $root -Directory;" ^
  "$files=Get-ChildItem -LiteralPath $root -File;" ^
  "if ((Test-Path (Join-Path $root '.git')) -or (Test-Path (Join-Path $root 'package.json')) -or (Test-Path (Join-Path $root 'README.md'))) { $root }" ^
  "elseif ($dirs.Count -eq 1 -and $files.Count -eq 0) { $dirs[0].FullName }" ^
  "else { $root }"`) do set "EXTRACTED_ROOT=%%R"

echo Extracted root:
echo   %EXTRACTED_ROOT%

if not exist "%EXTRACTED_ROOT%" (
  echo ERROR: Could not detect extracted repo root.
  pause
  exit /b 1
)

echo.
echo Copying files into repo folder...
echo Preserving local node_modules and common build/cache folders.
echo.

robocopy "%EXTRACTED_ROOT%" "%SCRIPT_DIR%" /MIR /XD ".git" "node_modules" "dist" "build" ".vite" ".next" "__pycache__" /R:2 /W:1
set "ROBO_EXIT=%ERRORLEVEL%"

if %ROBO_EXIT% GEQ 8 (
  echo.
  echo ERROR: Copy failed. Your backup is here:
  echo   %BACKUP_DIR%
  pause
  exit /b 1
)

echo.
echo Cleaning temp folder...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-Item -LiteralPath '%TMP_DIR%' -Recurse -Force -ErrorAction SilentlyContinue"

echo.
echo Done.
echo Backup saved at:
echo   %BACKUP_DIR%
echo.
echo Suggested next commands:
echo   git status
echo   npm install
echo   npm test
echo.
pause
exit /b 0

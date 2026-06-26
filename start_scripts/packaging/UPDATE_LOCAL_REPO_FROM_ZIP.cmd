REM Drag-and-drop launcher for replacing this repo from a ZIP.
REM Delegates copy, backup, extraction, and safety checks to PowerShell.
REM Keeps the terminal open after completion so operators can read results.
REM Intended for Windows operator use from the target repo folder.
@echo off

setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
for %%I in ("%~dp0..\..") do set "REPO_ROOT=%%~fI"
set "ZIP_PATH=%~1"

title Repo ZIP Drop Installer

echo.
echo ============================================================
echo Repo ZIP Drop Installer
echo ============================================================
echo.
echo Script folder:
echo   %SCRIPT_DIR%
echo.

if "%ZIP_PATH%"=="" (
  echo No ZIP file was provided.
  echo.
  echo How to use:
  echo   1. Keep this CMD under start_scripts\packaging inside the local repo folder.
  echo   2. Drag the updated repo ZIP onto this CMD file.
  echo.
  echo The terminal will stay open.
  echo.
  cmd /k
  exit /b 1
)

echo Dropped file:
echo   %ZIP_PATH%
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -File "%REPO_ROOT%\tools\update-local-repo-from-zip.ps1" -ZipPath "%ZIP_PATH%" -RepoPath "%REPO_ROOT%"

exit /b %ERRORLEVEL%

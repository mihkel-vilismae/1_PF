@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0start_scripts\start_win.ps1" %*

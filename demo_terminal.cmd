@echo off
setlocal
REM Starts the merged PhotoFrame terminal Demo Mode from the repository root.
REM Pass any extra arguments through to the npm script, for example --adapter=real-demo.
cd /d "%~dp0"
npm run demo:terminal -- %*

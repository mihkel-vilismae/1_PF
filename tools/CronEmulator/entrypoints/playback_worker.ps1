<#
Runs the playback_worker entrypoint for Windows CronEmulator.
It delegates to the backend scheduler CLI without starting the HTTP server.
#>
$ErrorActionPreference = 'Stop'

<#
Finds the parent 12_PF repository root from this entrypoint location.
#>
function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

<#
Runs the existing npm scheduler command for playback selection.
#>
function Invoke-PlaybackWorker {
  $repoRoot = Get-RepoRoot
  Push-Location $repoRoot
  try {
    npm run api -- --scheduler playback-worker
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  }
  finally {
    Pop-Location
  }
}

Invoke-PlaybackWorker

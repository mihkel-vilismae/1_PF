# Windows full startup launcher for PF_login / 1234_PF.
# Installs dependencies, runs tests, then opens API/frontend tabs.
# Prefers Windows Terminal tabs and falls back to separate cmd windows.
# Opens the Vite frontend in the default browser after launch.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ApiUrl = "http://127.0.0.1:4301"
$FrontendUrl = "http://localhost:5173"

<#
Checks that a command exists on PATH before the launcher depends on it.
#>
function Assert-CommandAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [string] $CommandName,
        [Parameter(Mandatory = $true)]
        [string] $InstallHint
    )

    $command = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        throw "$CommandName was not found on PATH. $InstallHint"
    }
}

<#
Runs a command from the repository root and fails fast when it exits non-zero.
#>
function Invoke-RepoCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments,
        [Parameter(Mandatory = $true)]
        [string] $StepName
    )

    Write-Host "[STEP] $StepName"
    Push-Location $RepoRoot
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$StepName failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

<#
Copies a parent .env into the repo when the repo-local file is missing.
#>
function Initialize-EnvironmentFile {
    $repoEnv = Join-Path $RepoRoot ".env"
    $parentEnv = Join-Path (Split-Path $RepoRoot -Parent) ".env"

    if (Test-Path $repoEnv) {
        Write-Host "[INFO] .env exists in repo root."
        return
    }

    if (Test-Path $parentEnv) {
        Write-Host "[INFO] .env missing in repo root. Copying parent ..\.env into this repo."
        Copy-Item -Path $parentEnv -Destination $repoEnv -Force
        return
    }

    Write-Host "[WARN] .env not found in repo root or parent folder. Backend checks may fail until .env is created."
}

<#
Installs dependencies with the user's preferred verbose npm output.
#>
function Install-Dependencies {
    Invoke-RepoCommand -FilePath "npm" -Arguments @("install", "--verbose") -StepName "Install dependencies"
}

<#
Runs the repository test suite before starting long-running servers.
#>
function Invoke-ProjectTests {
    Invoke-RepoCommand -FilePath "npm" -Arguments @("test") -StepName "Run tests"
}

<#
Runs a production build so frontend compile errors are caught before launch.
#>
function Invoke-ProjectBuild {
    Invoke-RepoCommand -FilePath "npm" -Arguments @("run", "build") -StepName "Build frontend"
}

<#
Starts API and frontend in Windows Terminal tabs when available.
#>
function Start-WindowsTerminalTabs {
    $repo = $RepoRoot.Path
    $apiCommand = "cd /d `"$repo`" && npm run api"
    $frontendCommand = "cd /d `"$repo`" && npm run dev"

    Start-Process -FilePath "wt.exe" -ArgumentList @(
        "new-tab", "--title", "PF API", "cmd", "/k", $apiCommand,
        ";", "new-tab", "--title", "PF Frontend", "cmd", "/k", $frontendCommand
    )
}

<#
Starts API and frontend in separate cmd windows when Windows Terminal is unavailable.
#>
function Start-CmdFallbackWindows {
    $repo = $RepoRoot.Path
    Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", "cd /d `"$repo`" && npm run api") -WorkingDirectory $repo
    Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", "cd /d `"$repo`" && npm run dev") -WorkingDirectory $repo
}

<#
Launches the two long-running processes and opens the frontend URL.
#>
function Start-ProjectServers {
    Write-Host "[STEP] Start API and frontend"
    $windowsTerminal = Get-Command "wt.exe" -ErrorAction SilentlyContinue
    if ($null -ne $windowsTerminal) {
        Write-Host "[INFO] Opening Windows Terminal with API and frontend tabs."
        Start-WindowsTerminalTabs
    }
    else {
        Write-Host "[WARN] Windows Terminal not found. Opening separate cmd windows instead."
        Start-CmdFallbackWindows
    }

    Start-Sleep -Seconds 3
    Write-Host "[INFO] API: $ApiUrl"
    Write-Host "[INFO] Frontend: $FrontendUrl"
    Write-Host "[STEP] Open frontend in browser"
    Start-Process $FrontendUrl
}

<#
Coordinates the full safe startup workflow from dependency install to browser launch.
#>
function Start-FullWindowsLaunch {
    Write-Host "[INFO] PF_login full Windows launcher"
    Write-Host "[INFO] Repo: $($RepoRoot.Path)"
    Assert-CommandAvailable -CommandName "node" -InstallHint "Install Node.js, reopen the terminal, and retry."
    Assert-CommandAvailable -CommandName "npm" -InstallHint "Install Node.js/npm, reopen the terminal, and retry."
    Initialize-EnvironmentFile
    Install-Dependencies
    Invoke-ProjectTests
    Invoke-ProjectBuild
    Start-ProjectServers
    Write-Host "[DONE] Startup launched. Keep the API/frontend tabs open while using the dashboard."
}

Start-FullWindowsLaunch

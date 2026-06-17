# PF_login / PhotoFrame Windows start launcher.
# Run from the repository root. It prepares a local SQLite DB when needed,
# then starts the backend API and Vite frontend in separate PowerShell windows.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ApiUrl = "http://127.0.0.1:4301"
$FrontendUrl = "http://localhost:5173"
$RuntimeRoot = Join-Path $RepoRoot "runtime_data\start_launcher"
$LogRoot = Join-Path $RuntimeRoot "logs"
$PidRoot = Join-Path $RuntimeRoot "pids"

function Write-Step([string]$Message) {
    Write-Host "[START] $Message" -ForegroundColor Cyan
}

function Assert-Command([string]$Name, [string]$Hint) {
    if ($null -eq (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name was not found on PATH. $Hint"
    }
}

function Get-PythonCommand {
    if ($null -ne (Get-Command "python" -ErrorAction SilentlyContinue)) { return "python" }
    if ($null -ne (Get-Command "py" -ErrorAction SilentlyContinue)) { return "py" }
    throw "Python was not found on PATH. Install Python 3 so the SQLite DB can be initialized."
}

function Read-DotEnvValue([string]$Key) {
    $envPath = Join-Path $RepoRoot ".env"
    if (-not (Test-Path $envPath)) { return $null }
    $pattern = "^$([regex]::Escape($Key))=(.*)$"
    foreach ($line in Get-Content $envPath) {
        if ($line -match $pattern) {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

function Initialize-EnvFile {
    $repoEnv = Join-Path $RepoRoot ".env"
    $parentEnv = Join-Path (Split-Path $RepoRoot -Parent) ".env"
    $exampleEnv = Join-Path $RepoRoot "example.env"

    if (Test-Path $repoEnv) {
        Write-Step ".env already exists in repo root."
        return
    }

    if (Test-Path $parentEnv) {
        Write-Step "Copying parent ..\.env into repo root."
        Copy-Item -Path $parentEnv -Destination $repoEnv -Force
        return
    }

    if (Test-Path $exampleEnv) {
        Write-Step "No .env found. Creating local .env from example.env. Review it before real iCloud/provider use."
        Copy-Item -Path $exampleEnv -Destination $repoEnv -Force
        return
    }

    throw "No .env, parent .env, or example.env was found. Cannot prepare runtime config."
}

function Initialize-RuntimeDirectories {
    New-Item -ItemType Directory -Force -Path $RuntimeRoot, $LogRoot, $PidRoot | Out-Null
    foreach ($key in @("DOWNLOAD_DIR", "LOG_DIR", "ICLOUDPD_COOKIE_DIR")) {
        $value = Read-DotEnvValue $key
        if ($value) {
            $path = if ([System.IO.Path]::IsPathRooted($value)) { $value } else { Join-Path $RepoRoot $value }
            New-Item -ItemType Directory -Force -Path $path | Out-Null
        }
    }
}

function Initialize-Database {
    $dbPathValue = Read-DotEnvValue "DB_PATH"
    if (-not $dbPathValue) { throw "DB_PATH is missing from .env. Cannot initialize SQLite DB." }
    $dbPath = if ([System.IO.Path]::IsPathRooted($dbPathValue)) { $dbPathValue } else { Join-Path $RepoRoot $dbPathValue }
    $dbDir = Split-Path -Parent $dbPath
    New-Item -ItemType Directory -Force -Path $dbDir | Out-Null
    if (Test-Path $dbPath) {
        Write-Step "SQLite DB already exists: $dbPath"
        return
    }

    $python = Get-PythonCommand
    $sqliteAdmin = Join-Path $RepoRoot "server\scripts\sqlite_admin.py"
    $schema = Join-Path $RepoRoot "schema.sql"
    Write-Step "Creating SQLite DB: $dbPath"
    Push-Location $RepoRoot
    try {
        if ($python -eq "py") {
            & py -3 $sqliteAdmin recreate $dbPath $schema
        } else {
            & python $sqliteAdmin recreate $dbPath $schema
        }
        if ($LASTEXITCODE -ne 0) { throw "SQLite DB initialization failed with exit code $LASTEXITCODE." }
    }
    finally { Pop-Location }
}

function Invoke-RepoCommand([string]$StepName, [string]$Command, [string[]]$Arguments) {
    Write-Step $StepName
    Push-Location $RepoRoot
    try {
        & $Command @Arguments
        if ($LASTEXITCODE -ne 0) { throw "$StepName failed with exit code $LASTEXITCODE." }
    }
    finally { Pop-Location }
}

function Start-RepoProcess([string]$Title, [string]$NpmScript, [string]$LogName) {
    $logPath = Join-Path $LogRoot $LogName
    $command = "Set-Location -LiteralPath '$($RepoRoot.Path)'; npm run $NpmScript 2>&1 | Tee-Object -FilePath '$logPath'"
    Write-Step "Opening $Title window. Log: $logPath"
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $command) -WorkingDirectory $RepoRoot
}

Write-Step "PF_login Windows start launcher"
Write-Step "Repo: $($RepoRoot.Path)"
Assert-Command "node" "Install Node.js, reopen PowerShell, and rerun START_WIN.PS1."
Assert-Command "npm" "Install npm, reopen PowerShell, and rerun START_WIN.PS1."
Initialize-EnvFile
Initialize-RuntimeDirectories
Invoke-RepoCommand "Install dependencies" "npm" @("install")
Invoke-RepoCommand "Build frontend" "npm" @("run", "build")
Initialize-Database
Start-RepoProcess "PF_login backend API" "api" "backend_api.log"
Start-RepoProcess "PF_login frontend" "dev" "frontend_vite.log"
Start-Sleep -Seconds 3
Write-Step "Backend: $ApiUrl"
Write-Step "Frontend: $FrontendUrl"
Start-Process $FrontendUrl
Write-Host "[DONE] Frontend, backend, and SQLite DB startup sequence launched." -ForegroundColor Green

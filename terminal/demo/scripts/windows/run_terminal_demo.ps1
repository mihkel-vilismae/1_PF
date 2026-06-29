$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$script:RunnerCurrentStep = 'Idle'
$script:RunnerCurrentCommand = ''
$script:RunnerLatestLogLine = 'No log output captured yet.'
$script:RunnerCurrentLogPath = ''
$script:RunnerVerboseDisplayEnabled = $false

function Get-EstonianTimestamp {
    try {
        $estoniaTimeZone = [System.TimeZoneInfo]::FindSystemTimeZoneById('FLE Standard Time')
        $estonianNow = [System.TimeZoneInfo]::ConvertTimeFromUtc([System.DateTime]::UtcNow, $estoniaTimeZone)
        return ('{0} Europe/Tallinn' -f $estonianNow.ToString('yyyy-MM-dd HH:mm:ss'))
    }
    catch {
        return ('{0} local time' -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))
    }
}


function Get-ProjectVersion {
    param(
        [Parameter(Mandatory = $true)]
        [string] $RepoRoot
    )

    $versionPath = Join-Path $RepoRoot 'VERSION'
    if (Test-Path $versionPath) {
        $versionText = (Get-Content -Raw -Path $versionPath -ErrorAction SilentlyContinue).Trim()
        if ($versionText) {
            return $versionText
        }
    }

    $packageJsonPath = Join-Path $RepoRoot 'package.json'
    if (Test-Path $packageJsonPath) {
        try {
            $packageJson = Get-Content -Raw -Path $packageJsonPath | ConvertFrom-Json
            if ($packageJson.version) {
                return [string] $packageJson.version
            }
        }
        catch {
            return 'unknown'
        }
    }

    return 'unknown'
}

function Write-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    Write-Host ''
    Write-Host ('==> {0}' -f $Message) -ForegroundColor Cyan
}

function Write-Info {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    Write-Host ('[info] {0}' -f $Message) -ForegroundColor DarkGray
}

function ConvertTo-CommandLineArgument {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Value
    )

    if ($Value -notmatch '[\s"]') {
        return $Value
    }

    return '"' + ($Value -replace '"', '\"') + '"'
}

function ConvertTo-CommandLine {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    $parts = @((ConvertTo-CommandLineArgument -Value $FilePath))
    foreach ($argument in $Arguments) {
        $parts += (ConvertTo-CommandLineArgument -Value $argument)
    }

    return ($parts -join ' ')
}

function Resolve-ProcessFilePath {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath
    )

    if ($FilePath -ieq 'npm') {
        $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if ($null -ne $npmCmd -and $npmCmd.Source -and (Test-Path $npmCmd.Source)) {
            return $npmCmd.Source
        }
    }

    $command = Get-Command $FilePath -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        return $FilePath
    }

    if ($command.Source -and (Test-Path $command.Source)) {
        return $command.Source
    }

    return $FilePath
}


function Resolve-ProcessInvocation {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    if ($FilePath -ieq 'npm') {
        $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if ($null -eq $npmCommand) {
            $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
        }

        if ($null -ne $npmCommand -and $npmCommand.Source) {
            $npmCommandPath = $npmCommand.Source
            $nodeDir = Split-Path -Parent $npmCommandPath
            $nodeExe = Join-Path $nodeDir 'node.exe'
            $npmCli = Join-Path $nodeDir 'node_modules\npm\bin\npm-cli.js'

            if ((Test-Path $nodeExe) -and (Test-Path $npmCli)) {
                return [pscustomobject]@{
                    FilePath = $nodeExe
                    Arguments = @($npmCli) + $Arguments
                    DisplayFilePath = 'npm'
                    DisplayArguments = $Arguments
                    Note = ('resolved npm through node.exe/npm-cli.js to preserve reliable Windows exit codes: {0}' -f $npmCli)
                }
            }
        }
    }

    return [pscustomobject]@{
        FilePath = (Resolve-ProcessFilePath -FilePath $FilePath)
        Arguments = $Arguments
        DisplayFilePath = $FilePath
        DisplayArguments = $Arguments
        Note = ''
    }
}

function Write-LogPeek {
    Write-Host ''
    Write-Host ('[L] Timestamp (Estonia): {0}' -f (Get-EstonianTimestamp)) -ForegroundColor Yellow
    Write-Host ('[L] Current step: {0}' -f $script:RunnerCurrentStep) -ForegroundColor Yellow
    Write-Host ('[L] Current command: {0}' -f $script:RunnerCurrentCommand) -ForegroundColor Yellow
    Write-Host ('[L] Latest log row: {0}' -f $script:RunnerLatestLogLine) -ForegroundColor Yellow
    if ($script:RunnerCurrentLogPath) {
        Write-Host ('[L] Full log: {0}' -f $script:RunnerCurrentLogPath) -ForegroundColor Yellow
    }
    $verboseState = if ($script:RunnerVerboseDisplayEnabled) { 'ON' } else { 'OFF' }
    Write-Host ('[L] Verbose terminal display: {0}' -f $verboseState) -ForegroundColor Yellow
    Write-Host ''
}

function Toggle-VerboseDisplay {
    $script:RunnerVerboseDisplayEnabled = -not $script:RunnerVerboseDisplayEnabled
    $state = if ($script:RunnerVerboseDisplayEnabled) { 'ON' } else { 'OFF' }
    Write-Host ''
    Write-Host ('[V] Timestamp (Estonia): {0}' -f (Get-EstonianTimestamp)) -ForegroundColor Cyan
    Write-Host ('[V] Verbose terminal display: {0}' -f $state) -ForegroundColor Cyan
    Write-Host '[V] Full verbose logs are still written to the log file either way.' -ForegroundColor Cyan
    if ($script:RunnerCurrentLogPath) {
        Write-Host ('[V] Full log: {0}' -f $script:RunnerCurrentLogPath) -ForegroundColor Cyan
    }
    Write-Host ''
}

function Read-RunnerHotKey {
    try {
        if (-not [Console]::KeyAvailable) {
            return ''
        }

        $key = [Console]::ReadKey($true)
        return ([string] $key.KeyChar).ToUpperInvariant()
    }
    catch {
        return ''
    }
}

function Process-RunnerHotKey {
    $hotKey = Read-RunnerHotKey
    if ($hotKey -eq 'L') {
        Write-LogPeek
        return
    }

    if ($hotKey -eq 'V') {
        Toggle-VerboseDisplay
        return
    }
}

function Publish-LogLines {
    param(
        [Parameter(Mandatory = $true)]
        [string] $SourcePath,
        [Parameter(Mandatory = $true)]
        [ref] $ReadCount,
        [Parameter(Mandatory = $true)]
        [string] $CombinedLogPath,
        [Parameter(Mandatory = $true)]
        [string] $StreamName
    )

    if (-not (Test-Path $SourcePath)) {
        return
    }

    $lines = @(Get-Content -Path $SourcePath -ErrorAction SilentlyContinue)
    if ($lines.Count -le $ReadCount.Value) {
        return
    }

    for ($index = $ReadCount.Value; $index -lt $lines.Count; $index++) {
        $line = [string] $lines[$index]
        if ($line.Length -eq 0) {
            continue
        }

        $script:RunnerLatestLogLine = $line
        Add-Content -Path $CombinedLogPath -Value ('[{0}] {1}' -f $StreamName, $line)

        if ($script:RunnerVerboseDisplayEnabled) {
            Write-Host ('[{0}] {1}' -f $StreamName, $line) -ForegroundColor DarkGray
        }
    }

    $ReadCount.Value = $lines.Count
}

function Get-SafeExitCode {
    param(
        [Parameter(Mandatory = $true)]
        [object] $Process
    )

    try {
        $Process.Refresh()
        if ($null -ne $Process.ExitCode) {
            return [int] $Process.ExitCode
        }
    }
    catch {
        return 1
    }

    return 1
}


function Assert-NoInternalPackageRegistryLeak {
    param(
        [Parameter(Mandatory = $true)]
        [string] $RepoRoot
    )

    $lockPath = Join-Path $RepoRoot 'package-lock.json'
    if (-not (Test-Path $lockPath)) {
        return
    }

    $lockText = Get-Content -Raw -Path $lockPath -ErrorAction SilentlyContinue
    if ($lockText -match 'packages\.applied-caas-gateway1\.internal\.api\.openai\.org|artifactory/api/npm/npm-public') {
        Write-Host ''
        Write-Host '[error] package-lock.json contains internal package registry URLs from the artifact generation environment.' -ForegroundColor Red
        Write-Host '[error] This Windows runner will not use those URLs because they are not reachable from your PC.' -ForegroundColor Red
        Write-Host ('[error] Lock file: {0}' -f $lockPath) -ForegroundColor Red
        Write-Host '[hint] Use the fixed ZIP or regenerate package-lock.json with public npm registry URLs.' -ForegroundColor Yellow
        throw 'Internal npm registry URL found in package-lock.json.'
    }
}

function Invoke-LoggedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Label,
        [Parameter(Mandatory = $true)]
        [string] $FilePath,
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments,
        [Parameter(Mandatory = $true)]
        [string] $LogPath,
        [int] $MaxAttempts = 1
    )

    Write-Step -Message $Label
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LogPath) | Out-Null

    $invocation = Resolve-ProcessInvocation -FilePath $FilePath -Arguments $Arguments
    $displayCommand = ConvertTo-CommandLine -FilePath $invocation.DisplayFilePath -Arguments $invocation.DisplayArguments
    $actualCommand = ConvertTo-CommandLine -FilePath $invocation.FilePath -Arguments $invocation.Arguments
    $script:RunnerCurrentStep = $Label
    $script:RunnerCurrentCommand = $displayCommand
    $script:RunnerCurrentLogPath = $LogPath
    $script:RunnerLatestLogLine = 'No log output captured yet.'

    Write-Info -Message ('Command: {0}' -f $displayCommand)
    if ($invocation.Note) {
        Write-Info -Message $invocation.Note
    }
    Write-Info -Message ('Log: {0}' -f $LogPath)
    Write-Info -Message 'Press [L] for timestamp/current command/latest log row. Press [V] to toggle live verbose terminal log display.'
    Write-Info -Message 'Full verbose output is always written to the log file.'

    $attempt = 1
    while ($attempt -le $MaxAttempts) {
        if ($MaxAttempts -gt 1) {
            Write-Info -Message ('Attempt {0} of {1}.' -f $attempt, $MaxAttempts)
        }

        Add-Content -Path $LogPath -Value ''
        Add-Content -Path $LogPath -Value ('==> {0} - attempt {1} of {2}' -f $Label, $attempt, $MaxAttempts)
        Add-Content -Path $LogPath -Value ('Timestamp (Estonia): {0}' -f (Get-EstonianTimestamp))
        Add-Content -Path $LogPath -Value ('Command: {0}' -f $displayCommand)
        Add-Content -Path $LogPath -Value ('Actual command: {0}' -f $actualCommand)

        $resolvedFilePath = $invocation.FilePath
        $resolvedArguments = [string[]] $invocation.Arguments
        $stdoutPath = ('{0}.attempt-{1}.stdout.tmp' -f $LogPath, $attempt)
        $stderrPath = ('{0}.attempt-{1}.stderr.tmp' -f $LogPath, $attempt)

        if (Test-Path $stdoutPath) { Remove-Item -Force $stdoutPath }
        if (Test-Path $stderrPath) { Remove-Item -Force $stderrPath }
        New-Item -ItemType File -Force -Path $stdoutPath | Out-Null
        New-Item -ItemType File -Force -Path $stderrPath | Out-Null

        $stdoutReadCount = 0
        $stderrReadCount = 0
        $process = Start-Process `
            -FilePath $resolvedFilePath `
            -ArgumentList $resolvedArguments `
            -WorkingDirectory (Get-Location).Path `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath `
            -NoNewWindow `
            -PassThru

        while (-not $process.HasExited) {
            Publish-LogLines -SourcePath $stdoutPath -ReadCount ([ref] $stdoutReadCount) -CombinedLogPath $LogPath -StreamName 'stdout'
            Publish-LogLines -SourcePath $stderrPath -ReadCount ([ref] $stderrReadCount) -CombinedLogPath $LogPath -StreamName 'stderr'
            Process-RunnerHotKey
            Start-Sleep -Milliseconds 250
        }

        $process.WaitForExit()
        Start-Sleep -Milliseconds 250
        Publish-LogLines -SourcePath $stdoutPath -ReadCount ([ref] $stdoutReadCount) -CombinedLogPath $LogPath -StreamName 'stdout'
        Publish-LogLines -SourcePath $stderrPath -ReadCount ([ref] $stderrReadCount) -CombinedLogPath $LogPath -StreamName 'stderr'
        Process-RunnerHotKey

        $exitCode = [int] $process.ExitCode
        Add-Content -Path $LogPath -Value ('Process exit code: {0}' -f $exitCode)
        $process.Dispose()

        if (Test-Path $stdoutPath) { Remove-Item -Force $stdoutPath -ErrorAction SilentlyContinue }
        if (Test-Path $stderrPath) { Remove-Item -Force $stderrPath -ErrorAction SilentlyContinue }

        if ($exitCode -eq 0) {
            Write-Info -Message ('{0} finished successfully.' -f $Label)
            return
        }

        $logText = ''
        if (Test-Path $LogPath) {
            $logText = Get-Content -Raw -Path $LogPath -ErrorAction SilentlyContinue
        }
        $looksLikeNetworkTimeout = $logText -match 'ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|network timeout|fetch failed'

        Write-Host ''
        Write-Host ('[error] {0} failed with exit code {1}.' -f $Label, $exitCode) -ForegroundColor Red
        Write-Host ('[error] Full log: {0}' -f $LogPath) -ForegroundColor Red

        if ($looksLikeNetworkTimeout) {
            Write-Host '[hint] npm reported a network/timeout-looking error. The runner will retry if attempts remain.' -ForegroundColor Yellow
        }

        if ($attempt -lt $MaxAttempts) {
            Write-Host ('[info] Retrying {0} in 5 seconds...' -f $Label) -ForegroundColor DarkGray
            Start-Sleep -Seconds 5
            $attempt++
            continue
        }

        throw ('{0} failed with exit code {1}' -f $Label, $exitCode)
    }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logDir = Join-Path $repoRoot 'runtime_logs\windows_runner'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$projectVersion = Get-ProjectVersion -RepoRoot $repoRoot

Write-Host ('PhotoFrame Mock Demo Terminal v{0} - Windows Runner' -f $projectVersion) -ForegroundColor Green
Write-Host ('Repo: {0}' -f $repoRoot)
Write-Host ('Logs: {0}' -f $logDir)
Write-Host 'Mode: mock-demo terminal; no real workers, DB, truth JSONL, cron, or file import.' -ForegroundColor Yellow

Write-Step -Message 'Checking Node.js and npm'
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue

if ($null -eq $nodeCmd) {
    throw 'Node.js was not found on PATH. Install Node.js and run windows_runner.cmd again.'
}

if ($null -eq $npmCmd) {
    throw 'npm was not found on PATH. Install npm/Node.js and run windows_runner.cmd again.'
}

$nodeVersion = (& node --version)
$npmVersion = (& npm --version)
Write-Info -Message ('Node: {0}' -f $nodeVersion)
Write-Info -Message ('npm:  {0}' -f $npmVersion)

if (-not (Test-Path (Join-Path $repoRoot 'package.json'))) {
    throw ('package.json not found at repo root: {0}' -f $repoRoot)
}

Assert-NoInternalPackageRegistryLeak -RepoRoot $repoRoot
Write-Info -Message 'Dependency registry: forcing public npm registry for install commands.'

$installCommand = 'install'
$installArgs = @('install', '--verbose', '--registry=https://registry.npmjs.org/', '--prefer-online=true', '--progress=true', '--fund=false', '--audit=false')
if (Test-Path (Join-Path $repoRoot 'package-lock.json')) {
    $installCommand = 'ci'
    $installArgs = @(
        'ci',
        '--verbose',
        '--registry=https://registry.npmjs.org/',
        '--prefer-online=true',
        '--progress=true',
        '--fund=false',
        '--audit=false',
        '--fetch-retries=3',
        '--fetch-retry-factor=2',
        '--fetch-retry-mintimeout=20000',
        '--fetch-retry-maxtimeout=120000'
    )
}

Write-Info -Message ('Dependency install mode: npm {0}' -f $installCommand)
Write-Info -Message 'Output policy: step-by-step runner messages; full npm --verbose output saved to log.'
Write-Info -Message 'Interactive controls: [L] timestamp/current command/latest log row; [V] toggle live verbose display.'

Invoke-LoggedCommand `
    -Label 'Installing dependencies' `
    -FilePath 'npm' `
    -Arguments $installArgs `
    -LogPath (Join-Path $logDir ('npm-{0}-{1}.log' -f $installCommand, $timestamp)) `
    -MaxAttempts 2

Invoke-LoggedCommand `
    -Label 'Building TypeScript' `
    -FilePath 'npm' `
    -Arguments @('--verbose', 'run', 'build') `
    -LogPath (Join-Path $logDir ('npm-build-{0}.log' -f $timestamp))

Invoke-LoggedCommand `
    -Label 'Running smoke verification' `
    -FilePath 'npm' `
    -Arguments @('--verbose', 'run', 'verify:smoke') `
    -LogPath (Join-Path $logDir ('npm-verify-smoke-{0}.log' -f $timestamp))

Write-Step -Message 'Launching mock demo terminal'
Write-Info -Message 'Controls: Q = storyboard, R = refresh, X or Ctrl+C = exit.'
Write-Info -Message 'Interactive output is not tee-logged so raw keyboard handling remains stable.'
Write-Host ''

& npm run demo:terminal:mock
$terminalExitCode = $LASTEXITCODE

if ($terminalExitCode -ne 0) {
    throw ('Mock demo terminal exited with code {0}.' -f $terminalExitCode)
}

Write-Host ''
Write-Host 'PhotoFrame Mock Demo Terminal finished.' -ForegroundColor Green

# PF_login / PhotoFrame Windows stop launcher.
# Run from the repository root after start_win.cmd or the Windows runner/status menu.
# Stops only repo-owned API/frontend/status-monitor processes and their children,
# plus project-default port owners that match the expected Node/npm/Vite command shapes.

param(
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)
$RepoRoot = Resolve-Path (Join-Path $ScriptDir.Path "..\..")
$TargetPorts = @(4301, 5173)
$RepoCommandPatterns = @(
    "npm run api",
    "npm run dev",
    "start_component_status.ps1",
    "backend_api.cmd",
    "frontend_vite.cmd",
    "status_monitor.cmd"
)
$PortOwnerCommandPatterns = @(
    "npm",
    "node",
    "vite",
    "tsx",
    "server/index.ts"
)
$RepoTerminalHostNames = @(
    "cmd.exe",
    "powershell.exe",
    "pwsh.exe"
)

function Write-Step([string]$Message) {
    Write-Host "[STOP] $Message" -ForegroundColor Cyan
}

function Write-Skip([string]$Message) {
    Write-Host "[SKIP] $Message" -ForegroundColor DarkGray
}

function Convert-ToComparablePathText([string]$Value) {
    return $Value.ToLowerInvariant().Replace("/", "\\")
}

function Get-ProcessCommandLineMap {
    $processes = Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID }
    $map = @{}
    foreach ($process in $processes) {
        $map[[int]$process.ProcessId] = $process
    }
    return $map
}

function Test-CommandLineContainsAnyPattern([string]$CommandLine, [string[]]$Patterns) {
    if ([string]::IsNullOrWhiteSpace($CommandLine)) { return $false }
    $lower = $CommandLine.ToLowerInvariant()
    foreach ($pattern in $Patterns) {
        if ($lower.Contains($pattern.ToLowerInvariant())) { return $true }
    }
    return $false
}

function Test-IsRepoOwnedStartProcess($Process) {
    $commandLine = [string]$Process.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) { return $false }

    $repoText = Convert-ToComparablePathText $RepoRoot.Path
    $commandText = Convert-ToComparablePathText $commandLine
    if (-not $commandText.Contains($repoText)) { return $false }

    return Test-CommandLineContainsAnyPattern -CommandLine $commandLine -Patterns $RepoCommandPatterns
}

function Test-IsRepoOwnedTerminalHost($Process) {
    $processName = ([string]$Process.Name).ToLowerInvariant()
    if ($RepoTerminalHostNames -notcontains $processName) { return $false }

    $commandLine = [string]$Process.CommandLine
    if ([string]::IsNullOrWhiteSpace($commandLine)) { return $false }

    $repoText = Convert-ToComparablePathText $RepoRoot.Path
    $commandText = Convert-ToComparablePathText $commandLine
    if (-not $commandText.Contains($repoText)) { return $false }

    return Test-CommandLineContainsAnyPattern -CommandLine $commandLine -Patterns $RepoCommandPatterns
}

function Add-MatchingRepoTerminalAncestors([hashtable]$ProcessMap, [hashtable]$TargetIds, [int]$ProcessId, [string]$Reason) {
    if (-not $ProcessMap.ContainsKey($ProcessId)) { return }

    $current = $ProcessMap[$ProcessId]
    while ($null -ne $current -and $null -ne $current.ParentProcessId) {
        $parentId = [int]$current.ParentProcessId
        if ($parentId -eq 0 -or $parentId -eq $PID) { return }
        if (-not $ProcessMap.ContainsKey($parentId)) { return }

        $parent = $ProcessMap[$parentId]
        if (Test-IsRepoOwnedStartProcess $parent -or Test-IsRepoOwnedTerminalHost $parent) {
            Add-ProcessAndDescendants -ProcessMap $ProcessMap -TargetIds $TargetIds -ProcessId $parentId -Reason $Reason
        }

        $parentName = ([string]$parent.Name).ToLowerInvariant()
        if ($parentName -eq "wt.exe" -or $parentName -eq "windowsterminal.exe") { return }
        $current = $parent
    }
}

function Add-ProcessAndDescendants([hashtable]$ProcessMap, [hashtable]$TargetIds, [int]$ProcessId, [string]$Reason) {
    if (-not $ProcessMap.ContainsKey($ProcessId)) { return }
    if (-not $TargetIds.ContainsKey($ProcessId)) {
        $TargetIds[$ProcessId] = $Reason
    }

    $changed = $true
    while ($changed) {
        $changed = $false
        foreach ($candidate in $ProcessMap.Values) {
            $candidateId = [int]$candidate.ProcessId
            $parentId = if ($null -ne $candidate.ParentProcessId) { [int]$candidate.ParentProcessId } else { 0 }
            if ($candidateId -eq $PID) { continue }
            if ($TargetIds.ContainsKey($candidateId)) { continue }
            if ($TargetIds.ContainsKey($parentId)) {
                $TargetIds[$candidateId] = "child of repo-owned launcher process $parentId"
                $changed = $true
            }
        }
    }
}

function Add-TargetPortOwners([hashtable]$ProcessMap, [hashtable]$TargetIds) {
    $getNetTcp = Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue
    if ($null -eq $getNetTcp) {
        Write-Skip "Get-NetTCPConnection is unavailable; skipping project port-owner cleanup."
        return
    }

    foreach ($port in $TargetPorts) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object {
                $_.OwningProcess -and $_.OwningProcess -ne $PID
            }
        }
        catch {
            Write-Skip "Could not inspect local port ${port}: $($_.Exception.Message)"
            continue
        }

        foreach ($connection in $connections) {
            $ownerId = [int]$connection.OwningProcess
            if (-not $ProcessMap.ContainsKey($ownerId)) { continue }
            $owner = $ProcessMap[$ownerId]
            $commandLine = [string]$owner.CommandLine
            $processName = [string]$owner.Name
            $shape = "$processName $commandLine"
            if (Test-CommandLineContainsAnyPattern -CommandLine $shape -Patterns $PortOwnerCommandPatterns) {
                Add-ProcessAndDescendants -ProcessMap $ProcessMap -TargetIds $TargetIds -ProcessId $ownerId -Reason "project default port $port owner"
                Add-MatchingRepoTerminalAncestors -ProcessMap $ProcessMap -TargetIds $TargetIds -ProcessId $ownerId -Reason "repo-owned terminal hosting project default port $port"
            }
            else {
                Write-Skip "Port $port owner PID $ownerId did not match Node/npm/Vite command shape."
            }
        }
    }
}

function Stop-TargetProcesses([hashtable]$ProcessMap, [hashtable]$TargetIds) {
    if ($TargetIds.Count -eq 0) {
        Write-Step "No matching PF_login Windows launcher processes found."
        return
    }

    Write-Step "Stopping $($TargetIds.Count) matching process(es)."
    $orderedIds = $TargetIds.Keys | Sort-Object -Descending
    foreach ($processId in $orderedIds) {
        if ($processId -eq $PID) { continue }
        $reason = [string]$TargetIds[$processId]
        $process = $ProcessMap[$processId]
        $name = if ($process) { [string]$process.Name } else { "unknown" }
        if ($DryRun) {
            Write-Host ("[DRY-RUN] Would stop PID {0} ({1}) - {2}" -f $processId, $name, $reason) -ForegroundColor Yellow
            continue
        }

        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host ("[STOPPED] PID {0} ({1}) - {2}" -f $processId, $name, $reason) -ForegroundColor Green
        }
        catch {
            Write-Host ("[WARN] Could not stop PID {0} ({1}) - {2}: {3}" -f $processId, $name, $reason, $_.Exception.Message) -ForegroundColor Yellow
        }
    }
}

Write-Step "PF_login Windows stop launcher"
Write-Step "Repo: $($RepoRoot.Path)"
if ($DryRun) { Write-Step "Dry-run mode: no processes will be stopped." }

$processMap = Get-ProcessCommandLineMap
$targetIds = @{}

foreach ($process in $processMap.Values) {
    if (Test-IsRepoOwnedStartProcess $process) {
        Add-ProcessAndDescendants -ProcessMap $processMap -TargetIds $targetIds -ProcessId ([int]$process.ProcessId) -Reason "repo-owned start_win/runner process"
    }
}

Add-TargetPortOwners -ProcessMap $processMap -TargetIds $targetIds
Stop-TargetProcesses -ProcessMap $processMap -TargetIds $targetIds

Write-Step "Done."

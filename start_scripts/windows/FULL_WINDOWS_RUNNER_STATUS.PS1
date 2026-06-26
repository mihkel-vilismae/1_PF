# PF_login / PhotoFrame full Windows runner and status menu.
# Terminal UI for Start All / Stop All / Refresh Status.
# This script does not implement backend functionality; it only orchestrates the existing Windows launcher scripts.

param(
    [int] $RefreshSeconds = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)
$RepoRoot = Resolve-Path (Join-Path $ScriptDir.Path "..\..")
$StartScript = Join-Path $RepoRoot.Path "start_scripts\windows\start_win.cmd"
$StopScript = Join-Path $RepoRoot.Path "start_scripts\windows\STOP_ALL_WIN.PS1"
$DatabasePath = Join-Path $RepoRoot.Path "runtime_data\photo_frame.sqlite"
$LastUpdated = Get-Date
$LastAction = "Opened runner."

$Components = @(
    [pscustomobject]@{ Name = "Backend API"; Kind = "port"; Port = 4301; Hint = "npm run api" },
    [pscustomobject]@{ Name = "Frontend Vite"; Kind = "port"; Port = 5173; Hint = "npm run dev" },
    [pscustomobject]@{ Name = "Status monitor"; Kind = "process"; Pattern = "start_component_status.ps1"; Hint = "component monitor" },
    [pscustomobject]@{ Name = "Database file"; Kind = "file"; Path = $DatabasePath; Hint = "SQLite file" }
)

function Get-EstoniaNow {
    try {
        $zone = [System.TimeZoneInfo]::FindSystemTimeZoneById("FLE Standard Time")
        return [System.TimeZoneInfo]::ConvertTime((Get-Date), $zone)
    }
    catch {
        return Get-Date
    }
}

function Format-HumanAge([datetime]$Then, [datetime]$Now) {
    $seconds = [math]::Max(0, [int][math]::Round(($Now - $Then).TotalSeconds))
    if ($seconds -lt 1) { return "just now" }
    if ($seconds -eq 1) { return "1 second ago" }
    if ($seconds -lt 60) { return "$seconds seconds ago" }
    $minutes = [int][math]::Floor($seconds / 60)
    if ($minutes -eq 1) { return "1 minute ago" }
    if ($minutes -lt 60) { return "$minutes minutes ago" }
    $hours = [int][math]::Floor($minutes / 60)
    if ($hours -eq 1) { return "1 hour ago" }
    if ($hours -lt 24) { return "$hours hours ago" }
    $days = [int][math]::Floor($hours / 24)
    if ($days -eq 1) { return "1 day ago" }
    return "$days days ago"
}

function Get-ProcessMap {
    $map = @{}
    try {
        $processes = Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID }
        foreach ($process in $processes) {
            $map[[int]$process.ProcessId] = $process
        }
    }
    catch {
        # Keep status UI alive even when CIM is unavailable.
    }
    return $map
}

function Get-PortStatus([int]$Port, [hashtable]$ProcessMap) {
    $connections = @()
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess }
    }
    catch {
        return [pscustomobject]@{ Status = "unknown"; Detail = "port check unavailable"; Pids = "-" }
    }

    if (-not $connections -or $connections.Count -eq 0) {
        return [pscustomobject]@{ Status = "stopped"; Detail = "no listener/connection"; Pids = "-" }
    }

    $ids = @()
    $names = @()
    foreach ($connection in $connections) {
        $ownerId = [int]$connection.OwningProcess
        if ($ids -notcontains $ownerId) { $ids += $ownerId }
        if ($ProcessMap.ContainsKey($ownerId)) {
            $name = [string]$ProcessMap[$ownerId].Name
            if ($names -notcontains $name) { $names += $name }
        }
    }
    $nameText = if ($names.Count -gt 0) { $names -join "," } else { "process" }
    return [pscustomobject]@{ Status = "running"; Detail = $nameText; Pids = ($ids -join ",") }
}

function Get-PatternProcessStatus([string]$Pattern, [hashtable]$ProcessMap) {
    $matches = @()
    foreach ($process in $ProcessMap.Values) {
        $commandLine = [string]$process.CommandLine
        if ($commandLine.ToLowerInvariant().Contains($Pattern.ToLowerInvariant())) {
            $matches += $process
        }
    }
    if ($matches.Count -eq 0) {
        return [pscustomobject]@{ Status = "stopped"; Detail = "not found"; Pids = "-" }
    }
    return [pscustomobject]@{ Status = "running"; Detail = "matching process"; Pids = (($matches | ForEach-Object { [string]$_.ProcessId }) -join ",") }
}

function Get-FileStatus([string]$Path) {
    if (-not (Test-Path $Path)) {
        return [pscustomobject]@{ Status = "missing"; Detail = "file not found"; Pids = "-" }
    }
    $item = Get-Item $Path
    $sizeKb = [math]::Round($item.Length / 1KB, 1)
    return [pscustomobject]@{ Status = "present"; Detail = "$sizeKb KB"; Pids = "-" }
}

function Get-ComponentStatuses {
    $processMap = Get-ProcessMap
    $rows = @()
    foreach ($component in $Components) {
        if ($component.Kind -eq "port") {
            $status = Get-PortStatus -Port ([int]$component.Port) -ProcessMap $processMap
            $portText = [string]$component.Port
        }
        elseif ($component.Kind -eq "process") {
            $status = Get-PatternProcessStatus -Pattern ([string]$component.Pattern) -ProcessMap $processMap
            $portText = "-"
        }
        else {
            $status = Get-FileStatus -Path ([string]$component.Path)
            $portText = "file"
        }

        $rows += [pscustomobject]@{
            Name = [string]$component.Name
            Port = $portText
            Status = [string]$status.Status
            Detail = [string]$status.Detail
            Pids = [string]$status.Pids
        }
    }
    return $rows
}

function Format-Cell([string]$Value, [int]$Width) {
    if ($Value.Length -gt $Width) {
        return $Value.Substring(0, [math]::Max(0, $Width - 1)) + "…"
    }
    return $Value.PadRight($Width)
}

function Write-StatusWithColor([string]$Status) {
    $color = "Gray"
    if ($Status -eq "running" -or $Status -eq "present") { $color = "Green" }
    elseif ($Status -eq "stopped" -or $Status -eq "missing") { $color = "Yellow" }
    elseif ($Status -eq "unknown") { $color = "DarkYellow" }
    Write-Host (Format-Cell $Status 10) -NoNewline -ForegroundColor $color
}

function Format-Button([string]$Shortcut, [string]$Label) {
    $text = "[$Shortcut] $Label"
    return ("| " + $text.PadRight(22) + " |")
}

function Render-Menu([array]$Rows) {
    $nowEt = Get-EstoniaNow
    $age = Format-HumanAge -Then $LastUpdated -Now (Get-Date)
    Clear-Host
    Write-Host "PF_login / PhotoFrame — Full Windows Runner + Status" -ForegroundColor Cyan
    Write-Host "Repo: $($RepoRoot.Path)" -ForegroundColor DarkGray
    Write-Host "Auto-refresh: every $RefreshSeconds seconds. Press 1/2/3/Q." -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "+------------------------+   +----------------+------+------------+----------------------+----------+" -ForegroundColor DarkGray
    Write-Host "| MENU                   |   | PROCESS        | PORT | STATUS     | DETAIL               | PID(S)   |" -ForegroundColor DarkGray
    Write-Host "+------------------------+   +----------------+------+------------+----------------------+----------+" -ForegroundColor DarkGray

    for ($i = 0; $i -lt [math]::Max(4, $Rows.Count); $i++) {
        if ($i -eq 0) { $button = Format-Button "1" "START ALL" }
        elseif ($i -eq 1) { $button = Format-Button "2" "STOP ALL" }
        elseif ($i -eq 2) { $button = Format-Button "3" "REFRESH STATUS" }
        elseif ($i -eq 3) { $button = Format-Button "Q" "QUIT" }
        else { $button = "| ".PadRight(25) + "|" }

        if ($i -lt $Rows.Count) {
            $row = $Rows[$i]
            Write-Host $button -NoNewline -ForegroundColor White
            Write-Host "   | " -NoNewline -ForegroundColor DarkGray
            Write-Host (Format-Cell ([string]$row.Name) 14) -NoNewline
            Write-Host " | " -NoNewline -ForegroundColor DarkGray
            Write-Host (Format-Cell ([string]$row.Port) 4) -NoNewline
            Write-Host " | " -NoNewline -ForegroundColor DarkGray
            Write-StatusWithColor ([string]$row.Status)
            Write-Host " | " -NoNewline -ForegroundColor DarkGray
            Write-Host (Format-Cell ([string]$row.Detail) 20) -NoNewline
            Write-Host " | " -NoNewline -ForegroundColor DarkGray
            Write-Host (Format-Cell ([string]$row.Pids) 8) -NoNewline
            Write-Host " |" -ForegroundColor DarkGray
        }
        else {
            Write-Host $button
        }
    }

    Write-Host "+------------------------+   +----------------+------+------------+----------------------+----------+" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host ("Last updated at: {0:dd.MM.yyyy HH:mm:ss} Estonia time ({1})" -f $nowEt, $age) -ForegroundColor DarkCyan
    Write-Host "Last action: $LastAction" -ForegroundColor DarkGray
}

function Invoke-StartAll {
    if (-not (Test-Path $StartScript)) {
        $script:LastAction = "start_win.cmd missing; cannot start all."
        return
    }
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "`"$StartScript`"" -WorkingDirectory $RepoRoot.Path
    $script:LastAction = "Start All launched start_scripts\windows\start_win.cmd in a separate terminal."
}

function Invoke-StopAll {
    if (-not (Test-Path $StopScript)) {
        $script:LastAction = "start_scripts\windows\STOP_ALL_WIN.PS1 missing; cannot stop all."
        return
    }
    try {
        & $StopScript
        $script:LastAction = "Stop All completed."
    }
    catch {
        $script:LastAction = "Stop All failed: $($_.Exception.Message)"
    }
}

function Read-KeyOrTimeout([int]$TimeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            if ($Host.UI.RawUI.KeyAvailable) {
                $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                return $key.Character
            }
        }
        catch {
            # Some terminals do not support KeyAvailable. Fall back to timed refresh.
            return $null
        }
        Start-Sleep -Milliseconds 200
    }
    return $null
}

while ($true) {
    $rows = Get-ComponentStatuses
    $script:LastUpdated = Get-Date
    Render-Menu -Rows $rows
    $key = Read-KeyOrTimeout -TimeoutSeconds $RefreshSeconds
    if ($null -eq $key) { continue }
    $keyText = ([string]$key).ToUpperInvariant()
    if ($keyText -eq "1") { Invoke-StartAll }
    elseif ($keyText -eq "2") { Invoke-StopAll }
    elseif ($keyText -eq "3") { $script:LastAction = "Manual refresh requested." }
    elseif ($keyText -eq "Q") { break }
}

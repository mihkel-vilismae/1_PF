# PF_login component status monitor for Windows launchers.
# Shows live API and dashboard reachability from a lightweight terminal.
# Reads backend/dashboard versions from repo metadata without starting services.
# Keeps monitoring until the operator closes the terminal or presses Ctrl+C.
# Avoids secrets, payloads, and provider output in terminal status rows.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ApiUrl = "http://127.0.0.1:4301/api/auth/status"
$ApiDisplayUrl = "http://127.0.0.1:4301"
$DashboardUrl = "http://localhost:5173"
$RefreshSeconds = 3

<#
Reads the backend version from VERSION and falls back to unknown when unavailable.
#>
function Get-BackendVersion {
    $versionPath = Join-Path $RepoRoot "VERSION"
    if (Test-Path $versionPath) {
        $value = (Get-Content -Path $versionPath -Raw).Trim()
        if ($value.Length -gt 0) {
            return $value
        }
    }
    return "unknown"
}

<#
Reads the dashboard/package version from package.json and falls back to VERSION.
#>
function Get-DashboardVersion {
    $packagePath = Join-Path $RepoRoot "package.json"
    if (Test-Path $packagePath) {
        try {
            $packageJson = Get-Content -Path $packagePath -Raw | ConvertFrom-Json
            if ($packageJson.version) {
                return [string]$packageJson.version
            }
        }
        catch {
            return Get-BackendVersion
        }
    }
    return Get-BackendVersion
}

<#
Checks an HTTP endpoint and returns a safe status object for terminal display.
#>
function Test-HttpEndpoint {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Url
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -Method GET
        return [pscustomobject]@{
            Running = $true
            Status = "RUNNING"
            Code = [int]$response.StatusCode
            Detail = "HTTP $($response.StatusCode)"
        }
    }
    catch {
        return [pscustomobject]@{
            Running = $false
            Status = "WAITING"
            Code = $null
            Detail = $_.Exception.Message
        }
    }
}

<#
Writes one formatted row for a component, including name, URL, version, and status.
#>
function Write-ComponentRow {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,
        [Parameter(Mandatory = $true)]
        [string] $Version,
        [Parameter(Mandatory = $true)]
        [string] $Url,
        [Parameter(Mandatory = $true)]
        [object] $Status
    )

    $color = if ($Status.Running) { "Green" } else { "Yellow" }
    Write-Host ("{0,-12} v{1,-8} {2,-8} {3}" -f $Name, $Version, $Status.Status, $Url) -ForegroundColor $color
    Write-Host ("{0,-12} detail: {1}" -f "", $Status.Detail) -ForegroundColor DarkGray
}

<#
Runs the terminal monitor loop until the operator closes it.
#>
function Start-ComponentStatusMonitor {
    $backendVersion = Get-BackendVersion
    $dashboardVersion = Get-DashboardVersion

    while ($true) {
        Clear-Host
        Write-Host "PF_login component status monitor" -ForegroundColor Cyan
        Write-Host ("Repo: {0}" -f $RepoRoot.Path) -ForegroundColor DarkGray
        Write-Host ("Updated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor DarkGray
        Write-Host ""

        $apiStatus = Test-HttpEndpoint -Url $ApiUrl
        $dashboardStatus = Test-HttpEndpoint -Url $DashboardUrl

        Write-ComponentRow -Name "API" -Version $backendVersion -Url $ApiDisplayUrl -Status $apiStatus
        Write-Host ""
        Write-ComponentRow -Name "Dashboard" -Version $dashboardVersion -Url $DashboardUrl -Status $dashboardStatus

        Write-Host ""
        Write-Host ("Refresh: every {0}s. Close this window or press Ctrl+C to stop monitoring." -f $RefreshSeconds) -ForegroundColor DarkGray
        Start-Sleep -Seconds $RefreshSeconds
    }
}

Start-ComponentStatusMonitor

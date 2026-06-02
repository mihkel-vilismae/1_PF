# Windows mpv installer for PF_login native playback.
# Keeps third-party mpv binaries outside Git while making the repo-local path reproducible.
# Downloads a documented shinchiro Windows build only when tools/mpv/windows/mpv.exe is missing.
# Verifies mpv with a safe version command and writes sanitized install evidence under runtime_data/proofs.
# The script never starts fullscreen playback and is safe to call from start_win_full.cmd via PowerShell.

[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$ReleaseApiUrl = "https://api.github.com/repos/shinchiro/mpv-winbuild-cmake/releases/latest",
    [string]$AssetPattern = "mpv-x86_64-v3-*.7z",
    [switch]$ForceReinstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$TargetDirectory = Join-Path $RepoRoot "tools\mpv\windows"
$TargetExe = Join-Path $TargetDirectory "mpv.exe"
$EvidenceDirectory = Join-Path $RepoRoot "runtime_data\proofs"

<#
Writes a compact sanitized JSON evidence file for installer status.
#>
function Write-InstallEvidence {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Status,
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [hashtable]$Extra = @{}
    )

    New-Item -ItemType Directory -Force -Path $EvidenceDirectory | Out-Null
    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ss-fffZ")
    $outputPath = Join-Path $EvidenceDirectory "mpv_windows_install_$timestamp.json"
    $payload = [ordered]@{
        proof_kind = "mpv_windows_install"
        proof_status = $Status
        proof_timestamp = (Get-Date).ToUniversalTime().ToString("o")
        target_path = "tools/mpv/windows/mpv.exe"
        message = $Message
        evidence = $Extra
        known_limitations = @(
            "This installer only makes mpv available for native playback; it does not prove live fullscreen playback.",
            "The live native playback proof remains opt-in and must be run separately."
        )
    }

    $payload | ConvertTo-Json -Depth 8 | Set-Content -Path $outputPath -Encoding UTF8
    Write-Host "[INFO] Wrote mpv install evidence: $outputPath"
}

<#
Runs mpv with --version to prove the discovered binary is executable.
#>
function Test-MpvExecutable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$MpvPath
    )

    if (-not (Test-Path $MpvPath)) {
        return @{ ok = $false; summary = "mpv.exe not found" }
    }

    try {
        $output = & $MpvPath --version 2>&1 | Select-Object -First 3
        $exitCode = $LASTEXITCODE
        return @{
            ok = ($exitCode -eq 0)
            summary = (($output -join "`n") -replace $RepoRoot, "[REPO_ROOT]")
            exit_code = $exitCode
        }
    }
    catch {
        return @{ ok = $false; summary = $_.Exception.Message; exit_code = $null }
    }
}

<#
Selects the preferred downloadable mpv archive from the latest release metadata.
#>
function Get-MpvReleaseAsset {
    Write-Host "[INFO] Fetching mpv release metadata: $ReleaseApiUrl"
    $release = Invoke-RestMethod -Uri $ReleaseApiUrl -Headers @{ "User-Agent" = "PF-login-mpv-installer" }
    $assets = @($release.assets)
    $match = $assets | Where-Object { $_.name -like $AssetPattern } | Select-Object -First 1
    if ($null -eq $match) {
        $match = $assets | Where-Object { $_.name -like "mpv-x86_64-*.7z" -and $_.name -notlike "*dev*" } | Select-Object -First 1
    }
    if ($null -eq $match) {
        throw "No suitable mpv Windows x86_64 archive asset found in latest shinchiro release."
    }

    return @{
        name = [string]$match.name
        url = [string]$match.browser_download_url
        release = [string]$release.tag_name
    }
}

<#
Extracts a downloaded archive with tar.exe, which is available on supported Windows versions.
#>
function Expand-MpvArchive {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ArchivePath,
        [Parameter(Mandatory = $true)]
        [string]$Destination
    )

    $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
    if ($null -eq $tar) {
        throw "tar.exe was not found. Cannot extract mpv .7z archive automatically."
    }

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    & $tar.Source -xf $ArchivePath -C $Destination
    if ($LASTEXITCODE -ne 0) {
        throw "tar.exe failed to extract mpv archive with exit code $LASTEXITCODE."
    }
}

<#
Copies the extracted mpv directory into the repo-local tools/mpv/windows folder.
#>
function Install-ExtractedMpv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ExtractDirectory
    )

    $mpvExe = Get-ChildItem -Path $ExtractDirectory -Filter "mpv.exe" -Recurse | Select-Object -First 1
    if ($null -eq $mpvExe) {
        throw "Extracted archive did not contain mpv.exe."
    }

    New-Item -ItemType Directory -Force -Path $TargetDirectory | Out-Null
    Copy-Item -Path (Join-Path $mpvExe.DirectoryName "*") -Destination $TargetDirectory -Recurse -Force
}

try {
    New-Item -ItemType Directory -Force -Path $TargetDirectory | Out-Null

    if ((Test-Path $TargetExe) -and -not $ForceReinstall) {
        Write-Host "[INFO] Existing repo-local mpv found: $TargetExe"
        $check = Test-MpvExecutable -MpvPath $TargetExe
        if ($check.ok) {
            Write-Host "[OK] Existing mpv verified."
            Write-InstallEvidence -Status "PASSED" -Message "Existing repo-local mpv.exe verified." -Extra @{ version_summary = $check.summary; installed = $false }
            exit 0
        }

        Write-Host "[WARN] Existing mpv did not verify. Reinstalling. $($check.summary)"
    }

    $asset = Get-MpvReleaseAsset
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("pf-mpv-install-" + [System.Guid]::NewGuid().ToString("N"))
    $archivePath = Join-Path $tempRoot $asset.name
    $extractPath = Join-Path $tempRoot "extract"
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

    Write-Host "[INFO] Downloading $($asset.name) from shinchiro/mpv-winbuild-cmake release $($asset.release)."
    Invoke-WebRequest -Uri $asset.url -OutFile $archivePath -Headers @{ "User-Agent" = "PF-login-mpv-installer" }
    Expand-MpvArchive -ArchivePath $archivePath -Destination $extractPath
    Install-ExtractedMpv -ExtractDirectory $extractPath

    $verify = Test-MpvExecutable -MpvPath $TargetExe
    if (-not $verify.ok) {
        throw "Installed mpv.exe failed verification. $($verify.summary)"
    }

    Write-Host "[OK] mpv installed and verified at $TargetExe"
    Write-InstallEvidence -Status "PASSED" -Message "Downloaded and verified repo-local mpv.exe." -Extra @{ asset = $asset.name; release = $asset.release; version_summary = $verify.summary; installed = $true }
    exit 0
}
catch {
    Write-Host "[BLOCKED] mpv auto-install could not complete: $($_.Exception.Message)"
    Write-InstallEvidence -Status "BLOCKED" -Message $_.Exception.Message -Extra @{ release_api_url = $ReleaseApiUrl; asset_pattern = $AssetPattern }
    exit 2
}

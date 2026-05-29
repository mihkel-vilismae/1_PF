<#
Installs a repo-local portable mpv build for Windows native playback.
Downloaded player binaries are placed under tools/mpv/windows, which is ignored.
The script uses the mpv Windows builds linked from the official mpv install page.
#>
param(
  [ValidateSet('x86_64-v3', 'x86_64')]
  [string]$Architecture = 'x86_64-v3',
  [string]$Destination = (Join-Path $PSScriptRoot 'mpv\windows'),
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$releaseApiUrl = 'https://api.github.com/repos/shinchiro/mpv-winbuild-cmake/releases/latest'

# Returns the repository root from the tools directory that owns this script.
function Resolve-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

# Verifies recursive writes and deletes stay under the intended repo-local mpv folder.
function Assert-SafeMpvDestination {
  param([string]$Path)

  $repoRoot = Resolve-RepoRoot
  $allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot 'tools\mpv'))
  $resolvedPath = [System.IO.Path]::GetFullPath($Path)
  if (-not $resolvedPath.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Destination must be under $allowedRoot. Refusing to write to $resolvedPath."
  }
  return $resolvedPath
}

# Selects the latest normal mpv archive for the requested Windows architecture.
function Get-MpvReleaseAsset {
  param([string]$Architecture)

  $release = Invoke-RestMethod -Uri $releaseApiUrl -Headers @{ 'User-Agent' = 'PF-login-mpv-installer' }
  $pattern = if ($Architecture -eq 'x86_64-v3') {
    '^mpv-x86_64-v3-.+\.7z$'
  } else {
    '^mpv-x86_64-\d.+\.7z$'
  }
  $asset = $release.assets | Where-Object { $_.name -match $pattern } | Select-Object -First 1
  if (-not $asset) {
    throw "No mpv Windows asset matching $Architecture was found in release $($release.tag_name)."
  }
  return $asset
}

# Downloads the selected mpv archive into a temporary installer workspace.
function Save-MpvArchive {
  param(
    [object]$Asset,
    [string]$TempDirectory
  )

  $archivePath = Join-Path $TempDirectory $Asset.name
  Invoke-WebRequest -Uri $Asset.browser_download_url -OutFile $archivePath -Headers @{ 'User-Agent' = 'PF-login-mpv-installer' }
  return $archivePath
}

# Extracts the mpv archive using Windows bsdtar and returns the extracted mpv folder.
function Expand-MpvArchive {
  param(
    [string]$ArchivePath,
    [string]$TempDirectory
  )

  $extractDirectory = Join-Path $TempDirectory 'extract'
  New-Item -ItemType Directory -Path $extractDirectory -Force | Out-Null
  & tar.exe -xf $ArchivePath -C $extractDirectory
  if ($LASTEXITCODE -ne 0) {
    throw 'tar.exe failed to extract the mpv archive.'
  }
  $mpvExe = Get-ChildItem -Path $extractDirectory -Recurse -Filter 'mpv.exe' | Select-Object -First 1
  if (-not $mpvExe) {
    throw 'The downloaded archive did not contain mpv.exe.'
  }
  return $mpvExe.Directory.FullName
}

# Replaces the repo-local mpv folder with the extracted portable player.
function Install-MpvDirectory {
  param(
    [string]$SourceDirectory,
    [string]$Destination
  )

  $safeDestination = Assert-SafeMpvDestination $Destination
  if ((Test-Path $safeDestination) -and -not $Force) {
    throw "Destination already exists: $safeDestination. Re-run with -Force to replace it."
  }
  if (Test-Path $safeDestination) {
    Remove-Item -LiteralPath $safeDestination -Recurse -Force
  }
  New-Item -ItemType Directory -Path (Split-Path $safeDestination -Parent) -Force | Out-Null
  Copy-Item -LiteralPath $SourceDirectory -Destination $safeDestination -Recurse
  return Join-Path $safeDestination 'mpv.exe'
}

$safeDestination = Assert-SafeMpvDestination $Destination
$tempDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "pf-login-mpv-$([System.Guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $tempDirectory -Force | Out-Null

try {
  $asset = Get-MpvReleaseAsset $Architecture
  Write-Host "Downloading $($asset.name)"
  $archivePath = Save-MpvArchive -Asset $asset -TempDirectory $tempDirectory
  $sourceDirectory = Expand-MpvArchive -ArchivePath $archivePath -TempDirectory $tempDirectory
  $mpvPath = Install-MpvDirectory -SourceDirectory $sourceDirectory -Destination $safeDestination
  & $mpvPath --version | Select-Object -First 1
  Write-Host "Installed mpv for native playback: $mpvPath"
} finally {
  if (Test-Path $tempDirectory) {
    Remove-Item -LiteralPath $tempDirectory -Recurse -Force
  }
}

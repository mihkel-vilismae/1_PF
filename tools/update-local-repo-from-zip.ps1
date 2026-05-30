param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath,

    [Parameter(Mandatory = $true)]
    [string]$RepoPath
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Message
    Write-Host "============================================================"
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message"
}

function Write-WarnLine {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-ErrorLine {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Resolve-SafeFullPath {
    param([string]$PathValue)

    $cleanPath = $PathValue.Trim()

    if (
        ($cleanPath.StartsWith('"') -and $cleanPath.EndsWith('"')) -or
        ($cleanPath.StartsWith("'") -and $cleanPath.EndsWith("'"))
    ) {
        $cleanPath = $cleanPath.Substring(1, $cleanPath.Length - 2)
    }

    return [System.IO.Path]::GetFullPath($cleanPath)
}

function Get-RepoRootFromExtractedZip {
    param([string]$ExtractRoot)

    $rootHasRepoMarkers =
        (Test-Path -LiteralPath (Join-Path $ExtractRoot ".git")) -or
        (Test-Path -LiteralPath (Join-Path $ExtractRoot "package.json")) -or
        (Test-Path -LiteralPath (Join-Path $ExtractRoot "README.md")) -or
        (Test-Path -LiteralPath (Join-Path $ExtractRoot "HOW_TO_RUN.md"))

    if ($rootHasRepoMarkers) {
        return $ExtractRoot
    }

    $childDirs = @(Get-ChildItem -LiteralPath $ExtractRoot -Directory -Force)
    $childFiles = @(Get-ChildItem -LiteralPath $ExtractRoot -File -Force)

    if ($childDirs.Count -eq 1 -and $childFiles.Count -eq 0) {
        return $childDirs[0].FullName
    }

    return $ExtractRoot
}

function Copy-DirectoryContents {
    param(
        [string]$Source,
        [string]$Destination
    )

    $excludeDirNames = @(
        "node_modules",
        "dist",
        "build",
        ".vite",
        ".next",
        "__pycache__"
    )

    $excludeFileNames = @(
        "*.log"
    )

    $robocopyArgs = @(
        $Source,
        $Destination,
        "/E",
        "/R:2",
        "/W:1",
        "/NFL",
        "/NDL",
        "/NP"
    )

    foreach ($dirName in $excludeDirNames) {
        $robocopyArgs += "/XD"
        $robocopyArgs += $dirName
    }

    foreach ($fileName in $excludeFileNames) {
        $robocopyArgs += "/XF"
        $robocopyArgs += $fileName
    }

    Write-Info "Running copy command..."
    Write-Info "Source:      $Source"
    Write-Info "Destination: $Destination"

    & robocopy @robocopyArgs
    $exitCode = $LASTEXITCODE

    if ($exitCode -ge 8) {
        throw "robocopy failed with exit code $exitCode"
    }

    Write-Info "robocopy exit code $exitCode means success or minor copy differences."
}

try {
    Write-Step "Repo ZIP Drop Installer"

    Write-Info "Raw ZIP path argument:  $ZipPath"
    Write-Info "Raw repo path argument: $RepoPath"

    $zipFullPath = Resolve-SafeFullPath $ZipPath
    $repoFullPath = Resolve-SafeFullPath $RepoPath
    $repoFullPath = $repoFullPath.TrimEnd("\", "/")

    Write-Info "ZIP path:  $zipFullPath"
    Write-Info "Repo path: $repoFullPath"

    if (-not (Test-Path -LiteralPath $zipFullPath -PathType Leaf)) {
        throw "ZIP file does not exist: $zipFullPath"
    }

    if ([System.IO.Path]::GetExtension($zipFullPath).ToLowerInvariant() -ne ".zip") {
        throw "Dropped file is not a .zip file: $zipFullPath"
    }

    if (-not (Test-Path -LiteralPath $repoFullPath -PathType Container)) {
        throw "Repo folder does not exist: $repoFullPath"
    }

    Write-Step "Safety check"

    Write-Host "This will copy files from the ZIP into:"
    Write-Host "  $repoFullPath"
    Write-Host ""
    Write-Host "It will create a backup first."
    Write-Host ""
    Write-WarnLine "Default mode overwrites/adds files but does NOT delete local files missing from the ZIP."
    Write-WarnLine "This is safer than mirror mode and avoids surprise deletion."

    $answer = Read-Host "Type YES to continue"
    if ($answer -ne "YES") {
        Write-WarnLine "Cancelled by user."
        return
    }

    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$repoFullPath`__backup_before_zip_install_$stamp"
    $tempPath = Join-Path $env:TEMP "repo_zip_install_$stamp"

    Write-Step "Create backup"
    Write-Info "Backup path: $backupPath"

    if (Test-Path -LiteralPath $backupPath) {
        throw "Backup path already exists: $backupPath"
    }

    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Copy-DirectoryContents -Source $repoFullPath -Destination $backupPath

    Write-Step "Extract ZIP"
    Write-Info "Temp path: $tempPath"

    if (Test-Path -LiteralPath $tempPath) {
        Remove-Item -LiteralPath $tempPath -Recurse -Force
    }

    New-Item -ItemType Directory -Path $tempPath | Out-Null
    Expand-Archive -LiteralPath $zipFullPath -DestinationPath $tempPath -Force

    Write-Step "Detect repo root inside ZIP"
    $extractedRoot = Get-RepoRootFromExtractedZip -ExtractRoot $tempPath

    Write-Info "Detected extracted root:"
    Write-Info $extractedRoot

    $markers = @()
    foreach ($marker in @(".git", "package.json", "README.md", "HOW_TO_RUN.md", "VERSION")) {
        if (Test-Path -LiteralPath (Join-Path $extractedRoot $marker)) {
            $markers += $marker
        }
    }

    if ($markers.Count -eq 0) {
        Write-WarnLine "No common repo markers were found in the detected root."
        Write-WarnLine "The copy can still continue, but check that this is the correct ZIP."
        $answer2 = Read-Host "Type YES to continue anyway"
        if ($answer2 -ne "YES") {
            Write-WarnLine "Cancelled by user."
            return
        }
    } else {
        Write-Info "Found repo markers: $($markers -join ', ')"
    }

    Write-Step "Copy ZIP contents over local repo"
    Copy-DirectoryContents -Source $extractedRoot -Destination $repoFullPath

    Write-Step "Cleanup"
    Remove-Item -LiteralPath $tempPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Info "Removed temp folder."

    Write-Step "Done"
    Write-Host "Updated repo folder:"
    Write-Host "  $repoFullPath"
    Write-Host ""
    Write-Host "Backup saved here:"
    Write-Host "  $backupPath"
    Write-Host ""
    Write-Host "Suggested next checks:"
    Write-Host "  git status"
    Write-Host "  npm install --verbose"
    Write-Host "  npm test"
    Write-Host ""
    Write-Host "This terminal stays open because the CMD launcher uses PowerShell -NoExit."
}
catch {
    Write-Step "Failed"
    Write-ErrorLine $_.Exception.Message
    Write-Host ""
    Write-Host "The terminal is intentionally left open so you can read this error."
}

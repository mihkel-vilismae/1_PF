# tools/clean-git-folder-safe.ps1
# Safe Git repository cleanup for Windows 11.
# Run from anywhere inside the repository.
#
# This script does NOT manually delete random .git files.
# It uses Git's own cleanup commands.

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Text)

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Text
    Write-Host "============================================================"
}

function Get-FolderSizeMB {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return 0
    }

    $bytes = (
        Get-ChildItem -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum
    ).Sum

    if ($null -eq $bytes) {
        return 0
    }

    return [math]::Round($bytes / 1MB, 2)
}

function Test-CommandExists {
    param([string]$Command)

    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

Write-Section "Git folder cleanup started"

if (-not (Test-CommandExists "git")) {
    Write-Error "Git is not installed or not available in PATH."
    exit 1
}

$repoRoot = git rev-parse --show-toplevel 2>$null

if (-not $repoRoot) {
    Write-Error "This folder is not inside a Git repository. Run this script from inside a repo folder."
    exit 1
}

Set-Location $repoRoot

$gitDir = git rev-parse --git-dir
$gitDirFullPath = (Resolve-Path -LiteralPath $gitDir).Path

Write-Host "Repository root: $repoRoot"
Write-Host "Git directory:    $gitDirFullPath"

$beforeSize = Get-FolderSizeMB $gitDirFullPath
Write-Host "Git folder size before cleanup: $beforeSize MB"

Write-Section "Checking repository status"

$status = git status --short

if ($status) {
    Write-Warning "Working tree has uncommitted changes."
    Write-Warning "This cleanup is still usually safe, but commit/stash first if you are unsure."
    Write-Host ""
    git status --short
} else {
    Write-Host "Working tree is clean."
}

Write-Section "Showing Git object statistics before cleanup"
git count-objects -vH

Write-Section "Expiring old reflog entries"

# This makes old unreachable commits eligible for pruning.
# WARNING: After this, recovering deleted commits from reflog may no longer be possible.
git reflog expire --expire=now --expire-unreachable=now --all

Write-Section "Pruning unreachable objects"
git prune --expire=now

Write-Section "Running aggressive garbage collection"

# --aggressive can take longer, but is useful when .git is very large.
git gc --prune=now --aggressive

Write-Section "Optional Git LFS cleanup"

if (Test-CommandExists "git-lfs") {
    Write-Host "Git LFS detected. Running git lfs prune..."
    git lfs prune
} else {
    Write-Host "Git LFS not detected. Skipping LFS cleanup."
}

Write-Section "Showing Git object statistics after cleanup"
git count-objects -vH

$afterSize = Get-FolderSizeMB $gitDirFullPath
$savedSize = [math]::Round($beforeSize - $afterSize, 2)

Write-Section "Cleanup result"

Write-Host "Git folder size before: $beforeSize MB"
Write-Host "Git folder size after:  $afterSize MB"
Write-Host "Approx. space saved:    $savedSize MB"

Write-Section "Finding largest remaining Git objects"

# This section is inspection-only.
# It helps identify files that are still large in Git history.
# It does not delete anything.

$packDir = Join-Path $gitDirFullPath "objects\pack"
$idxFiles = Get-ChildItem -LiteralPath $packDir -Filter "*.idx" -ErrorAction SilentlyContinue

if (-not $idxFiles) {
    Write-Host "No pack index files found. Skipping largest-object inspection."
} else {
    $revListObjects = git rev-list --objects --all
    $packedObjects = @()

    foreach ($idxFile in $idxFiles) {
        $verifyLines = git verify-pack -v $idxFile.FullName 2>$null

        foreach ($line in $verifyLines) {
            if ($line -match "\sblob\s") {
                $parts = $line -split "\s+"

                if ($parts.Length -ge 5) {
                    $packedObjects += [PSCustomObject]@{
                        Sha         = $parts[0]
                        Type        = $parts[1]
                        SizeBytes   = [int64]$parts[2]
                        PackedBytes = [int64]$parts[3]
                    }
                }
            }
        }
    }

    if (-not $packedObjects) {
        Write-Host "No packed blob objects found."
    } else {
        $packedObjects |
            Sort-Object SizeBytes -Descending |
            Select-Object -First 20 |
            ForEach-Object {
                $objectInfo = $_
                $pathMatch = $revListObjects | Select-String -SimpleMatch $objectInfo.Sha | Select-Object -First 1

                [PSCustomObject]@{
                    SizeMB   = [math]::Round($objectInfo.SizeBytes / 1MB, 2)
                    PackedMB = [math]::Round($objectInfo.PackedBytes / 1MB, 2)
                    Sha      = $objectInfo.Sha
                    Path     = if ($pathMatch) {
                        ($pathMatch.ToString() -replace "^$($objectInfo.Sha)\s*", "")
                    } else {
                        ""
                    }
                }
            } |
            Format-Table -AutoSize
    }
}

Write-Section "Done"

Write-Host "Safe cleanup completed."
Write-Host ""
Write-Host "If .git is still too large, the large files are probably committed in history."
Write-Host "In that case, use git filter-repo or BFG Repo-Cleaner, but only after making a backup."
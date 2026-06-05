# Windows live scheduler proof runner for PF_login / 1234_PF.
# Runs the blocked-by-default scheduler proof through a dedicated proof-owned launcher.
# Separates CronEmulator contract evidence from real Windows scheduler evidence.
# Packs runtime logs/proofs/artifacts into a Downloads evidence ZIP for easy upload.
# Stops no arbitrary system processes and does not claim Raspberry cron or reboot behavior.

[CmdletBinding()]
param(
    [switch] $SkipEvidenceCleanup,
    [string] $RepoRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $PSCommandPath }
    $RepoRoot = (Resolve-Path (Join-Path $scriptRoot "..")).Path
} else {
    $RepoRoot = (Resolve-Path $RepoRoot).Path
}

<#
Writes a timestamped runner message for clear operator-visible proof progress.
#>
function Write-ProofStep {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message,
        [string] $Color = "Cyan"
    )
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

<#
Runs one command in the repository root and throws when it exits with a non-zero code.
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

    Write-ProofStep $StepName
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
Removes generated evidence from prior runs while preserving tracked placeholders/docs.
#>
function Clear-GeneratedEvidence {
    if ($SkipEvidenceCleanup) {
        Write-ProofStep "Skipping evidence cleanup by request." "Yellow"
        return
    }

    Write-ProofStep "Cleaning generated logs/proofs/artifacts for a fresh scheduler proof." "Yellow"
    foreach ($relativePath in @("runtime_data\proofs", "runtime_data\artifacts", "runtime_data\reports", "logs")) {
        $path = Join-Path $RepoRoot $relativePath
        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Force -Path $path | Out-Null
            continue
        }

        Get-ChildItem $path -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notin @(".gitkeep", "README.md") } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}

<#
Runs the live scheduler proof with an explicit opt-in flag.
#>
function Invoke-LiveSchedulerProof {
    $previous = @{
        PF_LIVE_WINDOWS_SCHEDULER_PROOF = $env:PF_LIVE_WINDOWS_SCHEDULER_PROOF
        PF_LIVE_WINDOWS_SCHEDULER_ORCHESTRATE = $env:PF_LIVE_WINDOWS_SCHEDULER_ORCHESTRATE
        PF_API_BASE_URL = $env:PF_API_BASE_URL
    }
    try {
        $env:PF_LIVE_WINDOWS_SCHEDULER_PROOF = "1"
        $env:PF_LIVE_WINDOWS_SCHEDULER_ORCHESTRATE = "1"
        $env:PF_API_BASE_URL = "http://127.0.0.1:4301"
        Invoke-RepoCommand -FilePath "npm" -Arguments @("run", "proof:live-windows-scheduler") -StepName "Run live Windows scheduler proof"
    }
    finally {
        foreach ($key in $previous.Keys) {
            if ($null -eq $previous[$key]) { Remove-Item "Env:\$key" -ErrorAction SilentlyContinue } else { Set-Item "Env:\$key" $previous[$key] }
        }
    }
}

<#
Packs logs, reports, artifacts, and proof JSON into a Downloads ZIP and opens Explorer.
#>
function Export-EvidenceZip {
    $stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $downloads = Join-Path $env:USERPROFILE "Downloads"
    $outDir = Join-Path $downloads "PF_login_live_windows_scheduler_evidence_$stamp"
    $zipPath = "$outDir.zip"
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null

    foreach ($relativeSource in @("runtime_data\proofs", "runtime_data\artifacts", "runtime_data\reports", "logs")) {
        $source = Join-Path $RepoRoot $relativeSource
        if (Test-Path $source) {
            $destination = Join-Path $outDir (Split-Path $relativeSource -Leaf)
            Copy-Item $source $destination -Recurse -Force
        }
    }

    $latestProof = Get-ChildItem (Join-Path $RepoRoot "runtime_data\proofs\live_windows_scheduler_*.json") -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    $summaryPath = Join-Path $outDir "summary.txt"
    @"
PF_login live Windows scheduler proof bundle
Generated: $(Get-Date -Format o)
Repo: $RepoRoot
Version: $(Get-Content (Join-Path $RepoRoot 'VERSION') -Raw)
Git:
$(git -C $RepoRoot log --oneline -5 | Out-String)
Git status:
$(git -C $RepoRoot status --short | Out-String)
latest proof: $($latestProof.FullName)
Boundary: live scheduler proof is separate from Raspberry cron, Windows reboot, and deterministic CronEmulator-only evidence.
"@ | Set-Content -Path $summaryPath -Encoding UTF8

    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path "$outDir\*" -DestinationPath $zipPath -Force
    Write-ProofStep "Evidence ZIP created: $zipPath" "Green"
    explorer.exe /select,"$zipPath"
}

try {
    Write-ProofStep "PF_login live Windows scheduler proof launcher."
    Push-Location $RepoRoot
    try {
        Clear-GeneratedEvidence
        Invoke-RepoCommand -FilePath "npm" -Arguments @("install", "--verbose") -StepName "Install dependencies"
        $proofFailure = $null
        try {
            Invoke-LiveSchedulerProof
        }
        catch {
            $proofFailure = $_
            Write-ProofStep "Live scheduler proof failed; exporting evidence before exiting." "Yellow"
        }
        Export-EvidenceZip
        if ($null -ne $proofFailure) {
            throw $proofFailure
        }
    }
    finally {
        Pop-Location
    }
}
catch {
    throw
}

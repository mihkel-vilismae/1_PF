param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $AppArgs
)
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot
$env:PYTHONPATH = Join-Path $repoRoot "src"
python -m cronemulator.app @AppArgs

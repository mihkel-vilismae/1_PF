# Proofrunner handoff launcher contract OpenSpec

Status: active launcher contract for generated 2proofrunner handoffs.

## Requirement

Windows and Raspberry proofrunner handoffs must validate the repo ZIP they extract before running proof queues. Windows baseline verification must read `VERSION`, `package.json`, and Git HEAD from the extracted repo root, not from the launcher directory.

## Windows launcher rules

- Do not call `.Trim()` on possibly-null external command output.
- Prefer PowerShell `Get-Content ... | ConvertFrom-Json` for `package.json` version reads.
- Use `git -C $RepoRoot rev-parse --short HEAD` for Git HEAD.
- Emit actionable baseline-verification errors.

## Handoff validation rules

- Bash launcher: syntax check and expected marker check.
- PowerShell launcher: expected marker check and proof of null-safe, repo-root-scoped package/Git reads.
- Bash-only validation cannot certify a Windows+Raspberry handoff.

## Non-claims

This contract does not prove provider login, real download, real geocode, product pipeline, hardware display, or v1 readiness.

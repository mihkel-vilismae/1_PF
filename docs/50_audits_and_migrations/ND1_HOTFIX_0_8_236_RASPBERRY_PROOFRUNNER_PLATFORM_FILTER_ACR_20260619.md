# ND1 hotfix v0.8.236 — Raspberry proofrunner platform filter ACR

## Baseline

- Previous version: `0.8.235`
- Previous HEAD: `b0b315b`
- Evidence input: `PF_login_v0.8.235_raspberryos_proof_results_20260619_233511.zip`

## 3xACR analysis

| Pass | Result |
|---|---|
| Analyze | The RaspberryOS proof run executed successfully enough to prove `proof:full-test` and the new auth operator 2FA checkpoint, but shell summary had five failures. Four failures were Windows-only `:windows` wrapper proofs run on Raspberry/Linux, each failing with `powershell: not found`. The fifth was `proof:proof-runner-final-summary`, which correctly failed because shell-level failures existed. |
| Critique | Fixing final summary would be wrong: it is behaving honestly. The root issue is the handoff launcher queue discovery, which blindly ran every `proof:*` package script on Raspberry instead of using the repo-owned queue helper that can exclude Windows aliases. |
| Refine | Add a platform-filter contract proof and regenerate the Raspberry launcher to use `buildProofRunnerQueuePlanForMode(... includeWindowsAliases:false)`. Preserve Windows launcher behavior so Windows-only wrapper proofs still run on Windows. |

## Implemented scope

- Added `proof:proofrunner-platform-filter-contract`.
- Added tests for Raspberry exclusion and Windows preservation of `:windows` aliases.
- Documented the platform-filter contract.
- Regenerated the handoff launcher plan so RaspberryOS skips Windows-only aliases explicitly.

## Preserved behavior

- Windows wrapper proof package scripts remain in `package.json`.
- Windows launchers still include Windows-only wrapper proofs.
- Final-summary shell-failure honesty remains unchanged.
- Existing auth/login/2FA checkpoint behavior from v0.8.235 is preserved.

## Non-claims

- This does not prove real iCloud login, file download, filtered continuation, geocode, overlay, or Raspberry v1 readiness.
- This only fixes the proofrunner platform queue issue found in the v0.8.235 RaspberryOS upload.

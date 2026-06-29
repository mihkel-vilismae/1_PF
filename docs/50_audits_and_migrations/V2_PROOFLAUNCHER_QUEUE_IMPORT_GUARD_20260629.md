# V2 prooflauncher queue import guard — 2026-06-29

## Baseline

- Previous version: `0.10.92`
- Previous HEAD: `66164ae`
- Target slice: generated prooflauncher queue discovery safety.

## 3xACR analysis

| Pass | Result |
|---|---|
| Analyze | The generated v0.10.92 handoff launchers write `discover-proof-queue.mjs` outside the extracted repo, then import `./tools/proof-runner-queue-lib.mjs`. Node ESM resolves that relative import from the generated helper file location, not from the shell current working directory. |
| Critique | This can break queue discovery with `ERR_MODULE_NOT_FOUND` even when the launcher performs `cd "$repo_root"` / `Push-Location $RepoRoot` before calling `node`. The existing static contract only checked current working directory and did not catch helper-file location. |
| Refine | Treat `tools/proof-runner-queue-lib.mjs` as the queue authority, but require generated launchers to execute the queue helper by repo-root stdin/module text, absolute repo-root import, or a temporary helper written at the extracted repo root. Queue discovery failure or zero proofs remains a hard launcher failure. |

## Implemented scope

- Added static detection for the unsafe run-folder temp helper plus relative `./tools/proof-runner-queue-lib.mjs` import pattern.
- Added Bash and PowerShell regression tests for the exact unsafe generated-helper pattern.
- Added an accepted PowerShell pattern where `discover-proof-queue.mjs` is written at `$RepoRoot`, making `./tools/...` resolve correctly.

## Preserved behavior

- `tools/proof-runner-queue-lib.mjs` remains the single queue-order authority.
- Final summary proofs remain last.
- Windows launchers keep Windows-only `:windows` proof aliases.
- Raspberry/Linux launchers exclude Windows-only `:windows` proof aliases and record skipped aliases.
- This slice does not change runtime worker behavior, dashboard readiness rings, iCloud/auth, cron, playback, PIR, or recovery logic.

## Non-claims

This is a generated-launcher/static-contract hardening slice. It does not prove live Raspberry readiness, real iCloud auth, production cron, native display playback, PIR behavior, or physical recovery success.

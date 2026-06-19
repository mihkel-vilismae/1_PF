# ND1 hotfix v0.8.237 — Raspberry proof queue discovery cwd ACR

## Baseline

- Previous version: `0.8.236`
- Previous HEAD: `6ae79ff`
- User-observed failure: Raspberry launcher tried to import `./tools/proof-runner-queue-lib.mjs` from the handoff folder and then packaged an empty zero-proof run.

## 3xACR analysis

| Pass | Result |
|---|---|
| Analyze | v0.8.236 fixed the platform-filter model in repo code, but the generated Raspberry launcher executed the Node queue helper from the handoff folder instead of `$REPO_ROOT`. Relative import `./tools/proof-runner-queue-lib.mjs` therefore failed with `ERR_MODULE_NOT_FOUND`. |
| Critique | The launcher then continued with an empty proof list and reported zero passed/zero failed, which is misleading. Queue discovery failure must be a hard launcher failure. |
| Refine | Run queue discovery inside the extracted repo root and fail fast if discovery fails or returns zero proofs. Keep platform filtering unchanged: Raspberry excludes `:windows`, Windows preserves them. |

## Implemented scope

- Strengthened the platform-filter handoff contract to require queue helper execution from `$REPO_ROOT`.
- Strengthened the contract to reject empty queue success.
- Regenerated Raspberry launcher with fail-fast queue discovery.

## Preserved behavior

- Windows launcher still includes Windows-only aliases.
- Raspberry launcher still excludes Windows-only aliases.
- Final summary honesty remains unchanged.
- Auth operator 2FA checkpoint behavior remains unchanged.

## Non-claims

This does not prove real iCloud auth, real downloads, filtered continuation, or Raspberry v1 readiness. It only fixes launcher queue discovery.

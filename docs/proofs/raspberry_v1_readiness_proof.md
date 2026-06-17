# Raspberry v1.0 readiness proof

`npm run proof:raspberry-v1-readiness` evaluates latest local proof artifacts against the answered v1.0 question matrix.

## Command

```bash
npm run proof:raspberry-v1-readiness
```

## What it checks

The runner scans `runtime_data/proofs/*.json`, keeps the latest artifact for each `proof_kind`, then evaluates required Raspberry v1.0 release gates.

Required gates include Raspberry target tooling, install/runtime preflight, real iCloudPD media source, real GPS/geocode, real regular worker product pipeline, native image/video playback, address overlay on the device display, full cron app-running workflow, proof-backed dashboard status, non-blocking screen worker behavior, and documentation reconciliation.

## PASS criteria

The proof returns `PASSED` only when every v1.0-required gate has the latest required proof artifacts with `proof_status: "PASSED"`. Command exit code is not used as proof truth; the readiness evaluator reads the artifact status.

## BLOCKED criteria

The proof returns `BLOCKED` when a required gate has missing, planned, blocked, partial, timed-out, failed, or unknown proof status.

## Non-claims

This proof does not run the missing product proofs by itself, does not validate real iCloud/GPS/geocode without corresponding proof artifacts, does not claim reboot or physical power-loss recovery for v1.0, and does not treat Windows evidence as Raspberry v1.0 evidence. A repaired standalone app-running proof removes only that specific blocker; it does not imply v1 readiness while real provider, product-pipeline, display, dashboard, screen-worker, or planned proof gates remain blocked or missing.
